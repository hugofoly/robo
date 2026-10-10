# -*- coding: utf-8 -*-
"""Voz clonada LOCAL (YourTTS zero-shot, Coqui) a partir de amostras autorizadas do Hugo.

Escolhida pelo Hugo ("Opção 1") em teste A/B contra kNN-VC. Gera TAKES tomadas por
fala (grafia fonética e grafia normal) e escolhe a melhor pela transcrição (Whisper).

Uso:
  python clone_local.py --ref amostra1.wav --ref amostra2.wav ...
  python timeline.py && python sound.py && python render.py

Saída: $BUILD/voice_clone/<conceito>/<linha>.wav (o timeline usa automaticamente).
Modelo: tts_models/multilingual/multi-dataset/your_tts (release do Coqui no GitHub),
em $ROBO_MODELS/tts_models--multilingual--multi-dataset--your_tts.
"""
import argparse, os, subprocess
import numpy as np
from TTS.utils.synthesizer import Synthesizer
from content import CONCEPTS
from voice import lines_of, CHAIN, score
from tts_backend import asr, MD

BUILD = os.environ.get('BUILD', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'build'))
TAKES = int(os.environ.get('TAKES', 6))
PLAIN = [('métch', 'match'), ('Dêit', 'Date')]
# Grafias alternativas testadas quando a transcrição acusa erro (YourTTS lê por caracteres).
ALT = [('print', 'prínti'), ('métch', 'métchi'), ('Sem ', 'Sêm '), ('Toque em...', 'Tóque ẽin...'),
       ('E agora?', 'E agóra?'), ('pro Robô', 'para o Robô'), ('Resposta', 'Respósta'),
       ('E se cada', 'E se, cada'), ('Deu métch!', 'Deu mátchi!'), ('Clique em', 'Clíque em')]
ONLY = [x for x in os.environ.get('ONLY', '').split(',') if x]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--ref', action='append', required=True)
    a = ap.parse_args()
    Y = f'{MD}/tts_models--multilingual--multi-dataset--your_tts'
    syn = Synthesizer(tts_checkpoint=f'{Y}/model_file.pth', tts_config_path=f'{Y}/config.json',
                      tts_speakers_file=f'{Y}/speakers.json', tts_languages_file=f'{Y}/language_ids.json',
                      encoder_checkpoint=f'{Y}/model_se.pth', encoder_config=f'{Y}/config_se.json',
                      use_cuda=False, voice_dir=f'{BUILD}/voice_clone/_voices')
    report = []
    for c in CONCEPTS:
        d = f'{BUILD}/voice_clone/{c["code"]}'
        os.makedirs(d, exist_ok=True)
        for l in lines_of(c):
            if ONLY and f'{c["code"]}:{l["id"]}' not in ONLY:
                continue
            plain = l['say']
            for x, y in PLAIN:
                plain = plain.replace(x, y)
            alt = l['say']
            for x, y in ALT:
                alt = alt.replace(x, y)
            variants = list(dict.fromkeys([alt, l['say'], plain]))
            best = None
            cur = f'{d}/{l["id"]}.wav'
            if os.path.exists(cur):  # só substitui a tomada atual se a nova for melhor
                keep = f'{d}/{l["id"]}_t_keep.wav'
                subprocess.run(['cp', cur, keep], check=True)
                h0 = asr(keep)
                best = (score(l['cap'], h0), keep, h0)
            for k in range(TAKES):
                if best and best[0] >= 0.999:
                    break
                text = variants[k % len(variants)]
                raw, take = f'{d}/{l["id"]}_raw.wav', f'{d}/{l["id"]}_t{k}.wav'
                w = syn.tts(text, speaker_name='hugo', speaker_wav=a.ref, language_name='pt-br', split_sentences=False)
                syn.save_wav(w, raw)
                speed = l.get('speed', 1.0)
                tempo = f'atempo={speed:.3f},' if abs(speed - 1) > 0.01 else ''
                subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', raw, '-af', tempo + CHAIN, '-ac', '1', take], check=True)
                os.remove(raw)
                heard = asr(take)
                sc = score(l['cap'], heard)
                if best is None or sc > best[0]:
                    best = (sc, take, heard)
                if sc >= 0.999:
                    break
            os.replace(best[1], f'{d}/{l["id"]}.wav')
            for k in list(range(TAKES)) + ['_keep']:
                p = f'{d}/{l["id"]}_t{k}.wav'
                if os.path.exists(p):
                    os.remove(p)
            report.append(f'{c["code"]}\t{l["id"]}\t{best[0]:.2f}\t{l["cap"]}\t{best[2]}')
            print(report[-1], flush=True)
    if not ONLY:
        os.makedirs(f'{BUILD}/qa', exist_ok=True)
        open(f'{BUILD}/qa/voice_clone_asr.tsv', 'w').write(
            'conceito\tlinha\tsimilaridade\tlegenda\ttranscricao_whisper\n' + '\n'.join(report) + '\n')


if __name__ == '__main__':
    main()
