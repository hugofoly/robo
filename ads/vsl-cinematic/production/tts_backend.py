# -*- coding: utf-8 -*-
"""Backends de voz e transcrição (offline, via sherpa-onnx).

- synth(): voz-guia Piper pt-BR "faber" (NÃO é a voz clonada; ver clone_voice.py)
- asr():   Whisper small (pt) para conferir pronúncia/intelecção da narração

Modelos ficam fora do repositório (variável ROBO_MODELS). Download:
  https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-pt_BR-faber-medium.tar.bz2
  https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-whisper-small.tar.bz2
"""
import os
import numpy as np
import soundfile as sf
import sherpa_onnx

MD = os.environ.get('ROBO_MODELS', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models'))
GUIDE_VOICE = 'pt_BR-faber-medium'
_tts = {}
_asr = None


def get_tts(voice=GUIDE_VOICE):
    if voice not in _tts:
        d = f'{MD}/vits-piper-{voice}'
        onnx = [f for f in os.listdir(d) if f.endswith('.onnx')][0]
        cfg = sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
            vits=sherpa_onnx.OfflineTtsVitsModelConfig(
                model=f'{d}/{onnx}', tokens=f'{d}/tokens.txt', data_dir=f'{d}/espeak-ng-data',
                noise_scale=0.6, noise_scale_w=0.75, length_scale=1.0),
            num_threads=4))
        _tts[voice] = sherpa_onnx.OfflineTts(cfg)
    return _tts[voice]


def synth(text, out, speed=1.0, voice=GUIDE_VOICE):
    a = get_tts(voice).generate(text, sid=0, speed=speed)
    sf.write(out, np.asarray(a.samples, dtype='float32'), a.sample_rate)
    return len(a.samples) / a.sample_rate


def asr(path):
    global _asr
    if _asr is None:
        d = f'{MD}/sherpa-onnx-whisper-small'
        _asr = sherpa_onnx.OfflineRecognizer.from_whisper(
            encoder=f'{d}/small-encoder.int8.onnx', decoder=f'{d}/small-decoder.int8.onnx',
            tokens=f'{d}/small-tokens.txt', language='pt', task='transcribe', num_threads=4)
    s, sr = sf.read(path, dtype='float32')
    if s.ndim > 1:
        s = s.mean(1)
    pad = np.zeros(int(sr * 0.4), dtype='float32')
    st = _asr.create_stream()
    st.accept_waveform(sr, np.concatenate([pad, s, pad]))
    _asr.decode_stream(st)
    return st.result.text.strip()
