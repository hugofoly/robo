# -*- coding: utf-8 -*-
"""Substitui a voz-guia pela VOZ CLONADA (ElevenLabs) mantendo a mesma segmentação.

PRÉ-REQUISITOS (bloqueios atuais — ver README):
  1. Autorização explícita do dono da voz para clonagem (narrador da VSL ou o Hugo).
  2. Amostra limpa: 1–3 min de fala sem música (wav/mp3), ex. trechos da VSL sem trilha
     ou gravação nova no celular em ambiente silencioso.
  3. ELEVENLABS_API_KEY no ambiente (e rede liberada para api.elevenlabs.io).

Uso:
  export ELEVENLABS_API_KEY=...
  python clone_voice.py --sample amostra1.wav [--sample amostra2.wav] [--voice-id EXISTENTE]
  python timeline.py && python sound.py && python render.py

Saída: $BUILD/voice_clone/<conceito>/<linha>.wav  (timeline.py usa automaticamente).
Depois rode voice-QA: as durações mudam e as cenas se reajustam sozinhas, porque
todos os eventos visuais estão amarrados ao início/fim de cada fala.
"""
import argparse, json, os, subprocess, sys, urllib.request, uuid
from content import CONCEPTS
from voice import lines_of, CHAIN

BUILD = os.environ.get('BUILD', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'build'))
API = 'https://api.elevenlabs.io/v1'
MODEL = 'eleven_multilingual_v2'

# Direção de performance por momento do anúncio.
DIRECTION = {
    'hook':    dict(stability=0.30, similarity_boost=0.85, style=0.55),   # incisivo, presença
    'problem': dict(stability=0.45, similarity_boost=0.85, style=0.35),   # conversa, identificação
    'turn':    dict(stability=0.45, similarity_boost=0.85, style=0.40),
    'demo':    dict(stability=0.60, similarity_boost=0.85, style=0.20),   # clareza, segurança
    'benefit': dict(stability=0.50, similarity_boost=0.85, style=0.35),
    'cta':     dict(stability=0.40, similarity_boost=0.85, style=0.50),   # direto, energia
}
# A voz-guia precisa de grafia fonética; a clonada lê o português normal.
UNPHONETIC = [('métch', 'match'), ('Dêit', 'Date'), ('cá cá cá', 'cá cá cá'), ('Saiba Mais', 'Saiba mais')]


def req(method, path, key, body=None, headers=None, raw=False):
    h = {'xi-api-key': key}
    h.update(headers or {})
    r = urllib.request.Request(API + path, data=body, method=method, headers=h)
    with urllib.request.urlopen(r, timeout=120) as resp:
        data = resp.read()
    return data if raw else json.loads(data)


def add_voice(key, samples, name='Robo de Date - narrador (autorizado)'):
    boundary = uuid.uuid4().hex
    parts = []
    def field(n, v):
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{n}"\r\n\r\n{v}\r\n'.encode())
    field('name', name)
    field('description', 'Clonagem autorizada para anúncios do Robô de Date')
    for s in samples:
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="files"; filename="{os.path.basename(s)}"\r\n'
                     f'Content-Type: audio/mpeg\r\n\r\n'.encode() + open(s, 'rb').read() + b'\r\n')
    parts.append(f'--{boundary}--\r\n'.encode())
    res = req('POST', '/voices/add', key, b''.join(parts), {'Content-Type': f'multipart/form-data; boundary={boundary}'})
    return res['voice_id']


def tts(key, voice_id, text, settings, out_mp3):
    body = json.dumps({'text': text, 'model_id': MODEL, 'voice_settings': settings}).encode()
    audio = req('POST', f'/text-to-speech/{voice_id}?output_format=mp3_44100_192', key, body,
                {'Content-Type': 'application/json', 'Accept': 'audio/mpeg'}, raw=True)
    open(out_mp3, 'wb').write(audio)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--sample', action='append', default=[])
    ap.add_argument('--voice-id')
    a = ap.parse_args()
    key = os.environ.get('ELEVENLABS_API_KEY')
    if not key:
        sys.exit('Defina ELEVENLABS_API_KEY (e confirme a autorização do dono da voz).')
    vid = a.voice_id or add_voice(key, a.sample)
    print('voice_id:', vid)
    for c in CONCEPTS:
        d = f'{BUILD}/voice_clone/{c["code"]}'
        os.makedirs(d, exist_ok=True)
        for l in lines_of(c):
            text = l['say']
            for x, y in UNPHONETIC:
                text = text.replace(x, y)
            mp3 = f'{d}/{l["id"]}.mp3'
            tts(key, vid, text, DIRECTION.get(l.get('beat') or 'demo'), mp3)
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', mp3, '-af', CHAIN, '-ac', '1', f'{d}/{l["id"]}.wav'], check=True)
            os.remove(mp3)
            print(c['code'], l['id'], 'ok', flush=True)


if __name__ == '__main__':
    main()
