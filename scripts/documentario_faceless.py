#!/usr/bin/env python3
"""Pipeline de vídeo faceless em formato documentário: tema -> roteiro ->
narração (TTS) -> uma imagem por cena -> vídeo 16:9 + corte 9:16.

Junta os padrões das skills públicas mais próximas desse formato:
  - faceless-agent (MartinOlivero): uma imagem por cena, Ken Burns, cortes
    curtos, legenda queimada, voz própria opcional.
  - voice-film (artkruglov): a duração de cada cena vem do áudio medido, então
    regravar uma fala re-temporiza o vídeo sozinho.
  - MoneyPrinterTurbo: etapas independentes e reaproveitáveis.

Tudo via API do Gemini (texto, TTS e imagem) + FFmpeg. Só usa a biblioteca
padrão do Python.

Estrutura do projeto (cada etapa pula o que já existe, então dá pra editar o
roteiro, trocar uma imagem ou gravar a própria voz e rodar de novo):
    <projeto>/roteiro.json         roteiro (editável à mão)
    <projeto>/audio/cena_01.wav    narração por cena (pode ser sua voz)
    <projeto>/imagens/cena_01.png  imagem por cena
    <projeto>/build/               arquivos intermediários
    <projeto>/documentario_16x9.mp4
    <projeto>/documentario_9x16.mp4

Uso:
    export GEMINI_API_KEY=...
    python3 documentario_faceless.py tudo --projeto out/ep01 \\
        --tema "Por que a primeira mensagem decide o date" --cenas 10
    python3 documentario_faceless.py render --projeto out/ep01 --musica trilha.mp3
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
import wave

API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"
TEXT_MODEL = "gemini-2.5-flash"
TTS_MODEL = "gemini-2.5-flash-preview-tts"
IMAGE_MODEL = "gemini-3.1-flash-image"
DEFAULT_VOICE = "Charon"  # voz grave e informativa, boa pra documentário
MAX_ATTEMPTS = 3
RETRY_BACKOFF_SECONDS = 4

FPS = 30
SCENE_TAIL_SECONDS = 0.5  # respiro depois de cada fala
FADE_SECONDS = 0.25
KEN_BURNS_ZOOM = 0.12  # quanto a câmera aproxima/afasta ao longo da cena
FONT_NAME = "DejaVu Sans"

ROTEIRO_PROMPT = """Você é roteirista de documentários curtos para YouTube, no estilo
canal faceless (narração em off sobre imagens). Escreva em português do Brasil.

Tema: {tema}
Público: {publico}
Número de cenas: {cenas}

Regras:
- Cena 1 é o gancho: uma afirmação ou pergunta que gere curiosidade nos
  primeiros 5 segundos. Nada de "olá" ou apresentação.
- Estrutura em três atos: contexto/problema, virada/descoberta, consequência
  prática. Abra loops ("mas isso não é o mais estranho") para segurar retenção.
- Cada cena tem 1 a 3 frases faladas (15 a 40 palavras), linguagem falada,
  frases curtas, sem listas, sem emojis, sem siglas difíceis de pronunciar.
- Use dados ou exemplos concretos só se forem amplamente conhecidos; nunca
  invente estatística ou estudo.
- Última cena fecha a ideia e faz um CTA leve.
- prompt_imagem: em inglês, descreve UMA imagem estática cinematográfica que
  ilustra a cena (pessoas sem rosto visível ou de costas, objetos, lugares,
  metáforas visuais). Sem texto, letreiros ou logos na imagem.
"""

ROTEIRO_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "titulo": {"type": "STRING"},
        "cenas": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "narracao": {"type": "STRING"},
                    "prompt_imagem": {"type": "STRING"},
                },
                "required": ["narracao", "prompt_imagem"],
            },
        },
    },
    "required": ["titulo", "cenas"],
}

TTS_STYLE = (
    "Narre como um documentário: tom grave, calmo e confiante, ritmo "
    "pausado, pequenas pausas entre as frases:\n\n"
)

IMAGE_STYLE = (
    "Cinematic documentary still, 35mm film look, natural moody lighting, "
    "shallow depth of field, muted color grade, subtle film grain, "
    "photorealistic, 16:9 composition, no text, no captions, no logos, "
    "no visible faces. Scene: "
)


# --------------------------------------------------------------------------
# Gemini
# --------------------------------------------------------------------------

def gemini(model: str, body: dict, api_key: str | None) -> dict:
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["x-goog-api-key"] = api_key
    req = urllib.request.Request(
        f"{API_BASE}/{model}:generateContent",
        data=json.dumps(body).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    last_error: Exception | None = None
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            with urllib.request.urlopen(req, timeout=300) as resp:
                return json.load(resp)
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", "replace")[:500]
            last_error = RuntimeError(f"HTTP {exc.code}: {detail}")
            if exc.code in (400, 401, 403, 404):
                break  # erro de configuração: repetir não resolve
        except (urllib.error.URLError, TimeoutError) as exc:
            last_error = exc
        if attempt < MAX_ATTEMPTS:
            time.sleep(RETRY_BACKOFF_SECONDS * attempt)
    raise RuntimeError(f"Gemini {model} falhou: {last_error}")


def first_inline(data: dict) -> tuple[str, bytes]:
    for part in data["candidates"][0]["content"]["parts"]:
        inline = part.get("inlineData") or part.get("inline_data")
        if inline:
            mime = inline.get("mimeType") or inline.get("mime_type") or ""
            return mime, base64.b64decode(inline["data"])
    raise RuntimeError(f"Resposta sem mídia: {json.dumps(data)[:500]}")


def gerar_roteiro(args: argparse.Namespace, api_key: str | None) -> None:
    path = os.path.join(args.projeto, "roteiro.json")
    if os.path.exists(path):
        print(f"roteiro: já existe ({path}), pulando")
        return
    if not args.tema:
        sys.exit("Sem roteiro.json no projeto: passe --tema para gerar um.")
    prompt = ROTEIRO_PROMPT.format(tema=args.tema, publico=args.publico, cenas=args.cenas)
    data = gemini(args.modelo_texto, {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": ROTEIRO_SCHEMA,
        },
    }, api_key)
    roteiro = json.loads(data["candidates"][0]["content"]["parts"][0]["text"])
    with open(path, "w", encoding="utf-8") as f:
        json.dump(roteiro, f, ensure_ascii=False, indent=2)
    print(f"roteiro: '{roteiro['titulo']}' com {len(roteiro['cenas'])} cenas -> {path}")


def gerar_audio(texto: str, out_path: str, voz: str, model: str, api_key: str | None) -> None:
    data = gemini(model, {
        "contents": [{"parts": [{"text": TTS_STYLE + texto}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voz}}},
        },
    }, api_key)
    mime, pcm = first_inline(data)
    rate = 24000
    for piece in mime.split(";"):
        if piece.strip().startswith("rate="):
            rate = int(piece.strip()[5:])
    with wave.open(out_path, "wb") as w:  # TTS do Gemini devolve PCM 16-bit mono cru
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(pcm)


def gerar_imagem(prompt: str, out_path: str, model: str, api_key: str | None) -> None:
    data = gemini(model, {
        "contents": [{"parts": [{"text": IMAGE_STYLE + prompt}]}],
        "generationConfig": {
            "responseModalities": ["IMAGE"],
            "imageConfig": {"aspectRatio": "16:9"},
        },
    }, api_key)
    _, img = first_inline(data)
    with open(out_path, "wb") as f:
        f.write(img)


def gerar_midia(args: argparse.Namespace, api_key: str | None) -> None:
    roteiro = carregar_roteiro(args.projeto)
    os.makedirs(os.path.join(args.projeto, "audio"), exist_ok=True)
    os.makedirs(os.path.join(args.projeto, "imagens"), exist_ok=True)
    falhas = []
    for i, cena in enumerate(roteiro["cenas"], start=1):
        audio = caminho_audio(args.projeto, i)
        imagem = caminho_imagem(args.projeto, i)
        try:
            if os.path.exists(audio):
                print(f"cena {i:02d}: áudio já existe, pulando")
            else:
                print(f"cena {i:02d}: gerando narração ...", flush=True)
                gerar_audio(cena["narracao"], audio, args.voz, args.modelo_tts, api_key)
            if existe_imagem(args.projeto, i):
                print(f"cena {i:02d}: imagem já existe, pulando")
            else:
                print(f"cena {i:02d}: gerando imagem ...", flush=True)
                gerar_imagem(cena["prompt_imagem"], imagem, args.modelo_imagem, api_key)
        except Exception as exc:  # noqa: BLE001 - reporta e segue para a próxima cena
            falhas.append((i, str(exc)))
            print(f"cena {i:02d}: FALHOU: {exc}")
    if falhas:
        print("\nCenas com falha (rode de novo para tentar só essas):")
        for i, err in falhas:
            print(f"  - cena {i:02d}: {err}")
        sys.exit(1)


# --------------------------------------------------------------------------
# Render (FFmpeg)
# --------------------------------------------------------------------------

def carregar_roteiro(projeto: str) -> dict:
    path = os.path.join(projeto, "roteiro.json")
    if not os.path.exists(path):
        sys.exit(f"Não achei {path}. Rode a etapa 'roteiro' ou crie o arquivo à mão.")
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def caminho_audio(projeto: str, i: int) -> str:
    return os.path.join(projeto, "audio", f"cena_{i:02d}.wav")


def caminho_imagem(projeto: str, i: int) -> str:
    return os.path.join(projeto, "imagens", f"cena_{i:02d}.png")


def existe_imagem(projeto: str, i: int) -> str | None:
    """Aceita png/jpg/webp, pra poder trocar uma imagem gerada por uma sua."""
    for ext in (".png", ".jpg", ".jpeg", ".webp"):
        path = os.path.join(projeto, "imagens", f"cena_{i:02d}{ext}")
        if os.path.exists(path):
            return path
    return None


def run(cmd: list[str]) -> None:
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"Comando falhou: {' '.join(cmd[:6])} ...\n{proc.stderr[-2000:]}")


def duracao(path: str) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
        stdout=subprocess.PIPE, text=True, check=True,
    ).stdout.strip()
    return float(out)


def render_cena(imagem: str, audio: str, out_path: str, indice: int) -> float:
    """Imagem + narração -> clipe 1920x1080 com Ken Burns e vinheta. Sem grão
    animado: ele multiplica o bitrate; o grão vem do prompt da imagem."""
    dur = duracao(audio) + SCENE_TAIL_SECONDS
    frames = max(int(round(dur * FPS)), 1)
    passo = KEN_BURNS_ZOOM / frames
    if indice % 2:  # alterna aproximar/afastar para não ficar monótono
        zoom = f"min(1+{passo:.6f}*on,{1 + KEN_BURNS_ZOOM})"
    else:
        zoom = f"max({1 + KEN_BURNS_ZOOM}-{passo:.6f}*on,1)"
    # Escala grande antes do zoompan evita o "tremido" típico do filtro.
    video = (
        "scale=2880:1620:force_original_aspect_ratio=increase,crop=2880:1620,"
        f"zoompan=z='{zoom}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
        f":d={frames}:s=1920x1080:fps={FPS},"
        "vignette=PI/5,"
        f"fade=t=in:st=0:d={FADE_SECONDS},"
        f"fade=t=out:st={dur - FADE_SECONDS:.3f}:d={FADE_SECONDS},format=yuv420p"
    )
    run([
        "ffmpeg", "-y", "-loglevel", "error",
        "-i", imagem, "-i", audio,
        "-filter_complex",
        f"[0:v]{video}[v];[1:a]aresample=48000,aformat=channel_layouts=stereo,"
        f"apad=pad_dur={SCENE_TAIL_SECONDS}[a]",
        "-map", "[v]", "-map", "[a]", "-t", f"{dur:.3f}",
        # Clipe intermediário: qualidade alta e preset rápido; o encode final refina.
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-r", str(FPS),
        "-c:a", "aac", "-b:a", "192k", out_path,
    ])
    return dur


def blocos_legenda(texto: str, max_palavras: int) -> list[str]:
    palavras = texto.split()
    return [" ".join(palavras[i:i + max_palavras]) for i in range(0, len(palavras), max_palavras)]


def ass_tempo(seg: float) -> str:
    h, resto = divmod(seg, 3600)
    m, s = divmod(resto, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"


def escrever_legenda(cenas: list[dict], duracoes: list[float], audios: list[float],
                     path: str, largura: int, altura: int, max_palavras: int) -> None:
    """Legenda ASS. O tempo de cada bloco é proporcional ao número de letras
    dentro da fala da cena -- aproximação boa sem precisar de Whisper."""
    tamanho = int(altura * (0.05 if largura > altura else 0.04))
    margem = int(altura * (0.08 if largura > altura else 0.22))
    linhas = [
        "[Script Info]", "ScriptType: v4.00+",
        f"PlayResX: {largura}", f"PlayResY: {altura}", "WrapStyle: 0", "",
        "[V4+ Styles]",
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, "
        "BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, "
        "BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
        f"Style: Default,{FONT_NAME},{tamanho},&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,"
        f"1,0,0,0,100,100,0,0,1,{max(tamanho // 12, 2)},1,2,60,60,{margem},1",
        "", "[Events]",
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ]
    inicio_cena = 0.0
    for cena, dur_cena, dur_fala in zip(cenas, duracoes, audios):
        blocos = blocos_legenda(cena["narracao"], max_palavras)
        total = sum(len(b) for b in blocos) or 1
        t = inicio_cena
        for bloco in blocos:
            fim = t + dur_fala * len(bloco) / total
            texto = bloco.replace("{", "(").replace("}", ")")
            linhas.append(f"Dialogue: 0,{ass_tempo(t)},{ass_tempo(fim)},Default,,0,0,0,,{texto}")
            t = fim
        inicio_cena += dur_cena
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(linhas) + "\n")


def mixar_audio(master: str, musica: str | None, out_path: str) -> None:
    """Normaliza a voz em -14 LUFS (padrão YouTube) e, se houver trilha,
    abaixa a música automaticamente enquanto a narração fala (ducking)."""
    if musica:
        filtro = (
            "[1:a]aloop=loop=-1:size=2147483647,volume=0.25,aresample=48000[m];"
            "[0:a]asplit=2[voz][sc];"
            "[m][sc]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[duck];"
            "[voz][duck]amix=inputs=2:duration=first:normalize=0,"
            "loudnorm=I=-14:TP=-1.5:LRA=11[a]"
        )
        entradas = ["-i", master, "-i", musica]
    else:
        filtro = "[0:a]loudnorm=I=-14:TP=-1.5:LRA=11[a]"
        entradas = ["-i", master]
    run([
        "ffmpeg", "-y", "-loglevel", "error", *entradas,
        "-filter_complex", filtro, "-map", "0:v", "-map", "[a]",
        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", out_path,
    ])


def ass_filter_path(path: str) -> str:
    return path.replace("\\", "/").replace(":", "\\:").replace("'", "\\'")


def render(args: argparse.Namespace) -> None:
    roteiro = carregar_roteiro(args.projeto)
    cenas = roteiro["cenas"]
    build = os.path.join(args.projeto, "build")
    os.makedirs(build, exist_ok=True)

    faltando = [
        i for i in range(1, len(cenas) + 1)
        if not os.path.exists(caminho_audio(args.projeto, i)) or not existe_imagem(args.projeto, i)
    ]
    if faltando:
        sys.exit(f"Faltam áudio/imagem nas cenas {faltando}. Rode a etapa 'midia' antes.")

    clipes, duracoes, falas = [], [], []
    for i in range(1, len(cenas) + 1):
        audio = caminho_audio(args.projeto, i)
        clipe = os.path.join(build, f"cena_{i:02d}.mp4")
        print(f"render: cena {i:02d}/{len(cenas)}", flush=True)
        duracoes.append(render_cena(existe_imagem(args.projeto, i), audio, clipe, i))
        falas.append(duracao(audio))
        clipes.append(clipe)

    lista = os.path.join(build, "concat.txt")
    with open(lista, "w", encoding="utf-8") as f:
        f.writelines(f"file '{os.path.abspath(c)}'\n" for c in clipes)
    bruto = os.path.join(build, "master_bruto.mp4")
    run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0",
         "-i", lista, "-c", "copy", bruto])

    master = os.path.join(build, "master_sem_legenda.mp4")
    mixar_audio(bruto, args.musica, master)

    saidas = []
    leg_h = os.path.join(build, "legenda_16x9.ass")
    escrever_legenda(cenas, duracoes, falas, leg_h, 1920, 1080, max_palavras=7)
    out_h = os.path.join(args.projeto, "documentario_16x9.mp4")
    run(["ffmpeg", "-y", "-loglevel", "error", "-i", master,
         "-vf", f"ass='{ass_filter_path(leg_h)}'",
         "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-c:a", "copy", out_h])
    saidas.append(out_h)

    if not args.sem_vertical:
        # 9:16: o quadro 16:9 no centro sobre uma versão ampliada e desfocada dele.
        leg_v = os.path.join(build, "legenda_9x16.ass")
        escrever_legenda(cenas, duracoes, falas, leg_v, 1080, 1920, max_palavras=4)
        out_v = os.path.join(args.projeto, "documentario_9x16.mp4")
        run(["ffmpeg", "-y", "-loglevel", "error", "-i", master, "-filter_complex",
             "[0:v]split=2[a][b];"
             # Desfoque em baixa resolução e depois amplia: bem mais rápido que gblur em 1080p.
             "[a]scale=270:480:force_original_aspect_ratio=increase,crop=270:480,"
             "boxblur=8:2,eq=brightness=-0.15,scale=1080:1920[bg];"
             "[b]scale=1080:-2[fg];"
             f"[bg][fg]overlay=(W-w)/2:(H-h)/2,ass='{ass_filter_path(leg_v)}'[v]",
             "-map", "[v]", "-map", "0:a",
             "-c:v", "libx264", "-preset", "medium", "-crf", "21", "-c:a", "copy", out_v])
        saidas.append(out_v)

    total = sum(duracoes)
    print(f"\nPronto: {len(cenas)} cenas, {total:.1f}s ({total / 60:.1f} min)")
    for s in saidas:
        print(f"  {s}")


# --------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------

def load_api_key(key_file: str | None) -> str | None:
    if key_file:
        return open(key_file, encoding="utf-8").read().strip()
    return os.environ.get("GEMINI_API_KEY")


def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("etapa", choices=["roteiro", "midia", "render", "tudo"])
    parser.add_argument("--projeto", required=True, help="Pasta do episódio")
    parser.add_argument("--tema", help="Tema do documentário (etapa roteiro)")
    parser.add_argument("--publico", default="homens de 18 a 45 anos interessados em "
                        "comunicação, confiança e relacionamentos")
    parser.add_argument("--cenas", type=int, default=10, help="Número de cenas (default 10)")
    parser.add_argument("--voz", default=DEFAULT_VOICE, help=f"Voz do Gemini TTS (default {DEFAULT_VOICE})")
    parser.add_argument("--musica", help="Trilha de fundo (mp3/wav), com ducking automático")
    parser.add_argument("--sem-vertical", action="store_true", help="Não gera o corte 9:16")
    parser.add_argument("--modelo-texto", default=TEXT_MODEL)
    parser.add_argument("--modelo-tts", default=TTS_MODEL)
    parser.add_argument("--modelo-imagem", default=IMAGE_MODEL)
    parser.add_argument("--key-file", help="Arquivo com a GEMINI_API_KEY (senão usa a env var)")
    args = parser.parse_args()

    os.makedirs(args.projeto, exist_ok=True)
    precisa_api = args.etapa in ("roteiro", "midia", "tudo")
    api_key = load_api_key(args.key_file) if precisa_api else None
    if precisa_api and not api_key:
        print("Aviso: GEMINI_API_KEY não definida; tentando sem chave "
              "(só funciona se um proxy injetar a credencial).", file=sys.stderr)

    if args.etapa in ("roteiro", "tudo"):
        gerar_roteiro(args, api_key)
    if args.etapa in ("midia", "tudo"):
        gerar_midia(args, api_key)
    if args.etapa in ("render", "tudo"):
        render(args)


if __name__ == "__main__":
    main()
