"""Cenas de motion graphics para o documentario_faceless.py.

Cada cena é desenhada frame a frame com Pillow e enviada crua pro FFmpeg, sem
Node/Remotion. Três tipos:
  - texto:  tipografia animada, palavra por palavra; *palavra* entre asteriscos
            vira destaque na cor de marca, com sublinhado.
  - numero: contador que sobe até o valor ("90%", "3x", "R$ 1.200") + legenda.
  - chat:   conversa estilo app de mensagens, bolhas entrando em sequência,
            com selo opcional de mensagem "ruim"/"boa".

A animação de entrada ocupa o começo da cena e depois o quadro fica parado
enquanto a narração termina; os frames parados são reaproveitados, então o
custo de render fica concentrado nos primeiros segundos.
"""
from __future__ import annotations

import functools
import re
import subprocess

from PIL import Image, ImageDraw, ImageFont

TIPOS_MOTION = ("texto", "numero", "chat")

FG = (242, 242, 245)
MUTED = (160, 160, 172)
BOLHA_ELA = (44, 44, 52)
VERMELHO = (235, 72, 72)
VERDE = (52, 199, 89)
ENTRADA = 0.35  # duração da animação de entrada de cada elemento (s)

FONTES_NEGRITO = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/Library/Fonts/Arial Bold.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
]
FONTES_REGULAR = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/Library/Fonts/Arial.ttf",
    "C:/Windows/Fonts/arial.ttf",
]


@functools.lru_cache(maxsize=None)
def fonte(tamanho: int, negrito: bool = True) -> ImageFont.FreeTypeFont:
    for path in FONTES_NEGRITO if negrito else FONTES_REGULAR:
        try:
            return ImageFont.truetype(path, tamanho)
        except OSError:
            continue
    return ImageFont.load_default(tamanho)


def hex_para_rgb(cor: str) -> tuple[int, int, int]:
    cor = cor.lstrip("#")
    return tuple(int(cor[i:i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]


def ease_out(x: float) -> float:
    x = min(max(x, 0.0), 1.0)
    return 1 - (1 - x) ** 3


def progresso(t: float, inicio: float, duracao: float = ENTRADA) -> float:
    return ease_out((t - inicio) / duracao)


@functools.lru_cache(maxsize=4)
def fundo(W: int, H: int, BG: tuple = (12, 12, 16)) -> Image.Image:
    """Gradiente radial a partir da cor de fundo (centro um pouco mais claro):
    calculado pequeno e ampliado (rápido e suave)."""
    BG_CENTRO = tuple(min(c + 20, 255) for c in BG)
    pw, ph = W // 30, H // 30
    img = Image.new("RGB", (pw, ph))
    px = img.load()
    for y in range(ph):
        for x in range(pw):
            d = min((((x - pw / 2) / (pw / 2)) ** 2 + ((y - ph / 2) / (ph / 2)) ** 2) ** 0.5, 1)
            px[x, y] = tuple(int(c + (b - c) * d) for c, b in zip(BG_CENTRO, BG))
    return img.resize((W, H), Image.BICUBIC).convert("RGBA")


def camada_texto(texto: str, fnt: ImageFont.FreeTypeFont, cor) -> Image.Image:
    """Altura fixa pela métrica da fonte (não pelo recorte do texto), pra todas
    as palavras de uma linha dividirem a mesma linha de base."""
    x0, _, x1, _ = fnt.getbbox(texto)
    subida, descida = fnt.getmetrics()
    img = Image.new("RGBA", (x1 - x0 + 4, subida + descida + 4), (0, 0, 0, 0))
    ImageDraw.Draw(img).text((2 - x0, 2), texto, font=fnt, fill=cor)
    return img


def com_alpha(img: Image.Image, a: float) -> Image.Image:
    if a >= 1:
        return img
    out = img.copy()
    out.putalpha(img.getchannel("A").point(lambda v: int(v * a)))
    return out


def colar(base: Image.Image, img: Image.Image, x: float, y: float, a: float = 1.0) -> None:
    if a <= 0:
        return
    base.alpha_composite(com_alpha(img, a), (int(x), int(y)))


def quebrar(palavras: list[str], fnt: ImageFont.FreeTypeFont, largura: int) -> list[list[str]]:
    linhas: list[list[str]] = [[]]
    for p in palavras:
        teste = " ".join(linhas[-1] + [p])
        if linhas[-1] and fnt.getlength(teste) > largura:
            linhas.append([p])
        else:
            linhas[-1].append(p)
    return linhas


# --------------------------------------------------------------------------
# Tipo "texto": tipografia animada
# --------------------------------------------------------------------------

def cena_texto(cena: dict, dur: float, cores: dict, W: int, H: int) -> tuple:
    destaque = cores["destaque"]
    bruto = (cena.get("texto_tela") or "").split()
    if not bruto:
        raise ValueError("cena 'texto' sem 'texto_tela'")
    tokens = [(p.strip("*"), p.startswith("*") or p.endswith("*")) for p in bruto]
    palavras = [p for p, _ in tokens]

    tamanho = 120 if W > H else 104
    max_linhas = 4 if W > H else 6
    while True:
        fnt = fonte(tamanho)
        linhas = quebrar(palavras, fnt, int(W * 0.84))
        if len(linhas) <= max_linhas or tamanho <= 56:
            break
        tamanho -= 8
    espaco = fnt.getlength(" ")
    altura_linha = int(tamanho * 1.25)
    topo = (H - altura_linha * len(linhas)) / 2

    janela = min(dur * 0.55, 0.28 * len(tokens))
    passo = janela / max(len(tokens), 1)
    elementos = []  # (camada, x, y, inicio, destaque?, largura)
    i = 0
    for n, linha in enumerate(linhas):
        largura = sum(fnt.getlength(p) for p in linha) + espaco * (len(linha) - 1)
        x = (W - largura) / 2
        for p in linha:
            _, marcado = tokens[i]
            cor = destaque if marcado else FG
            elementos.append((camada_texto(p, fnt, cor), x, topo + n * altura_linha,
                              0.15 + i * passo, marcado, fnt.getlength(p)))
            x += fnt.getlength(p) + espaco
            i += 1
    fim = 0.15 + janela + ENTRADA + 0.4

    def frame(t: float) -> Image.Image:
        img = fundo(W, H, cores["fundo"]).copy()
        draw = ImageDraw.Draw(img)
        for camada, x, y, inicio, marcado, largura in elementos:
            p = progresso(t, inicio)
            colar(img, camada, x, y + (1 - p) * 40, p)
            if marcado and p > 0:
                s = progresso(t, inicio + 0.2, 0.4)
                yb = y + tamanho * 1.08
                draw.rectangle([x, yb, x + largura * s, yb + max(tamanho // 14, 4)], fill=destaque)
        return img

    return frame, fim


# --------------------------------------------------------------------------
# Tipo "numero": contador
# --------------------------------------------------------------------------

def _parse_numero(texto: str):
    m = re.match(r"^(\D*?)(\d[\d.,]*)(.*)$", texto.strip())
    if not m:
        return None
    prefixo, num, sufixo = m.groups()
    if "," in num:  # padrão pt-BR: 1.200,5
        inteiro, _, dec = num.partition(",")
        casas = len(dec)
        valor = float(inteiro.replace(".", "") + "." + dec)
    elif re.fullmatch(r"\d{1,3}(\.\d{3})+", num):  # 1.200 = milhar
        casas, valor = 0, float(num.replace(".", ""))
    else:
        casas = len(num.partition(".")[2])
        valor = float(num)
    milhar = "." in num and casas == 0
    return prefixo, valor, casas, milhar, sufixo


def _formatar(valor: float, casas: int, milhar: bool) -> str:
    s = f"{valor:,.{casas}f}"  # 1,234.5
    s = s.replace(",", "_").replace(".", ",").replace("_", ".")
    return s if milhar or casas else s.replace(".", "")


def cena_numero(cena: dict, dur: float, cores: dict, W: int, H: int) -> tuple:
    destaque = cores["destaque"]
    alvo = (cena.get("numero") or "").strip()
    if not alvo:
        raise ValueError("cena 'numero' sem 'numero'")
    legenda = (cena.get("texto_tela") or "").replace("*", "")
    parsed = _parse_numero(alvo)
    tamanho_num = 260
    while fonte(tamanho_num).getlength(alvo) > W * 0.88 and tamanho_num > 100:
        tamanho_num -= 20
    fnt_num = fonte(tamanho_num)
    fnt_leg = fonte(64)
    largura_leg = int(W * (0.7 if W > H else 0.84))
    linhas_leg = [" ".join(l) for l in quebrar(legenda.split(), fnt_leg, largura_leg)] if legenda else []
    camadas_leg = [camada_texto(l, fnt_leg, FG) for l in linhas_leg]
    contagem = 1.3

    def texto_em(t: float) -> str:
        if not parsed:
            return alvo
        prefixo, valor, casas, milhar, sufixo = parsed
        v = valor * ease_out((t - 0.2) / contagem)
        if casas == 0:
            v = round(v)
        return f"{prefixo}{_formatar(v, casas, milhar)}{sufixo}"

    alt_num = sum(fnt_num.getmetrics())
    altura_bloco = alt_num + 20 + len(camadas_leg) * 84
    topo = (H - altura_bloco) / 2
    fim = 0.2 + contagem + 0.9 + ENTRADA

    def frame(t: float) -> Image.Image:
        img = fundo(W, H, cores["fundo"]).copy()
        p = progresso(t, 0.1)
        num = camada_texto(texto_em(t), fnt_num, destaque)
        colar(img, num, (W - num.width) / 2, topo + (1 - p) * 30, p)
        for k, camada in enumerate(camadas_leg):
            q = progresso(t, 0.9 + k * 0.15)
            colar(img, camada, (W - camada.width) / 2, topo + alt_num + 20 + k * 84 + (1 - q) * 20, q)
        return img

    return frame, fim


# --------------------------------------------------------------------------
# Tipo "chat": conversa de app de mensagens
# --------------------------------------------------------------------------

def _bolha(texto: str, cor, tamanho: int, largura_max: int) -> Image.Image:
    fnt = fonte(tamanho, negrito=False)
    linhas = [" ".join(l) for l in quebrar(texto.split(), fnt, largura_max)]
    alt_linha = int(tamanho * 1.3)
    larg = int(max(fnt.getlength(l) for l in linhas))
    px, py = int(tamanho * 0.6), int(tamanho * 0.45)
    img = Image.new("RGBA", (larg + 2 * px, alt_linha * len(linhas) + 2 * py), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, img.width - 1, img.height - 1], radius=int(tamanho * 0.75),
                        fill=cor)
    for k, linha in enumerate(linhas):
        d.text((px, py + k * alt_linha), linha, font=fnt, fill=FG)
    return img


def _selo(avaliacao: str, raio: int) -> Image.Image:
    img = Image.new("RGBA", (2 * raio, 2 * raio), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    boa = avaliacao == "boa"
    d.ellipse([0, 0, 2 * raio - 1, 2 * raio - 1], fill=VERDE if boa else VERMELHO)
    e = max(raio // 4, 3)
    if boa:
        d.line([(raio * 0.55, raio * 1.05), (raio * 0.88, raio * 1.38), (raio * 1.48, raio * 0.7)],
               fill=FG, width=e, joint="curve")
    else:
        a, b = raio * 0.62, raio * 1.38
        d.line([(a, a), (b, b)], fill=FG, width=e)
        d.line([(a, b), (b, a)], fill=FG, width=e)
    return img


def cena_chat(cena: dict, dur: float, cores: dict, W: int, H: int) -> tuple:
    mensagens = cena.get("mensagens") or []
    if not mensagens:
        raise ValueError("cena 'chat' sem 'mensagens'")
    titulo = (cena.get("texto_tela") or "").replace("*", "")
    tam_titulo = 54
    while titulo and fonte(tam_titulo).getlength(titulo) > W * 0.9 and tam_titulo > 30:
        tam_titulo -= 4
    camada_titulo = camada_texto(titulo, fonte(tam_titulo), MUTED) if titulo else None

    # Horizontal: coluna central estreita. Vertical: quase a largura toda.
    margem = 0.24 if W > H else 0.1
    coluna_esq, coluna_dir = int(W * margem), int(W * (1 - margem))
    tamanho = 46 if W > H else 44
    while True:  # diminui a fonte até a conversa caber na tela
        largura_max = int((coluna_dir - coluna_esq) * 0.72)
        # "voce" usa a cor de destaque (marca); "ela" fica cinza neutro.
        bolhas = [_bolha(m["texto"], cores["destaque"] if m.get("de") == "voce" else BOLHA_ELA,
                         tamanho, largura_max) for m in mensagens]
        gap = int(tamanho * 0.5)
        total = sum(b.height for b in bolhas) + gap * (len(bolhas) - 1)
        total += 100 if camada_titulo else 0
        if total <= H * (0.82 if W > H else 0.6) or tamanho <= 28:
            break
        tamanho -= 4

    y = (H - total) / 2
    titulo_pos = None
    if camada_titulo:
        titulo_pos = ((W - camada_titulo.width) / 2, y)
        y += 100
    janela = min(dur * 0.65, 1.1 * len(bolhas))
    passo = janela / len(bolhas)
    raio = int(tamanho * 0.6)
    elementos = []  # (bolha, x, y, inicio, selo, xs, ys)
    for k, (m, b) in enumerate(zip(mensagens, bolhas)):
        de_voce = m.get("de") == "voce"
        x = coluna_dir - b.width if de_voce else coluna_esq
        selo = _selo(m["avaliacao"], raio) if m.get("avaliacao") in ("boa", "ruim") else None
        xs = x - 2 * raio - 24 if de_voce else x + b.width + 24
        elementos.append((b, x, y, 0.3 + k * passo, selo, xs, y + (b.height - 2 * raio) / 2))
        y += b.height + gap
    fim = 0.3 + janela + ENTRADA + 0.5

    def frame(t: float) -> Image.Image:
        img = fundo(W, H, cores["fundo"]).copy()
        if camada_titulo:
            colar(img, camada_titulo, titulo_pos[0], titulo_pos[1], progresso(t, 0.0))
        for b, x, yb, inicio, selo, xs, ys in elementos:
            p = progresso(t, inicio)
            colar(img, b, x, yb + (1 - p) * 30, p)
            if selo is not None:
                colar(img, selo, xs, ys, progresso(t, inicio + 0.35, 0.25))
        return img

    return frame, fim


# --------------------------------------------------------------------------
# Render
# --------------------------------------------------------------------------

CONSTRUTORES = {"texto": cena_texto, "numero": cena_numero, "chat": cena_chat}


def render_motion(cena: dict, dur: float, out_path: str, fps: int, cor_destaque: str,
                  W: int = 1920, H: int = 1080, cor_fundo: str = "#0C0C10") -> None:
    """Gera um mp4 mudo de `dur` segundos para a cena de motion, em WxH
    (1920x1080 ou 1080x1920: o layout se adapta à orientação)."""
    cores = {"destaque": hex_para_rgb(cor_destaque), "fundo": hex_para_rgb(cor_fundo)}
    frame, fim_animacao = CONSTRUTORES[cena["tipo"]](cena, dur, cores, W, H)
    total = max(int(round(dur * fps)), 1)
    proc = subprocess.Popen(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
         "-s", f"{W}x{H}", "-r", str(fps), "-i", "-",
         "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-pix_fmt", "yuv420p", out_path],
        stdin=subprocess.PIPE, stderr=subprocess.PIPE,
    )
    parado = None
    try:
        for n in range(total):
            t = n / fps
            if t > fim_animacao:
                if parado is None:
                    parado = frame(t).convert("RGB").tobytes()
                proc.stdin.write(parado)
            else:
                proc.stdin.write(frame(t).convert("RGB").tobytes())
        proc.stdin.close()
    except BrokenPipeError:
        pass
    if proc.wait() != 0:
        raise RuntimeError(f"FFmpeg falhou na cena de motion: {proc.stderr.read().decode()[-1500:]}")
