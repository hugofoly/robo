---
name: carrossel-drive-nanobanana
description: >
  Automatiza a tradução de carrosséis de anúncio em inglês pra português
  usando a API do Gemini (modelo "Nano Banana"), lendo os slides de uma
  pasta do Google Drive e subindo o resultado numa pasta nova, irmã da
  original, com sufixo " (PT-BR)". Traduz o texto de cada slide preservando
  fundo/fotos/logo/ícone/layout e troca menção de marca concorrente (ex.
  "Wing AI") por "Robô de Date" no texto. Use sempre que o usuário pedir
  pra "traduzir a pasta X do Drive", "automatizar tradução de carrossel",
  "pegar os carrosséis em inglês e subir em português", ou apontar um
  link/nome de pasta do Drive com carrosséis em inglês pra traduzir.
---
# Tradução de carrossel via Drive + Nano Banana

Pipeline fim-a-fim: pasta do Drive em inglês → API do Gemini
(`gemini-3.1-flash-image`, apelido "Nano Banana 2") → pasta nova do Drive em
português. Diferente da skill `traduz-carrossel-robodate` (que reconstrói o
texto manualmente via HTML/Playwright), aqui quem edita a imagem é o próprio
modelo de imagem do Gemini, chamado via API.

## Pré-requisito
- Variável de ambiente `GEMINI_API_KEY` configurada (chave da API do Gemini /
  Google AI Studio). Se não estiver setada, pare e peça pro usuário
  configurar antes de continuar — nunca peça pra colar a chave direto no
  chat; se ele insistir, salve só em arquivo fora do repositório (nunca
  commitar) e trate como segredo.
- Script `scripts/nanobanana_translate_carousel.py` (neste repo).

## Passo a passo

1. **Identificar a pasta de origem no Drive.** Use `search_files` (Google
   Drive) com `title contains '<nome>'` ou, se o usuário mandou um link,
   extraia o `fileId` da URL. Confirme que é uma pasta
   (`mimeType = 'application/vnd.google-apps.folder'`) e pegue o `parentId`
   dela (pra criar a pasta de saída como irmã).

2. **Listar os slides.** `search_files` com
   `parentId = '<id da pasta origem>' and (mimeType contains 'image/')`.
   Ordene pelo `title` (nome do arquivo) pra manter a ordem do carrossel —
   confira que os nomes têm numeração (ex. `slide_1.png`, `slide_2.png`); se
   não tiverem, avise o usuário que a ordem pode não ser confiável.

3. **Baixar os slides pra uma pasta local temporária** (use o diretório de
   scratchpad da sessão, nunca o repo). Para cada arquivo:
   `download_file_content` com o `fileId`, decodificar o base64 retornado e
   salvar em `<scratch>/in/<nome original>`.

4. **Rodar o script de tradução:**
   ```bash
   export GEMINI_API_KEY=...   # já deve estar setada no ambiente
   python3 scripts/nanobanana_translate_carousel.py <scratch>/in <scratch>/out
   ```
   O script já usa o modelo certo (`gemini-3.1-flash-image`), aplica o
   prompt de tradução + rebrand pra "Robô de Date", e tenta 3x por slide em
   caso de erro. Slides que falharem aparecem listados no final — não
   invente conteúdo pra eles, avise o usuário.

5. **Conferir visualmente pelo menos 1-2 slides** de saída com a ferramenta
   Read antes de subir, especialmente o primeiro e o que tiver mais texto —
   o modelo às vezes erra acento ou deixa uma palavra em inglês. Se algo
   sair claramente errado, rode de novo só aquele slide (pode ajustar o
   prompt em `TRANSLATION_PROMPT` do script se for um erro recorrente,
   como troca de marca sem acento).

6. **Criar a pasta de destino no Drive**, irmã da pasta original, com o
   nome `<nome original> (PT-BR)`, usando `create_file` com
   `mimeType: application/vnd.google-apps.folder` e o mesmo `parentId` da
   pasta de origem.

7. **Subir cada slide traduzido** pra essa pasta nova via `create_file`,
   com `base64Content` (conteúdo do PNG em base64),
   `contentMimeType: image/png`, `disableConversionToGoogleType: true` (pra
   não converter a imagem em Google Docs/Slides) e `parentId` da pasta
   criada no passo 6. Mantenha o nome de arquivo igual ao original.

8. **Resumir pro usuário**: quantos slides traduzidos com sucesso, link/nome
   da pasta nova, e qualquer slide que precisou de atenção manual.

## Limitações conhecidas (avise o usuário se acontecer)
- O modelo pode encurtar demais uma tradução longa pra caber na caixa de
  texto original, ou ocasionalmente deixar uma palavra sem traduzir.
- Fundos muito complexos (textura, rosto, gradiente com texto sobreposto)
  podem sair com pequena distorção ao redor do texto trocado — igual à
  ressalva da skill `traduz-carrossel-robodate`.
- Nunca use o modelo `gemini-2.5-flash-image` (Nano Banana original) pra
  esse fluxo — em teste ele alucinou elementos que não existiam na imagem
  (ex. inventou um mockup de celular do zero). Use sempre
  `gemini-3.1-flash-image` (Nano Banana 2), que é o default do script.
