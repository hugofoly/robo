# -*- coding: utf-8 -*-
"""Gera a narração (voz-guia) de cada linha, trata o áudio e confere por transcrição.

Uso: python voice.py   (gera TAKES tomadas por linha e escolhe a melhor pela
                        transcrição do Whisper; relatório em $BUILD/qa/voice_asr.tsv)

Saída: $BUILD/voice/<conceito>/<linha>.wav (48 kHz mono) + meta.json com durações.
Se existir $BUILD/voice_clone/<conceito>/<linha>.wav (gerado por clone_voice.py),
o timeline usa esse arquivo no lugar da voz-guia.
"""
import json, os, re, subprocess, sys, unicodedata, difflib
from content import CONCEPTS
from tts_backend import synth, asr

BUILD = os.environ.get('BUILD', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'build'))

# Direção por "beat": velocidade relativa e cadeia de tratamento.
CHAIN = ('highpass=f=75,'
         'equalizer=f=160:t=q:w=1.0:g=2.5,'      # corpo/calor
         'equalizer=f=3400:t=q:w=1.2:g=3,'       # presença/inteligibilidade
         'equalizer=f=7600:t=q:w=2:g=-2.5,'      # suaviza sibilância
         'acompressor=threshold=-20dB:ratio=3:attack=6:release=90:makeup=3,'
         'silenceremove=start_periods=1:start_threshold=-58dB:start_silence=0.08,'
         'areverse,silenceremove=start_periods=1:start_threshold=-58dB:start_silence=0.12,areverse,'
         'aresample=48000')


def lines_of(c):
    seen = {}
    for h in c['hooks'].values():
        for l in h:
            seen[l['id']] = l
    for l in c['body']:
        seen[l['id']] = l
    return list(seen.values())


SYN = {'estava': 'tava', 'esta': 'ta', 'para': 'pra', 'kakaka': 'kkk', 'cacaca': 'kkk', 'hahaha': 'kkk',
       'robodate': 'robo de date', 'robot': 'robo', 'date': 'date', 'por que': 'porque'}


def norm(s):
    s = re.sub(r'<[^>]+>|\*', '', s.lower())
    s = unicodedata.normalize('NFD', s)
    s = ''.join(ch for ch in s if unicodedata.category(ch) != 'Mn')
    s = re.sub(r'[^a-z0-9 ]+', ' ', s)
    s = s.replace('por que', 'porque').replace('robodate', 'robo de date')
    return [SYN.get(w, w) for w in s.split()]


def score(cap, heard):
    return difflib.SequenceMatcher(None, norm(cap), norm(heard)).ratio()


TAKES = int(os.environ.get('TAKES', 6))
ONLY = [x for x in os.environ.get('ONLY', '').split(',') if x]  # ex.: ONLY=C3:hA2,C1:cta


def main(qa=True):
    report = []
    for c in CONCEPTS:
        d = f'{BUILD}/voice/{c["code"]}'
        os.makedirs(d, exist_ok=True)
        meta = json.load(open(f'{d}/meta.json')) if ONLY and os.path.exists(f'{d}/meta.json') else {}
        for l in lines_of(c):
            if ONLY and f'{c["code"]}:{l["id"]}' not in ONLY:
                continue
            out = f'{d}/{l["id"]}.wav'
            best = None
            for k in range(TAKES):
                raw = f'{d}/{l["id"]}_raw.wav'
                take = f'{d}/{l["id"]}_take{k}.wav'
                synth(l['say'], raw, speed=l.get('speed', 1.0))
                subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', raw, '-af', CHAIN, '-ac', '1', take], check=True)
                os.remove(raw)
                heard = asr(take)
                sc = score(l['cap'], heard)
                if best is None or sc > best[0]:
                    best = (sc, take, heard)
                if sc >= 0.999:
                    break
            os.replace(best[1], out)
            for k in range(TAKES):
                p = f'{d}/{l["id"]}_take{k}.wav'
                if os.path.exists(p):
                    os.remove(p)
            dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                                                 '-of', 'csv=p=0', out]).decode())
            meta[l['id']] = round(dur, 3)
            report.append((c['code'], l['id'], round(best[0], 2), l['cap'], best[2]))
            print(c['code'], l['id'], meta[l['id']], flush=True)
        json.dump(meta, open(f'{d}/meta.json', 'w'), indent=1)
    if not ONLY:
        os.makedirs(f'{BUILD}/qa', exist_ok=True)
        with open(f'{BUILD}/qa/voice_asr.tsv', 'w') as f:
            f.write('conceito\tlinha\tsimilaridade\tlegenda\ttranscricao_whisper\n')
            for r in report:
                f.write('\t'.join(map(str, r)) + '\n')
        for r in report:
            flag = '  <-- revisar' if r[2] < 0.75 else ''
            print(f'{r[0]} {r[1]:4s} {r[2]:.2f} | {r[4]}{flag}')


if __name__ == '__main__':
    main()
