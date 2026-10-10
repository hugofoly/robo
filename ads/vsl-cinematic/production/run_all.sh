#!/usr/bin/env bash
# Pipeline completo: voz -> timeline/SRT -> áudio -> vídeo -> docs
# Requer: ffmpeg, Chromium (CHROME=...), modelos em $ROBO_MODELS (ver tts_backend.py)
set -euo pipefail
cd "$(dirname "$0")"
export BUILD=${BUILD:-$PWD/build}
python voice.py          # pule se for usar a voz clonada (clone_voice.py)
python timeline.py
python sound.py
python render.py
python gen_docs.py
