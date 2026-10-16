#!/usr/bin/env python3
"""Pipeline de vídeo faceless em formato documentário: tema -> roteiro ->
narração (TTS) -> uma imagem ou um motion graphic por cena -> vídeo 16:9 +
corte 9:16.

Junta os padrões das skills públicas mais próximas desse formato:
  - faceless-agent (MartinOlivero): uma imagem por cena, Ken Burns, cortes
    curtos, legenda queimada, voz própria opcional.
  - voice-film (artkruglov): a duração de cada cena vem do áudio medido, então
    regravar uma fala re-temporiza o vídeo sozinho.
  - MoneyPrinterTurbo: etapas independentes e reaproveitáveis.

Formato híbrido: a maioria das cenas é imagem com Ken Burns (barato) e os
momentos-chave (gancho, dados, exemplos de mensagem, CTA) viram motion
graphics desenhados em código -- ver documentario_motion.py.

Tudo via API do Gemini (texto, TTS e imagem) + FFmpeg + Pillow.

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

from documentario_motion import TIPOS_MOTION, render_motion

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
COR_DESTAQUE = "#F5B700"

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

Tipo de cada cena (campo "tipo"):
- "imagem" (padrão, maioria das cenas): preencha prompt_imagem em inglês,
  descrevendo UMA imagem estática cinematográfica que ilustra a cena (pessoas
  sem rosto visível ou de costas, objetos, lugares, metáforas visuais). Sem
  texto, letreiros ou logos na imagem.
- Motion graphics: use em cerca de {pct_motion}% das cenas, só nos
  momentos-chave, e nunca mais de duas seguidas:
  - "texto": frase de impacto na tela (gancho, virada, CTA). Preencha
    texto_tela com no máximo 12 palavras e marque 1 ou 2 palavras-chave entre
    asteriscos, ex.: "A conversa morre na *terceira* mensagem".
  - "numero": um número que a narração cita. Preencha numero (ex.: "3",
    "90%", "2x") e texto_tela com a legenda curta. Só use com número real e
    verificável ou contagem do próprio roteiro; senão use "texto".
  - "chat": exemplo de conversa de app de mensagens. Preencha mensagens
    (2 a 5), cada uma com de ("voce" ou "ela"), texto curto e, quando a cena
    compara abordagens, avaliacao ("ruim" ou "boa"). texto_tela opcional vira
    o título acima da conversa.
  Em cenas de motion, a narração complementa o que está na tela, não lê a tela.
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
                    "tipo": {"type": "STRING", "enum": ["imagem", *TIPOS_MOTION]},
                    "narracao": {"type": "STRING"},
                    "prompt_imagem": {"type": "STRING"},
                    "texto_tela": {"type": "STRING"},
                    "numero": {"type": "STRING"},
                    "mensagens": {
                        "type": "ARRAY",
                        "items": {
                            "type": "OBJECT",
                            "properties": {
                                "de": {"type": "STRING", "enum": ["voce", "ela"]},
                                "texto": {"type": "STRING"},
                                "avaliacao": {"type": "STRING", "enum": ["ruim", "boa"]},
                            },
                            "required": ["de", "texto"],
                        },
                    },
                },
                "required": ["tipo", "narracao"],
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
    prompt = ROTEIRO_PROMPT.format(tema=args.tema, publico=args.publico, cenas=args.cenas,
                                   pct_motion=args.pct_motion)
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
    n_motion = sum(tipo_cena(c) != "imagem" for c in roteiro["cenas"])
    print(f"roteiro: '{roteiro['titulo']}' com {len(roteiro['cenas'])} cenas "
          f"({n_motion} de motion) -> {path}")


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
            if tipo_cena(cena) != "imagem":
                pass  # motion é desenhado no render, não precisa de imagem
            elif existe_imagem(args.projeto, i):
                print(f"cena {i:02d}: imagem já existe, pulando")
            else:
                print(f"cena {i:02d}: gerando imagem ...", flush=True)
                if not cena.get("prompt_imagem"):
                    raise ValueError("cena de imagem sem prompt_imagem no roteiro")
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


def tipo_cena(cena: dict) -> str:
    return cena.get("tipo") or "imagem"


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


def montar_clipe(entrada: str, filtro_video: str, audio: str, dur: float, out_path: str) -> None:
    """Junta vídeo da cena + narração (com respiro no fim) num clipe intermediário."""
    run([
        "ffmpeg", "-y", "-loglevel", "error",
        "-i", entrada, "-i", audio,
        "-filter_complex",
        f"[0:v]{filtro_video}[v];[1:a]aresample=48000,aformat=channel_layouts=stereo,"
        f"apad=pad_dur={SCENE_TAIL_SECONDS}[a]",
        "-map", "[v]", "-map", "[a]", "-t", f"{dur:.3f}",
        # Clipe intermediário: qualidade alta e preset rápido; o encode final refina.
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-r", str(FPS),
        "-c:a", "aac", "-b:a", "192k", out_path,
    ])


def render_cena(cena: dict, imagem: str | None, audio: str, out_h: str, out_v: str | None,
                indice: int, cor_destaque: str) -> float:
    """Cena + narração -> clipe 1920x1080 e, se pedido, clipe 1080x1920.

    Imagem ganha Ken Burns e vinheta (sem grão animado: ele multiplica o
    bitrate; o grão vem do prompt da imagem); na vertical vira o quadro 16:9
    sobre uma cópia ampliada e desfocada dele. Motion é desenhado frame a
    frame em documentario_motion.py, nativo em cada orientação, pra texto e
    conversa continuarem legíveis no celular."""
    dur = duracao(audio) + SCENE_TAIL_SECONDS
    fades = (
        f"fade=t=in:st=0:d={FADE_SECONDS},"
        f"fade=t=out:st={dur - FADE_SECONDS:.3f}:d={FADE_SECONDS},format=yuv420p"
    )
    if tipo_cena(cena) != "imagem":
        tamanhos = [(out_h, 1920, 1080)] + ([(out_v, 1080, 1920)] if out_v else [])
        for out_path, w, h in tamanhos:
            motion = out_path.replace(".mp4", "_motion.mp4")
            render_motion(cena, dur, motion, FPS, cor_destaque, w, h)
            montar_clipe(motion, fades, audio, dur, out_path)
        return dur

    frames = max(int(round(dur * FPS)), 1)
    passo = KEN_BURNS_ZOOM / frames
    if indice % 2:  # alterna aproximar/afastar para não ficar monótono
        zoom = f"min(1+{passo:.6f}*on,{1 + KEN_BURNS_ZOOM})"
    else:
        zoom = f"max({1 + KEN_BURNS_ZOOM}-{passo:.6f}*on,1)"
    # Escala grande antes do zoompan evita o "tremido" típico do filtro.
    montar_clipe(imagem, (
        "scale=2880:1620:force_original_aspect_ratio=increase,crop=2880:1620,"
        f"zoompan=z='{zoom}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
        f":d={frames}:s=1920x1080:fps={FPS},vignette=PI/5,{fades}"
    ), audio, dur, out_h)
    if out_v:
        run(["ffmpeg", "-y", "-loglevel", "error", "-i", out_h, "-filter_complex",
             "[0:v]split=2[a][b];"
             # Desfoque em baixa resolução e depois amplia: bem mais rápido que gblur em 1080p.
             "[a]scale=270:480:force_original_aspect_ratio=increase,crop=270:480,"
             "boxblur=8:2,eq=brightness=-0.15,scale=1080:1920[bg];"
             "[b]scale=1080:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,format=yuv420p[v]",
             "-map", "[v]", "-map", "0:a",
             "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-c:a", "copy", out_v])
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
    dentro da fala da cena -- aproximação boa sem precisar de Whisper. Cenas
    de motion ficam sem legenda pra não brigar com o texto animado."""
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
        if tipo_cena(cena) != "imagem":  # o texto na tela já cumpre o papel da legenda
            inicio_cena += dur_cena
            continue
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
        i for i, cena in enumerate(cenas, start=1)
        if not os.path.exists(caminho_audio(args.projeto, i))
        or (tipo_cena(cena) == "imagem" and not existe_imagem(args.projeto, i))
    ]
    if faltando:
        sys.exit(f"Faltam áudio/imagem nas cenas {faltando}. Rode a etapa 'midia' antes.")

    clipes_h, clipes_v, duracoes, falas = [], [], [], []
    for i, cena in enumerate(cenas, start=1):
        audio = caminho_audio(args.projeto, i)
        clipe_h = os.path.join(build, f"cena_{i:02d}_16x9.mp4")
        clipe_v = None if args.sem_vertical else os.path.join(build, f"cena_{i:02d}_9x16.mp4")
        print(f"render: cena {i:02d}/{len(cenas)} ({tipo_cena(cena)})", flush=True)
        duracoes.append(render_cena(cena, existe_imagem(args.projeto, i), audio, clipe_h, clipe_v,
                                    i, args.cor_destaque))
        falas.append(duracao(audio))
        clipes_h.append(clipe_h)
        clipes_v.append(clipe_v)

    formatos = [("16x9", clipes_h, 1920, 1080, 7, "20")]
    if not args.sem_vertical:
        formatos.append(("9x16", clipes_v, 1080, 1920, 4, "21"))
    saidas = []
    for nome, clipes, w, h, max_palavras, crf in formatos:
        lista = os.path.join(build, f"concat_{nome}.txt")
        with open(lista, "w", encoding="utf-8") as f:
            f.writelines(f"file '{os.path.abspath(c)}'\n" for c in clipes)
        bruto = os.path.join(build, f"master_bruto_{nome}.mp4")
        run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0",
             "-i", lista, "-c", "copy", bruto])
        master = os.path.join(build, f"master_sem_legenda_{nome}.mp4")
        mixar_audio(bruto, args.musica, master)
        legenda = os.path.join(build, f"legenda_{nome}.ass")
        escrever_legenda(cenas, duracoes, falas, legenda, w, h, max_palavras)
        saida = os.path.join(args.projeto, f"documentario_{nome}.mp4")
        run(["ffmpeg", "-y", "-loglevel", "error", "-i", master,
             "-vf", f"ass='{ass_filter_path(legenda)}'",
             "-c:v", "libx264", "-preset", "medium", "-crf", crf, "-c:a", "copy", saida])
        saidas.append(saida)

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
    parser.add_argument("--pct-motion", type=int, default=30,
                        help="%% aproximado de cenas de motion graphics no roteiro (default 30)")
    parser.add_argument("--cor-destaque", default=COR_DESTAQUE,
                        help=f"Cor de destaque do motion, hex (default {COR_DESTAQUE})")
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
