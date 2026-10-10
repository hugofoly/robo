# Próximos passos (handoff para a próxima sessão)

## Estado atual (10/10/2026)
- 16 MP4 em `output/` com voz clonada local (YourTTS) + fotos de mulheres fictícias geradas por IA (Gemini).
- Feedback do Hugo: **voz lenta e robotizada**. Objetivo: refazer a narração com ritmo natural e timbre do Hugo.

## Plano de voz aprovado
1. Gerar a narração com **Gemini TTS** (API nativa `models/gemini-2.5-flash-preview-tts:generateContent`,
   vozes masculinas: `Puck`, `Fenrir`, `Charon`, `Orus`), com instrução de estilo:
   "português do Brasil, como um amigo, ritmo ágil, natural, confiante, sem pausas longas".
   Uma chamada por fala de `production/content.py` (campo `say`, trocando `métch`→`match`, `Dêit`→`Date`).
2. Converter o timbre para o do Hugo com **kNN-VC** (Coqui: `voice_conversion_models/multilingual/multi-dataset/knnvc`,
   referência = 3 áudios do WhatsApp do Hugo, autorizados por ele, na pasta do Drive "Criativos Claude"
   id `1a9pXilJf61uYyHXuoi7glXAq4UTpzei2`; limpar com `highpass=f=80,afftdn=nf=-25,silenceremove,loudnorm`).
3. Conferir cada fala por transcrição (`tts_backend.asr`, `voice.score`), salvar em `$BUILD/voice_clone/<C>/<linha>.wav`.
4. Mandar 1 amostra ao Hugo antes de renderizar tudo; depois `timeline.py → sound.py → render.py`.

## Credenciais (segredos do ambiente, nunca no chat)
- Fotos: segredo Bearer em `generativelanguage.googleapis.com`, prefixo `/v1beta/openai/`
  → endpoint compatível `v1beta/openai/images/generations`, modelo `gemini-3-pro-image-preview`.
- Voz: a API nativa exige o cabeçalho `x-goog-api-key` **sem** `Authorization: Bearer`.
  Na sessão de 10/10 o Bearer ainda chegava em `/v1beta/models/` (erro 401 "Expected OAuth 2 access token").
  Teste rápido:
  ```bash
  curl -s -o /dev/null -w "%{http_code}\n" https://generativelanguage.googleapis.com/v1beta/models
  ```
  200 = voz liberada; 401 = o Bearer ainda está sendo enviado nesse caminho.

## Ambiente
- Modelos baixáveis por releases do GitHub (HF bloqueado): Piper pt_BR / Whisper small (sherpa-onnx), YourTTS e FreeVC (coqui-ai/TTS),
  kNN-VC (baixa sozinho via Coqui `TTS(...)`).
- `pip install coqui-tts torch torchaudio torchcodec "transformers==4.57.3" sherpa-onnx soundfile scipy playwright`
- Chromium: `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` (variável `CHROME`).
