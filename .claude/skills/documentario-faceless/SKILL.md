---
name: documentario-faceless
description: >
  Gera vídeo faceless em formato documentário (narração em off sobre imagens
  cinematográficas) de ponta a ponta: tema -> roteiro com gancho e três atos
  -> narração TTS -> imagem com Ken Burns na maioria das cenas e motion
  graphics (texto animado, contador, print de conversa) nos momentos-chave
  -> vídeo 16:9 com legenda queimada + corte vertical 9:16, via API do
  Gemini, Pillow e FFmpeg.
  Use sempre que o usuário pedir "vídeo faceless", "vídeo estilo
  documentário", "vídeo com narração e imagens de IA", "roteiro + áudio +
  vídeo", "episódio pro YouTube/TikTok/Reels sem aparecer", ou mandar um tema
  e pedir pra transformar em vídeo — mesmo sem dizer "skill". Também dispara
  pra "vídeo com motion", "texto animado", "animar print de conversa". Também serve pra
  re-renderizar um episódio depois de editar o roteiro, trocar imagens ou
  gravar a própria voz.
---
# Documentário faceless (roteiro -> áudio -> vídeo)

Pipeline em `scripts/documentario_faceless.py` + `scripts/documentario_motion.py`
(Python com Pillow + FFmpeg; sem Node/Remotion). Junta os padrões das skills públicas mais próximas desse
formato: imagem por cena + Ken Burns + legenda (MartinOlivero/faceless-agent),
duração da cena guiada pelo áudio medido (artkruglov/voice-film) e etapas
independentes/reaproveitáveis (MoneyPrinterTurbo).

## Pré-requisitos
- `ffmpeg` e `ffprobe` no PATH (com libass, pra legenda).
- Pillow (`pip install pillow`), pras cenas de motion.
- `GEMINI_API_KEY` com a **Generative Language API habilitada** na chave
  (Google AI Studio). Se não estiver setada, pare e peça pro usuário
  configurar como variável de ambiente; nunca peça a chave no chat. Erro
  `API_KEY_SERVICE_BLOCKED` = a chave existe mas está restrita a outras APIs:
  o usuário precisa liberar a Generative Language API nas restrições da chave
  (Google Cloud Console -> Credenciais) ou usar uma chave do AI Studio.

## Etapas

Sempre rode numa pasta fora do repo (scratchpad ou `~/videos/<episodio>`),
nunca commite mídia gerada.

1. **Roteiro** — combine com o usuário: tema, público (default: homens 18-45,
   público do Robô de Date) e número de cenas (10 cenas ≈ 2-3 min; 30 ≈ 8-10
   min).
   ```bash
   python3 scripts/documentario_faceless.py roteiro --projeto <pasta> \
       --tema "<tema>" --cenas 10
   ```
   **Mostre o roteiro ao usuário antes de gastar com áudio e imagem.** O
   arquivo `<pasta>/roteiro.json` é editável à mão. Revise: gancho nos
   primeiros 5s, nenhuma estatística inventada (principalmente em cenas
   `numero`), frases curtas e faladas.

   Cada cena tem um `tipo` (formato híbrido, `--pct-motion 30` por padrão):
   | tipo | campos | uso |
   |---|---|---|
   | `imagem` | `narracao`, `prompt_imagem` (inglês) | maioria das cenas; Ken Burns |
   | `texto` | `narracao`, `texto_tela` (≤12 palavras, `*palavra*` = destaque) | gancho, virada, CTA |
   | `numero` | `narracao`, `numero` ("90%", "3x", "1.200"), `texto_tela` (legenda) | dado citado; contador animado |
   | `chat` | `narracao`, `mensagens` [{`de`: voce/ela, `texto`, `avaliacao`: ruim/boa}], `texto_tela` (título opcional) | exemplo de conversa, ruim vs boa |

   Pra trocar o tipo de uma cena, edite o `roteiro.json` (ex.: transformar uma
   cena de imagem em `texto`) e rode a partir da etapa 2.

2. **Mídia** (narração + imagens):
   ```bash
   python3 scripts/documentario_faceless.py midia --projeto <pasta> [--voz Charon] \
       [--formato vertical] [--estilo-imagem "<direção de arte em inglês>"]
   ```
   - **Decida o formato antes desta etapa**: com `--formato vertical` as
     imagens já saem em 9:16 (sem desperdiçar laterais); nos outros formatos
     saem em 16:9. Use o mesmo `--formato` no render.
   - `--estilo-imagem` soma uma direção de arte a todas as imagens (ex.:
     paleta da marca: "cool dark palette with subtle indigo-violet accent
     lighting"), pra o episódio ter unidade visual.
   - Limite por minuto da API (HTTP 429) é tratado sozinho: o script espera o
     tempo que a API pede. Cota diária esgotada falha e precisa esperar o dia
     seguinte ou subir o plano.
   - Voz default `Charon` (grave, informativa). Alternativas boas pra
     documentário: `Algenib`, `Orus`, `Iapetus`. O tom vem só da voz:
     **nunca ponha instrução de estilo no campo `narracao`** ("fale devagar",
     "[tom grave]"), porque o modelo de TTS lê a instrução em voz alta.
   - Cada arquivo que já existe é pulado. Pra usar **voz própria**, salve as
     gravações como `<pasta>/audio/cena_01.wav`, `cena_02.wav`, ... antes de
     rodar. Pra trocar uma imagem, apague (ou substitua por png/jpg/webp com o
     mesmo nome) e rode de novo.
   - Confira 2-3 imagens com a ferramenta Read antes do render: procure texto
     ilegível, rostos deformados, mãos estranhas.

3. **Render**:
   ```bash
   python3 scripts/documentario_faceless.py render --projeto <pasta> \
       [--formato ambos|vertical|horizontal] [--cor-destaque "#F5B700"] \
       [--cor-fundo "#0C0C10"] [--nome-saida documentario] [--musica trilha.mp3]
   ```
   `--cor-destaque` pinta palavras destacadas, contador e as bolhas "voce" do
   chat; `--cor-fundo` é o fundo das cenas de motion. Use as cores da marca.
   Cenas de motion são desenhadas nativas em 16:9 e em 9:16 (texto e conversa
   legíveis no celular) e ficam sem legenda, porque o texto já está na tela.
   Saída: `<pasta>/<nome-saida>_16x9.mp4` e/ou `<pasta>/<nome-saida>_9x16.mp4`.
   Áudio normalizado em -14 LUFS (padrão YouTube); com `--musica` a trilha
   abaixa sozinha quando a narração fala (ducking). Use só trilha com licença
   livre.

   Atalho: `tudo` roda as três etapas em sequência — só use se o usuário
   dispensou revisar o roteiro.

4. **Conferência final**: extraia 2 frames (`ffmpeg -ss <t> -i <mp4>
   -frames:v 1 frame.png`) e veja com Read se a legenda está legível e
   dentro do quadro, depois entregue os arquivos ao usuário.

## Limitações conhecidas (diga ao usuário quando relevante)
- Legenda sincronizada por proporção de letras dentro da fala de cada cena,
  não por palavra (sem Whisper). Fica boa pra narração calma; em fala
  rápida pode adiantar/atrasar alguns décimos.
- Render é CPU: ~3-4x a duração do vídeo numa máquina de 4 núcleos (10 min
  de vídeo ≈ 30-40 min).
- Imagens estáticas com movimento de câmera + motion graphics simples, não
  vídeo gerado. Pra B-roll em vídeo real, o caminho seria somar footage de
  banco (Pexels) ou geração de vídeo (Veo) — mais custo, avaliar só depois de
  validar retenção.
- Motion usa fonte do sistema (DejaVu no Linux, Arial no Mac/Windows).
- Duração: a voz Charon fala ~2,4 palavras/s. Pra uma aula de ~5 min, mire
  ~650-700 palavras de narração no roteiro todo.

## Cursos / séries
Roteiros de cursos ficam versionados em `cursos/<curso>/aula-NN/roteiro.json`
(só texto; mídia e vídeos nunca vão pro repo). Ex.: `cursos/biologia-da-conquista`
(Robô de Date: destaque `#4F4CFD`, fundo `#0E1218`, formato vertical).
