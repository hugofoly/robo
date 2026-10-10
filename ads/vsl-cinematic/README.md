# Robô de Date: anúncios cinematográficos a partir da VSL

São 4 conceitos com 2 hooks cada, nos formatos 9:16 e 4:5, o que dá **16 MP4**. Eles saíram da VSL do Robô de Date (roteiro de edição da VSL1 + alterações da VSL 1.2). Todos seguem **HOOK → SITUAÇÃO → DEMONSTRAÇÃO → BENEFÍCIO → CTA** e terminam com CTA falado, CTA escrito e end card.

> ⚠️ **A narração destes vídeos é uma VOZ-GUIA sintética (Piper pt-BR "faber"), não a voz clonada.** Veja "Bloqueios" abaixo.

## Entregáveis

| Pasta / arquivo | Conteúdo |
|---|---|
| `output/9x16_1080x1920/` | 8 vídeos verticais (Reels, Stories, TikTok) |
| `output/4x5_1080x1350/` | 8 vídeos de feed |
| `output/legendas/*.srt` | Legendas SRT por versão (as legendas também estão gravadas no vídeo) |
| `output/narracao/` | Narração-guia de cada fala (MP3) |
| `docs/01_analise_vsl.md` | Análise da VSL: público, dores, promessa, mecanismo, objeções, provas, oferta, linguagem, riscos |
| `docs/02_roteiros.md` | Roteiro e decupagem de cada versão: tempo, narração, texto, imagem, movimento, trilha/SFX, trecho da VSL, CTA. Inclui o banco de 14 hooks |
| `docs/03_copy_anuncios.md` | Texto principal, título, descrição e CTA de cada conceito |
| `docs/04_referencias_e_hipoteses.md` | 21 referências com o princípio aproveitado, hipótese por conceito, plano de teste e os 2 conceitos a testar primeiro |
| `production/` | Código de produção (projeto editável) |

| Código | Conceito | Hook A | Hook B |
|---|---|---|---|
| C1 | Deu match. E agora? | "Deu match. E agora?" | "Quantas vezes você já digitou 'oi, tudo bem?'… e apagou?" |
| C2 | A conversa esfriou | "A conversa tava boa… aí ela respondeu: kkk" | "Ela respondeu às 21h. Já passou da meia-noite. E você ainda tá olhando pra tela." |
| C3 | Manda o print | "Manda o print. Copia e cola. Simples assim." | "Todo mundo já mandou print pro amigo… E o amigo responde: 'sei lá, mano'." |
| C4 | Não é muleta. É treino. | "Resposta pronta, todo mundo te dá. Difícil é entender por que ela faz sentido." | "E se cada conversa te ensinasse o que falar na próxima?" |

**Testar primeiro: C2 e C3.** O motivo está em `docs/04_referencias_e_hipoteses.md`.

## Projeto editável (`production/`)

Tudo é código e se regenera com `run_all.sh`. Para editar um texto, um tempo, uma cena ou uma cor, altere o arquivo e rode de novo.

- `content.py`: **roteiros**. Cada fala tem texto para TTS, legenda (com `*destaque*`), cena, velocidade, pausa e trecho da VSL. As cenas trazem câmera, eventos de UI e SFX, todos amarrados ao início ou fim de cada fala.
- `voice.py` + `tts_backend.py`: gera a voz-guia com 6 tomadas por fala e escolhe a melhor pela transcrição (Whisper). Aplica EQ e compressão e grava o relatório `build/qa/voice_asr.tsv`.
- `clone_voice.py`: troca pela **voz clonada** (ElevenLabs) com direção por momento (hook incisivo, problema conversado, demo segura, CTA com energia).
- `timeline.py`: tempos reais, blocos de legenda (sílabas e pontuação), SRT e seções da trilha.
- `sound.py`: trilha e efeitos **100% sintetizados** (sem licença de terceiros), ducking da trilha sob a voz e master em -14 LUFS / -1 dBTP. Também exporta stems de voz, trilha e SFX.
- `engine/engine.html` + `engine.js`: motor visual determinístico. Celular 3D com câmera (crash zoom, push-in, deriva, tremor), UIs de chat, do Robô de Date, de match e da caixa de entrada, tipografia cinética, end card, legendas, grão, vinheta e luz. Os layouts de 9:16 e 4:5 são diferentes, não um recorte do outro.
- `render.py`: captura quadro a quadro no Chromium, H.264 30 fps e AAC 48 kHz. `--stills` gera quadros soltos para revisão.

Dependências: Python 3.11+, `pip install -r production/requirements.txt`, ffmpeg, Chromium, fontes Montserrat, Inter e Noto Color Emoji. Os modelos (Piper faber e Whisper small, via releases do sherpa-onnx) ficam em `$ROBO_MODELS`.

## Bloqueios e o que é preciso

1. **Voz clonada: não feita.**
   - Não há ferramenta de clonagem conectada: sem `ELEVENLABS_API_KEY`, e `api.elevenlabs.io` está bloqueado na rede desta sessão.
   - Não há amostra limpa: o MP4 da VSL (370 MB) passa do limite de 10 MB do conector do Drive, e o download direto também está bloqueado.
   - **A autorização do dono da voz não está identificada nos materiais.** Não está claro se o narrador é o Hugo ou um locutor contratado.
   - **Para destravar:** (a) confirmar por escrito quem é o narrador e que ele autoriza a clonagem; (b) enviar 1–3 min de fala limpa, sem trilha (até 10 MB, ou liberar acesso ao arquivo); (c) configurar `ELEVENLABS_API_KEY` com a rede liberada. Depois disso: `python clone_voice.py --sample amostra.wav && python timeline.py && python sound.py && python render.py`. As cenas se reajustam sozinhas às novas durações.
2. **Transcrição do áudio da VSL:** foi feita a partir do roteiro de edição, não do áudio, pelo mesmo bloqueio de download. Com o MP4 disponível, `tts_backend.asr()` transcreve localmente.
3. **Página de destino:** `pro.robodedate.com/lp` estava inacessível. Confirme que a página abre na VSL e que o botão do anúncio é "Saiba mais".
4. **Imagens reais:** sem acesso a banco de imagens com licença nem a gerador de imagem, os vídeos são motion design de produto (celular e UI). Não usam stock genérico nem fotos de pessoas.
