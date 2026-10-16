"""Cenas de motion graphics para o documentario_faceless.py.

Cada cena é desenhada frame a frame com Pillow e enviada crua pro FFmpeg, sem
Node/Remotion. Três tipos:
  - texto:  tipografia cinética: cada palavra entra com escala elástica e foco
            puxado (desfocado -> nítido); *palavra* entre asteriscos ganha
            marca-texto na cor de destaque, com brilho.
  - numero: contador que sobe até o valor ("90%", "3x", "R$ 1.200") dentro de
            um anel de progresso sincronizado, com brilho + legenda.
  - chat:   conversa dentro de um celular: "digitando..." antes da resposta
            dela, bolhas com mola, selos ruim/boa que batem na tela e rolagem
            quando a conversa passa da altura da tela.
  - lista:  título + cards numerados que entram em sequência com mola; o card
            mais recente pulsa na cor de destaque.
  - comparacao: dois painéis (ex.: ruim x boa) que entram um de cada lado,
            com um selo "VS" que bate no meio.

Fora dos tipos de cena, render_rotulo() gera um letreiro animado (camada com
transparência) pra sobrepor às cenas de imagem com o conceito-chave da fala.

Linguagem visual comum (o que deixa o motion "cinematográfico"):
  - fundo vivo: a imagem da cena vizinha desfocada e escurecida (continuidade
    com o resto do vídeo), luzes na cor de destaque flutuando, grão de filme
    fixo e vinheta;
  - câmera: entra com um "soco" de zoom + flash curto e segue num avanço
    lento contínuo, então nenhum frame fica parado.
"""
from __future__ import annotations

import functools
import math
import os
import random
import re
import subprocess

from PIL import Image, ImageDraw, ImageFilter, ImageFont

TIPOS_MOTION = ("texto", "numero", "chat", "lista", "comparacao")

FG = (242, 242, 245)
MUTED = (160, 160, 172)
BOLHA_ELA = (44, 47, 58)
VERMELHO = (235, 72, 72)
VERDE = (52, 199, 89)

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


# --------------------------------------------------------------------------
# Curvas de animação
# --------------------------------------------------------------------------

def clamp(x: float) -> float:
    return min(max(x, 0.0), 1.0)


def ease_out(x: float) -> float:
    return 1 - (1 - clamp(x)) ** 3


def ease_in_out(x: float) -> float:
    x = clamp(x)
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2


def ease_out_back(x: float, s: float = 1.9) -> float:
    """Passa um pouco do alvo e volta: a "mola" das entradas."""
    x = clamp(x) - 1
    return 1 + (s + 1) * x ** 3 + s * x ** 2


def prog(t: float, inicio: float, duracao: float) -> float:
    return clamp((t - inicio) / duracao)


# --------------------------------------------------------------------------
# Camadas utilitárias
# --------------------------------------------------------------------------

def camada_texto(texto: str, fnt: ImageFont.FreeTypeFont, cor, margem: int = 2) -> Image.Image:
    """Altura fixa pela métrica da fonte (não pelo recorte do texto), pra todas
    as palavras de uma linha dividirem a mesma linha de base."""
    x0, _, x1, _ = fnt.getbbox(texto)
    subida, descida = fnt.getmetrics()
    img = Image.new("RGBA", (x1 - x0 + 2 * margem, subida + descida + 2 * margem), (0, 0, 0, 0))
    ImageDraw.Draw(img).text((margem - x0, margem), texto, font=fnt, fill=cor)
    return img


def brilho(img: Image.Image, cor, raio: int, forca: float = 1.0) -> Image.Image:
    """Halo desfocado na cor dada, do tamanho da camada + margem do raio."""
    m = raio * 2
    base = Image.new("RGBA", (img.width + 2 * m, img.height + 2 * m), (0, 0, 0, 0))
    mascara = Image.new("L", base.size, 0)
    mascara.paste(img.getchannel("A"), (m, m))
    mascara = mascara.filter(ImageFilter.GaussianBlur(raio)).point(lambda v: min(255, int(v * forca)))
    halo = Image.new("RGBA", base.size, (*cor, 255))
    halo.putalpha(mascara)
    return halo


def com_alpha(img: Image.Image, a: float) -> Image.Image:
    if a >= 1:
        return img
    out = img.copy()
    out.putalpha(img.getchannel("A").point(lambda v: int(v * a)))
    return out


def colar_centro(base: Image.Image, img: Image.Image, cx: float, cy: float,
                 escala: float = 1.0, a: float = 1.0) -> None:
    """Cola img centralizada em (cx, cy), com escala e opacidade."""
    if a <= 0.01 or escala <= 0.01:
        return
    if abs(escala - 1) > 0.005:
        img = img.resize((max(1, int(img.width * escala)), max(1, int(img.height * escala))),
                         Image.BILINEAR)
    img = com_alpha(img, a)
    x, y = int(cx - img.width / 2), int(cy - img.height / 2)
    # alpha_composite não aceita destino negativo: recorta o que sai da tela.
    sx, sy = max(0, -x), max(0, -y)
    if sx >= img.width or sy >= img.height:
        return
    if sx or sy:
        img = img.crop((sx, sy, img.width, img.height))
    base.alpha_composite(img, (x + sx, y + sy))


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
# Fundo vivo + câmera
# --------------------------------------------------------------------------

class Palco:
    """Fundo animado e câmera compartilhados por todos os tipos de cena."""

    MARGEM = 1.12  # fundo maior que o quadro, pra poder deslizar

    def __init__(self, W: int, H: int, cores: dict, dur: float, imagem_fundo: str | None, semente: int):
        self.W, self.H, self.dur = W, H, dur
        self.rng = random.Random(semente)
        bw, bh = int(W * self.MARGEM), int(H * self.MARGEM)
        fundo_cor = cores["fundo"]
        if imagem_fundo and os.path.exists(imagem_fundo):
            with Image.open(imagem_fundo) as im:
                im = im.convert("RGB")
                esc = max(bw / im.width, bh / im.height)
                im = im.resize((int(im.width * esc) + 1, int(im.height * esc) + 1), Image.BILINEAR)
                im = im.crop(((im.width - bw) // 2, (im.height - bh) // 2,
                              (im.width - bw) // 2 + bw, (im.height - bh) // 2 + bh))
            # Desfoque em resolução baixa (rápido) e escurecido na cor de fundo.
            pequeno = im.resize((bw // 8, bh // 8), Image.BILINEAR).filter(ImageFilter.GaussianBlur(4))
            im = pequeno.resize((bw, bh), Image.BICUBIC)
            fundo = Image.blend(im, Image.new("RGB", (bw, bh), fundo_cor), 0.72)
        else:
            fundo = Image.new("RGB", (bw, bh), fundo_cor)
        self.fundo = fundo.convert("RGBA")
        # Deslize lento do fundo em direção aleatória (parallax de fundo).
        ang = self.rng.uniform(0, 2 * math.pi)
        self.desl = (math.cos(ang) * (bw - W) / 2.2, math.sin(ang) * (bh - H) / 2.2)

        # Luzes na cor de destaque, grandes e suaves, flutuando.
        lado = int(min(W, H) * 1.1)
        luz = Image.new("L", (lado, lado), 0)
        ImageDraw.Draw(luz).ellipse([lado * 0.2, lado * 0.2, lado * 0.8, lado * 0.8], fill=46)
        luz = luz.resize((lado // 6, lado // 6), Image.BILINEAR).filter(ImageFilter.GaussianBlur(10))
        luz = luz.resize((lado, lado), Image.BICUBIC)
        self.luz = Image.new("RGBA", (lado, lado), (*cores["destaque"], 255))
        self.luz.putalpha(luz)
        self.luzes = [
            (self.rng.uniform(0.15, 0.85), self.rng.uniform(0.15, 0.85),
             self.rng.uniform(0.08, 0.16), self.rng.uniform(0, 2 * math.pi))
            for _ in range(2)
        ]
        self.vinheta = _vinheta(W, H)
        self.grao = _grao(W, H)

    def base(self, t: float) -> Image.Image:
        W, H = self.W, self.H
        p = ease_in_out(t / max(self.dur, 0.01))
        ox = (self.fundo.width - W) / 2 + self.desl[0] * (p * 2 - 1)
        oy = (self.fundo.height - H) / 2 + self.desl[1] * (p * 2 - 1)
        img = self.fundo.crop((int(ox), int(oy), int(ox) + W, int(oy) + H))
        for fx, fy, vel, fase in self.luzes:
            cx = W * (fx + 0.12 * math.sin(t * vel * 2 * math.pi + fase))
            cy = H * (fy + 0.10 * math.cos(t * vel * 1.6 * math.pi + fase))
            colar_centro(img, self.luz, cx, cy)
        return img

    def camera(self, img: Image.Image, t: float) -> Image.Image:
        """Grão + vinheta, soco de zoom na entrada, avanço lento e flash."""
        img.alpha_composite(self.grao)
        img.alpha_composite(self.vinheta)
        soco = 0.14 * (1 - ease_out(t / 0.45))
        escala = 1 + 0.045 * (t / max(self.dur, 0.01)) + soco
        W, H = self.W, self.H
        if escala > 1.002:
            nw, nh = int(W * escala), int(H * escala)
            img = img.resize((nw, nh), Image.BILINEAR)
            img = img.crop(((nw - W) // 2, (nh - H) // 2, (nw - W) // 2 + W, (nh - H) // 2 + H))
        flash = 0.22 * (1 - clamp(t / 0.18))
        if flash > 0.01:
            img = Image.blend(img, Image.new("RGBA", (W, H), (255, 255, 255, 255)), flash)
        return img


@functools.lru_cache(maxsize=4)
def _vinheta(W: int, H: int) -> Image.Image:
    pw, ph = 48, int(48 * H / W)
    m = Image.new("L", (pw, ph))
    px = m.load()
    for y in range(ph):
        for x in range(pw):
            d = (((x - pw / 2) / (pw / 2)) ** 2 + ((y - ph / 2) / (ph / 2)) ** 2) ** 0.5
            px[x, y] = int(255 * clamp((d - 0.55) / 0.75) ** 1.6 * 0.85)
    m = m.resize((W, H), Image.BICUBIC)
    out = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    out.putalpha(m)
    return out


@functools.lru_cache(maxsize=4)
def _grao(W: int, H: int) -> Image.Image:
    """Grão fixo (não muda por frame, pra não explodir o bitrate)."""
    ruido = Image.frombytes("L", (W // 2, H // 2), os.urandom((W // 2) * (H // 2)))
    ruido = ruido.resize((W, H), Image.NEAREST)
    out = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    out.putalpha(ruido.point(lambda v: v * 14 // 255))
    return out


# --------------------------------------------------------------------------
# Tipo "texto": tipografia cinética
# --------------------------------------------------------------------------

def cena_texto(cena: dict, dur: float, cores: dict, W: int, H: int, palco: Palco):
    bruto = (cena.get("texto_tela") or "").split()
    if not bruto:
        raise ValueError("cena 'texto' sem 'texto_tela'")
    tokens = [(p.replace("*", ""), "*" in p) for p in bruto]
    palavras = [p for p, _ in tokens]
    destaque = cores["destaque"]

    vertical = H > W
    tamanho = 112 if vertical else 116
    max_linhas = 6 if vertical else 4
    while True:
        fnt = fonte(tamanho)
        linhas = quebrar(palavras, fnt, int(W * 0.82))
        if len(linhas) <= max_linhas or tamanho <= 56:
            break
        tamanho -= 8
    espaco = fnt.getlength(" ") * 1.1
    altura_linha = int(tamanho * 1.32)
    topo = (H - altura_linha * len(linhas)) / 2

    passo = min(0.22, dur * 0.5 / max(len(tokens), 1))
    elementos = []
    i = 0
    for n, linha in enumerate(linhas):
        larguras = [fnt.getlength(p) for p in linha]
        x = (W - sum(larguras) - espaco * (len(linha) - 1)) / 2
        for p, larg in zip(linha, larguras):
            _, marcado = tokens[i]
            nitida = camada_texto(p, fnt, FG, margem=12)
            desfocada = nitida.filter(ImageFilter.GaussianBlur(9))
            halo = brilho(nitida, destaque, 18, 1.4) if marcado else None
            cx = x + larg / 2
            cy = topo + n * altura_linha + altura_linha / 2
            elementos.append((nitida, desfocada, halo, cx, cy, larg, 0.12 + i * passo, marcado))
            x += larg + espaco
            i += 1

    def frame(t: float) -> Image.Image:
        img = palco.base(t)
        draw = ImageDraw.Draw(img)
        flutua = math.sin(t * 1.3) * 6
        for nitida, desfocada, halo, cx, cy, larg, inicio, marcado in elementos:
            p = prog(t, inicio, 0.5)
            if p <= 0:
                continue
            escala = 0.55 + 0.45 * ease_out_back(p)
            dy = (1 - ease_out(p)) * 70 + flutua
            foco = ease_out(prog(t, inicio, 0.32))
            if marcado:
                # Marca-texto que varre da esquerda pra direita atrás da palavra.
                q = ease_out(prog(t, inicio + 0.18, 0.35))
                if q > 0:
                    alt = tamanho * 0.98
                    x0 = cx - larg / 2 - 14
                    draw.rounded_rectangle(
                        [x0, cy - alt / 2 + dy, x0 + (larg + 28) * q, cy + alt / 2 + dy],
                        radius=int(tamanho * 0.16), fill=(*destaque, 255))
                    colar_centro(img, halo, cx, cy + dy, escala, q * 0.9)
            colar_centro(img, desfocada, cx, cy + dy, escala, (1 - foco) * min(1, p * 2.5))
            colar_centro(img, nitida, cx, cy + dy, escala, foco)
        return palco.camera(img, t)

    return frame


# --------------------------------------------------------------------------
# Tipo "numero": contador com anel
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


def cena_numero(cena: dict, dur: float, cores: dict, W: int, H: int, palco: Palco):
    alvo = (cena.get("numero") or "").strip()
    if not alvo:
        raise ValueError("cena 'numero' sem 'numero'")
    destaque = cores["destaque"]
    legenda = (cena.get("texto_tela") or "").replace("*", "")
    parsed = _parse_numero(alvo)

    tamanho_num = 300
    while fonte(tamanho_num).getlength(alvo) > W * 0.62 and tamanho_num > 100:
        tamanho_num -= 20
    fnt_num = fonte(tamanho_num)
    fnt_leg = fonte(60)
    largura_leg = int(W * (0.7 if W > H else 0.82))
    camadas_leg = [camada_texto(" ".join(l), fnt_leg, FG, margem=6)
                   for l in quebrar(legenda.split(), fnt_leg, largura_leg)] if legenda else []

    raio = int(max(fnt_num.getlength(alvo) * 0.62, tamanho_num * 0.95))
    raio = min(raio, int(min(W, H) * 0.42))
    espessura = max(int(raio * 0.06), 10)
    cx = W / 2
    alt_leg = len(camadas_leg) * 76
    cy = (H - alt_leg - 60) / 2
    contagem = 1.4

    def anel(p: float) -> Image.Image:
        lado = 2 * raio + 4 * espessura
        img = Image.new("RGBA", (lado, lado), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        caixa = [2 * espessura, 2 * espessura, lado - 2 * espessura, lado - 2 * espessura]
        d.ellipse(caixa, outline=(255, 255, 255, 38), width=espessura)
        if p > 0:
            d.arc(caixa, -90, -90 + 360 * p, fill=(*destaque, 255), width=espessura)
            # Ponta luminosa do arco.
            ang = math.radians(-90 + 360 * p)
            px = lado / 2 + raio * math.cos(ang)
            py = lado / 2 + raio * math.sin(ang)
            r = espessura * 0.9
            d.ellipse([px - r, py - r, px + r, py + r], fill=(255, 255, 255, 255))
        return img

    def texto_em(t: float) -> str:
        if not parsed:
            return alvo
        prefixo, valor, casas, milhar, sufixo = parsed
        v = valor * ease_out(prog(t, 0.25, contagem))
        if casas == 0:
            v = round(v)
        return f"{prefixo}{_formatar(v, casas, milhar)}{sufixo}"

    halo_final = brilho(camada_texto(alvo, fnt_num, destaque), destaque, 28, 1.2)

    def frame(t: float) -> Image.Image:
        img = palco.base(t)
        p_anel = ease_in_out(prog(t, 0.2, contagem + 0.1))
        entrada = ease_out_back(prog(t, 0.05, 0.55))
        a = anel(p_anel)
        colar_centro(img, brilho(a, destaque, 14, 0.9) if p_anel > 0 else a, cx, cy, entrada, 0.55)
        colar_centro(img, a, cx, cy, entrada)
        num = camada_texto(texto_em(t), fnt_num, FG)
        terminou = prog(t, 0.25 + contagem, 0.4)
        if terminou > 0:  # pulso de brilho quando a contagem fecha
            colar_centro(img, halo_final, cx, cy, 1 + 0.06 * (1 - terminou), 0.9 * (1 - terminou * 0.5))
        colar_centro(img, num, cx, cy, 0.7 + 0.3 * entrada, min(1, entrada * 1.4))
        topo_leg = cy + raio + 2 * espessura + 50
        for k, camada in enumerate(camadas_leg):
            q = prog(t, 0.25 + contagem * 0.7 + k * 0.12, 0.45)
            colar_centro(img, camada, W / 2, topo_leg + k * 76 + (1 - ease_out(q)) * 40,
                         1, ease_out(q))
        return palco.camera(img, t)

    return frame


# --------------------------------------------------------------------------
# Tipo "chat": conversa dentro de um celular
# --------------------------------------------------------------------------

def _bolha(texto: str, cor, tamanho: int, largura_max: int) -> Image.Image:
    fnt = fonte(tamanho, negrito=False)
    linhas = [" ".join(l) for l in quebrar(texto.split(), fnt, largura_max)]
    alt_linha = int(tamanho * 1.3)
    larg = int(max(fnt.getlength(l) for l in linhas))
    px, py = int(tamanho * 0.6), int(tamanho * 0.45)
    img = Image.new("RGBA", (larg + 2 * px, alt_linha * len(linhas) + 2 * py), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, img.width - 1, img.height - 1], radius=int(tamanho * 0.75), fill=cor)
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


def cena_chat(cena: dict, dur: float, cores: dict, W: int, H: int, palco: Palco):
    mensagens = cena.get("mensagens") or []
    if not mensagens:
        raise ValueError("cena 'chat' sem 'mensagens'")
    destaque = cores["destaque"]
    vertical = H > W
    titulo = (cena.get("texto_tela") or "").replace("*", "")

    # Celular: proporção de tela de smartphone, ocupando boa parte do quadro.
    ph = int(H * (0.70 if vertical else 0.92))
    pw = int(ph * (0.50 if vertical else 0.56))
    if pw > W * 0.86:
        pw = int(W * 0.86)
        ph = int(pw / 0.50)
    raio_cel = int(pw * 0.11)
    borda = max(pw // 60, 6)
    tela_x0, tela_y0 = borda + 8, borda + 8
    tela_w, tela_h = pw - 2 * tela_x0, ph - 2 * tela_y0
    cab_h = int(tela_h * 0.11)

    moldura = Image.new("RGBA", (pw, ph), (0, 0, 0, 0))
    d = ImageDraw.Draw(moldura)
    d.rounded_rectangle([0, 0, pw - 1, ph - 1], radius=raio_cel, fill=(34, 37, 46, 255))
    d.rounded_rectangle([tela_x0, tela_y0, pw - tela_x0, ph - tela_y0], radius=raio_cel - 10,
                        fill=(13, 15, 20, 255))
    # Cabeçalho do app: avatar, nome e "online".
    av = int(cab_h * 0.56)
    ax, ay = tela_x0 + int(tela_w * 0.07), tela_y0 + (cab_h - av) // 2 + int(cab_h * 0.12)
    d.ellipse([ax, ay, ax + av, ay + av], fill=(*destaque, 255))
    d.text((ax + av + 18, ay + av * 0.02), "Ela", font=fonte(int(av * 0.5)), fill=FG)
    d.text((ax + av + 18, ay + av * 0.55), "online", font=fonte(int(av * 0.32), False), fill=MUTED)
    d.line([tela_x0, tela_y0 + cab_h + int(cab_h * 0.12), pw - tela_x0, tela_y0 + cab_h + int(cab_h * 0.12)],
           fill=(40, 43, 52, 255), width=2)
    # Ilha/notch.
    nw = int(pw * 0.26)
    d.rounded_rectangle([(pw - nw) // 2, tela_y0 + 14, (pw + nw) // 2, tela_y0 + 14 + int(cab_h * 0.18)],
                        radius=20, fill=(0, 0, 0, 255))
    sombra = brilho(moldura, (0, 0, 0), 40, 1.0)
    contorno = brilho(moldura, destaque, 22, 0.5)

    tamanho = max(int(tela_w * (0.062 if vertical else 0.064)), 24)
    largura_max = int(tela_w * 0.68)
    bolhas = [_bolha(m["texto"], destaque if m.get("de") == "voce" else BOLHA_ELA, tamanho, largura_max)
              for m in mensagens]
    gap = int(tamanho * 0.55)
    margem_x = int(tela_w * 0.05)
    area_topo = tela_y0 + cab_h + int(cab_h * 0.3)
    area_base = ph - tela_y0 - int(tamanho * 1.2)
    raio_selo = int(tamanho * 0.62)

    # Linha do tempo: "digitando..." antes de cada mensagem dela.
    janela = dur * 0.68
    passo = janela / len(mensagens)
    agenda = []
    t = 0.45
    y_conteudo = 0
    for m, b in zip(mensagens, bolhas):
        dela = m.get("de") != "voce"
        digitando = min(0.7, passo * 0.45) if dela else 0
        agenda.append({
            "bolha": b, "dela": dela, "digitando": (t, t + digitando),
            "inicio": t + digitando, "y": y_conteudo,
            "selo": _selo(m["avaliacao"], raio_selo) if m.get("avaliacao") in ("boa", "ruim") else None,
        })
        y_conteudo += b.height + gap
        t += max(passo, digitando + 0.5)

    camada_titulo = None
    if titulo:
        # Vertical: uma linha acima do celular. Horizontal: coluna à esquerda,
        # grande e quebrada em linhas, como um letreiro.
        tam = 54 if vertical else 76
        largura_tit = W * 0.9 if vertical else W * 0.4
        fnt_t = fonte(tam)
        linhas_tit = [" ".join(l) for l in quebrar(titulo.split(), fnt_t, int(largura_tit))]
        while vertical and len(linhas_tit) > 1 and tam > 30:
            tam -= 4
            fnt_t = fonte(tam)
            linhas_tit = [" ".join(l) for l in quebrar(titulo.split(), fnt_t, int(largura_tit))]
        alt_l = int(tam * 1.25)
        camada_titulo = Image.new("RGBA", (int(largura_tit) + 20, alt_l * len(linhas_tit) + 20), (0, 0, 0, 0))
        dt = ImageDraw.Draw(camada_titulo)
        for k, l in enumerate(linhas_tit):
            lx = (camada_titulo.width - fnt_t.getlength(l)) / 2 if vertical else 10
            dt.text((lx, 10 + k * alt_l), l, font=fnt_t, fill=FG)

    cel_cx = W / 2 if vertical or not camada_titulo else W * 0.68
    cel_cy = (H / 2 + (50 if camada_titulo else 0)) if vertical else H / 2
    tit_cx, tit_cy = (W / 2, cel_cy - ph / 2 - 70) if vertical else (W * 0.08 + W * 0.2, H / 2)

    def pontinhos(t0: float, t: float) -> Image.Image:
        lado_w, lado_h = int(tamanho * 2.8), int(tamanho * 1.7)
        img = Image.new("RGBA", (lado_w, lado_h), (0, 0, 0, 0))
        dd = ImageDraw.Draw(img)
        dd.rounded_rectangle([0, 0, lado_w - 1, lado_h - 1], radius=lado_h // 2, fill=BOLHA_ELA)
        for k in range(3):
            fase = (t - t0) * 2 * math.pi * 1.6 - k * 0.9
            dy = -abs(math.sin(fase)) * tamanho * 0.22
            r = tamanho * 0.16
            x = lado_w * (0.3 + 0.2 * k)
            y = lado_h / 2 + dy
            dd.ellipse([x - r, y - r, x + r, y + r], fill=(200, 200, 210, 255))
        return img

    def frame(t: float) -> Image.Image:
        img = palco.base(t)
        cel = moldura.copy()
        # Rolagem: quando a conversa passa da área visível, sobe o conteúdo.
        visiveis = [e for e in agenda if t >= e["digitando"][0]]
        fundo_conteudo = 0
        for e in visiveis:
            fundo_conteudo = e["y"] + (e["bolha"].height if t >= e["inicio"] else int(tamanho * 1.7))
        excesso = max(0, area_topo + fundo_conteudo - area_base)
        rolagem = getattr(frame, "rolagem", 0.0)
        rolagem += (excesso - rolagem) * 0.18
        frame.rolagem = rolagem
        conteudo = Image.new("RGBA", (pw, ph), (0, 0, 0, 0))
        for e in visiveis:
            y = area_topo + e["y"] - rolagem
            if e["dela"] and e["digitando"][0] <= t < e["inicio"]:
                pt = pontinhos(e["digitando"][0], t)
                a = ease_out(prog(t, e["digitando"][0], 0.2))
                colar_centro(conteudo, pt, tela_x0 + margem_x + pt.width / 2, y + pt.height / 2, 0.8 + 0.2 * a, a)
                continue
            p = prog(t, e["inicio"], 0.42)
            b = e["bolha"]
            esc = 0.4 + 0.6 * ease_out_back(p)
            if e["dela"]:
                bx = tela_x0 + margem_x + b.width / 2
            else:
                bx = pw - tela_x0 - margem_x - b.width / 2
            by = y + b.height / 2 + (1 - ease_out(p)) * 30
            colar_centro(conteudo, b, bx, by, esc, min(1, p * 2))
            if e["selo"] is not None:
                q = prog(t, e["inicio"] + 0.45, 0.35)
                if q > 0:
                    sx = bx - b.width / 2 - raio_selo - 14 if not e["dela"] else bx + b.width / 2 + raio_selo + 14
                    tremor = math.sin(q * 40) * 6 * (1 - q)
                    colar_centro(conteudo, e["selo"], sx + tremor, by, 2.2 - 1.2 * ease_out_back(q), min(1, q * 3))
        # Recorta o conteúdo no formato da tela do celular.
        mascara = Image.new("L", (pw, ph), 0)
        ImageDraw.Draw(mascara).rounded_rectangle(
            [tela_x0, tela_y0 + cab_h + int(cab_h * 0.14), pw - tela_x0, ph - tela_y0], radius=raio_cel - 10, fill=255)
        conteudo.putalpha(Image.composite(conteudo.getchannel("A"), Image.new("L", (pw, ph), 0), mascara))
        cel.alpha_composite(conteudo)

        entrada = ease_out_back(prog(t, 0.0, 0.6), 1.4)
        flutua_y = math.sin(t * 1.1) * 10
        ang = math.sin(t * 0.7) * 1.4 + (1 - entrada) * 6
        cel_rot = cel.rotate(ang, resample=Image.BILINEAR, expand=True)
        dy = (1 - entrada) * H * 0.25 + flutua_y
        colar_centro(img, sombra, cel_cx, cel_cy + dy + 30, 1, 0.8 * entrada)
        colar_centro(img, contorno, cel_cx, cel_cy + dy, 1, 0.6 * entrada)
        colar_centro(img, cel_rot, cel_cx, cel_cy + dy, 1, min(1, entrada * 1.5))
        if camada_titulo is not None:
            q = ease_out(prog(t, 0.15, 0.5))
            colar_centro(img, camada_titulo, tit_cx, tit_cy + (1 - q) * 40, 1, q)
        return palco.camera(img, t)

    return frame


# --------------------------------------------------------------------------
# Peças comuns: título de cena e card
# --------------------------------------------------------------------------

def _titulo_cena(titulo: str, W: int, H: int, cores: dict):
    """Título no topo com sublinhado que varre; devolve (camada, y_centro, fim_y)."""
    vertical = H > W
    tam = 64 if vertical else 66
    fnt = fonte(tam)
    largura = int(W * (0.86 if vertical else 0.8))
    linhas = [" ".join(l) for l in quebrar(titulo.split(), fnt, largura)]
    alt = int(tam * 1.22)
    camada = Image.new("RGBA", (W, alt * len(linhas) + 30), (0, 0, 0, 0))
    d = ImageDraw.Draw(camada)
    for k, l in enumerate(linhas):
        d.text(((W - fnt.getlength(l)) / 2, k * alt), l, font=fnt, fill=FG)
    y = H * (0.16 if vertical else 0.14)
    return camada, y + camada.height / 2, y + camada.height


def _card(texto: str, indice: int | None, largura: int, altura: int, tam: int, cores: dict,
          icone: str | None = None) -> Image.Image:
    img = Image.new("RGBA", (largura, altura), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    fundo = tuple(min(c + 26, 255) for c in cores["fundo"])
    d.rounded_rectangle([0, 0, largura - 1, altura - 1], radius=altura // 4, fill=(*fundo, 225),
                        outline=(255, 255, 255, 30), width=2)
    x = int(altura * 0.28)
    if indice is not None or icone:
        r = int(altura * 0.30)
        cx, cy = x + r, altura // 2
        if icone in ("boa", "ruim"):
            sel = _selo(icone, r)
            img.alpha_composite(sel, (cx - r, cy - r))
        else:
            d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(*cores["destaque"], 255))
            fn = fonte(int(r * 1.1))
            num = str(indice)
            d.text((cx - fn.getlength(num) / 2, cy - r * 0.62), num, font=fn, fill=FG)
        x = cx + r + int(altura * 0.28)
    fnt = fonte(tam)
    linhas = [" ".join(l) for l in quebrar(texto.split(), fnt, largura - x - int(altura * 0.25))]
    alt_l = int(tam * 1.2)
    y0 = (altura - alt_l * len(linhas)) / 2
    for k, l in enumerate(linhas):
        d.text((x, y0 + k * alt_l), l, font=fnt, fill=FG)
    return img


# --------------------------------------------------------------------------
# Tipo "lista": cards numerados em sequência
# --------------------------------------------------------------------------

def cena_lista(cena: dict, dur: float, cores: dict, W: int, H: int, palco: Palco):
    itens = [i for i in (cena.get("itens") or []) if i.strip()]
    if not itens:
        raise ValueError("cena 'lista' sem 'itens'")
    vertical = H > W
    titulo = (cena.get("texto_tela") or "").replace("*", "")
    camada_tit, tit_cy, tit_fim = _titulo_cena(titulo, W, H, cores) if titulo else (None, 0, H * 0.12)

    largura = int(W * (0.86 if vertical else 0.58))
    area = (H * (0.80 if vertical else 0.86)) - tit_fim - 30
    gap = int(H * 0.018)
    altura = int(min(H * (0.085 if vertical else 0.13), (area - gap * (len(itens) - 1)) / len(itens)))
    tam = max(int(altura * 0.42), 28)
    cards = [_card(t, k + 1, largura, altura, tam, cores) for k, t in enumerate(itens)]
    total = len(cards) * altura + (len(cards) - 1) * gap
    y0 = tit_fim + 30 + (area - total) / 2
    contorno = brilho(Image.new("RGBA", (largura, altura), (255, 255, 255, 255)), cores["destaque"], 16, 1.1)

    passo = min(0.9, dur * 0.6 / len(cards))
    inicios = [0.35 + k * passo for k in range(len(cards))]

    def frame(t: float) -> Image.Image:
        img = palco.base(t)
        if camada_tit is not None:
            q = ease_out(prog(t, 0.0, 0.45))
            colar_centro(img, camada_tit, W / 2, tit_cy + (1 - q) * 30, 1, q)
            larg_sub = int(W * 0.12 * ease_out(prog(t, 0.2, 0.5)))
            if larg_sub > 0:
                ImageDraw.Draw(img).rounded_rectangle(
                    [W / 2 - larg_sub / 2, tit_fim - 4, W / 2 + larg_sub / 2, tit_fim + 4],
                    radius=4, fill=(*cores["destaque"], 255))
        ultimo = max((k for k, i0 in enumerate(inicios) if t >= i0), default=-1)
        for k, (card, i0) in enumerate(zip(cards, inicios)):
            p = prog(t, i0, 0.5)
            if p <= 0:
                continue
            cy = y0 + k * (altura + gap) + altura / 2
            dx = (1 - ease_out_back(p, 1.4)) * W * 0.18
            if k == ultimo:  # o card que acabou de entrar pulsa
                pulso = 0.5 + 0.5 * math.sin((t - i0) * 5)
                colar_centro(img, contorno, W / 2 + dx, cy, 1, 0.35 + 0.35 * pulso * ease_out(p))
            colar_centro(img, card, W / 2 + dx, cy, 0.92 + 0.08 * ease_out(p), min(1, p * 2.2))
        return palco.camera(img, t)

    return frame


# --------------------------------------------------------------------------
# Tipo "comparacao": dois painéis + VS
# --------------------------------------------------------------------------

def _painel(coluna: dict, largura: int, cores: dict, vertical: bool) -> Image.Image:
    tom = coluna.get("tom")
    cor_tom = {"ruim": VERMELHO, "boa": VERDE}.get(tom, cores["destaque"])
    itens = coluna.get("itens") or []
    tam_cab = 60 if vertical else 56
    tam = 50 if vertical else 44
    alt_item = int(tam * 2.3)
    fnt_cab = fonte(tam_cab)
    cab_linhas = [" ".join(l) for l in quebrar((coluna.get("titulo") or "").split(), fnt_cab, largura - 80)]
    alt_cab = int(tam_cab * 1.25) * len(cab_linhas) + 50
    cards = [_card(i, None, largura - 40, alt_item, tam, cores, icone=tom if tom in ("boa", "ruim") else None)
             for i in itens]
    altura = alt_cab + sum(c.height + 14 for c in cards) + 30
    img = Image.new("RGBA", (largura, altura), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    fundo = tuple(min(c + 12, 255) for c in cores["fundo"])
    d.rounded_rectangle([0, 0, largura - 1, altura - 1], radius=36, fill=(*fundo, 215),
                        outline=(*cor_tom, 160), width=3)
    d.rounded_rectangle([0, 0, largura - 1, 14], radius=7, fill=(*cor_tom, 255))
    for k, l in enumerate(cab_linhas):
        d.text(((largura - fnt_cab.getlength(l)) / 2, 34 + k * int(tam_cab * 1.25)), l, font=fnt_cab, fill=FG)
    y = alt_cab
    for c in cards:
        img.alpha_composite(c, (20, y))
        y += c.height + 14
    return img


def cena_comparacao(cena: dict, dur: float, cores: dict, W: int, H: int, palco: Palco):
    colunas = cena.get("colunas") or []
    if len(colunas) != 2:
        raise ValueError("cena 'comparacao' precisa de exatamente 2 'colunas'")
    vertical = H > W
    titulo = (cena.get("texto_tela") or "").replace("*", "")
    camada_tit, tit_cy, tit_fim = _titulo_cena(titulo, W, H, cores) if titulo else (None, 0, H * 0.1)
    largura = int(W * (0.86 if vertical else 0.38))
    paineis = [_painel(c, largura, cores, vertical) for c in colunas]
    if vertical:
        area_topo = tit_fim + 40
        total = sum(p.height for p in paineis) + 120
        y1 = area_topo + max(0, (H * 0.86 - area_topo - total) / 2)
        pos = [(W / 2, y1 + paineis[0].height / 2),
               (W / 2, y1 + paineis[0].height + 120 + paineis[1].height / 2)]
        vs_pos = (W / 2, y1 + paineis[0].height + 60)
        origem = [(0, -H * 0.3), (0, H * 0.3)]
    else:
        cy = tit_fim + 40 + (H * 0.9 - tit_fim - 40) / 2
        pos = [(W * 0.28, cy), (W * 0.72, cy)]
        vs_pos = (W / 2, cy)
        origem = [(-W * 0.35, 0), (W * 0.35, 0)]
    r_vs = int(min(W, H) * 0.055)
    vs = Image.new("RGBA", (2 * r_vs, 2 * r_vs), (0, 0, 0, 0))
    dv = ImageDraw.Draw(vs)
    dv.ellipse([0, 0, 2 * r_vs - 1, 2 * r_vs - 1], fill=(*cores["destaque"], 255))
    fv = fonte(int(r_vs * 0.8))
    dv.text((r_vs - fv.getlength("VS") / 2, r_vs * 0.52), "VS", font=fv, fill=FG)
    halo_vs = brilho(vs, cores["destaque"], 26, 1.3)
    inicios = [0.3, 0.3 + min(1.4, dur * 0.35)]
    t_vs = inicios[1] + 0.35

    def frame(t: float) -> Image.Image:
        img = palco.base(t)
        if camada_tit is not None:
            q = ease_out(prog(t, 0.0, 0.45))
            colar_centro(img, camada_tit, W / 2, tit_cy + (1 - q) * 30, 1, q)
        for painel, (px, py), (ox, oy), i0 in zip(paineis, pos, origem, inicios):
            p = prog(t, i0, 0.6)
            if p <= 0:
                continue
            e = ease_out_back(p, 1.2)
            colar_centro(img, painel, px + ox * (1 - e), py + oy * (1 - e), 0.94 + 0.06 * e, min(1, p * 2))
        q = prog(t, t_vs, 0.45)
        if q > 0:
            esc = 2.4 - 1.4 * ease_out_back(q, 2.2)
            colar_centro(img, halo_vs, *vs_pos, esc * (1 + 0.05 * math.sin(t * 4)), 0.9)
            colar_centro(img, vs, *vs_pos, esc, min(1, q * 3))
        return palco.camera(img, t)

    return frame


# --------------------------------------------------------------------------
# Rótulo animado sobre cenas de imagem
# --------------------------------------------------------------------------

def render_rotulo(texto: str, dur: float, out_path: str, fps: int, cor_destaque: str,
                  W: int, H: int) -> None:
    """Letreiro com o conceito-chave da cena, num .mov com transparência
    (codec png) pra ser sobreposto ao movimento de câmera da imagem.
    Entra com barra na cor de destaque crescendo + texto revelado da esquerda
    pra direita; sai deslizando no fim da cena."""
    destaque = hex_para_rgb(cor_destaque)
    vertical = H > W
    tam = 46 if vertical else 44
    fnt = fonte(tam)
    rotulo = texto.upper()
    espac = 3
    larg_txt = int(sum(fnt.getlength(c) + espac for c in rotulo))
    pad_x, alt = 28, int(tam * 1.9)
    caixa_w = larg_txt + 2 * pad_x + 14
    caixa = Image.new("RGBA", (caixa_w, alt), (0, 0, 0, 0))
    d = ImageDraw.Draw(caixa)
    d.rounded_rectangle([0, 0, caixa_w - 1, alt - 1], radius=10, fill=(8, 10, 14, 200))
    d.rectangle([0, 0, 9, alt - 1], fill=(*destaque, 255))
    x = 14 + pad_x
    for c in rotulo:
        d.text((x, (alt - tam * 1.16) / 2), c, font=fnt, fill=FG)
        x += fnt.getlength(c) + espac
    halo = brilho(caixa.crop((0, 0, 10, alt)), destaque, 14, 1.2)
    x0 = int(W * (0.07 if vertical else 0.05))
    y0 = int(H * (0.12 if vertical else 0.08))

    total = max(int(round(dur * fps)), 1)
    proc = subprocess.Popen(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgba",
         "-s", f"{W}x{H}", "-r", str(fps), "-i", "-", "-c:v", "png", out_path],
        stdin=subprocess.PIPE, stderr=subprocess.PIPE,
    )
    vazio = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    vazio_bytes = vazio.tobytes()
    try:
        for n in range(total):
            t = n / fps
            entrada = prog(t, 0.35, 0.55)
            saida = prog(t, dur - 0.55, 0.4)
            if entrada <= 0 or saida >= 1:
                proc.stdin.write(vazio_bytes)
                continue
            img = vazio.copy()
            barra = ease_out(prog(t, 0.35, 0.25))
            revela = ease_out(prog(t, 0.5, 0.45))
            corte = int(14 + (caixa_w - 14) * revela)
            parte = caixa.crop((0, 0, max(corte, 10), alt))
            if barra < 1:  # barra cresce de cima pra baixo antes do texto
                parte = parte.crop((0, 0, 10, max(1, int(alt * barra))))
            dx = -saida * (caixa_w + x0) * ease_in_out(saida)
            colar_centro(img, halo, x0 + dx + 5, y0 + alt / 2, 1, 0.8 * (1 - saida))
            img.alpha_composite(com_alpha(parte, 1 - saida), (max(0, int(x0 + dx)), y0))
            proc.stdin.write(img.tobytes())
        proc.stdin.close()
    except BrokenPipeError:
        pass
    if proc.wait() != 0:
        raise RuntimeError(f"FFmpeg falhou no rótulo: {proc.stderr.read().decode()[-1500:]}")


# --------------------------------------------------------------------------
# Render
# --------------------------------------------------------------------------

CONSTRUTORES = {"texto": cena_texto, "numero": cena_numero, "chat": cena_chat,
                "lista": cena_lista, "comparacao": cena_comparacao}


def render_motion(cena: dict, dur: float, out_path: str, fps: int, cor_destaque: str,
                  W: int = 1920, H: int = 1080, cor_fundo: str = "#0C0C10",
                  imagem_fundo: str | None = None) -> None:
    """Gera um mp4 mudo de `dur` segundos para a cena de motion, em WxH
    (1920x1080 ou 1080x1920: o layout se adapta à orientação).
    `imagem_fundo`: imagem de uma cena vizinha, usada desfocada no fundo."""
    cores = {"destaque": hex_para_rgb(cor_destaque), "fundo": hex_para_rgb(cor_fundo)}
    palco = Palco(W, H, cores, dur, imagem_fundo, semente=hash(out_path) & 0xFFFF)
    frame = CONSTRUTORES[cena["tipo"]](cena, dur, cores, W, H, palco)
    total = max(int(round(dur * fps)), 1)
    proc = subprocess.Popen(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
         "-s", f"{W}x{H}", "-r", str(fps), "-i", "-",
         "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-pix_fmt", "yuv420p", out_path],
        stdin=subprocess.PIPE, stderr=subprocess.PIPE,
    )
    try:
        for n in range(total):
            proc.stdin.write(frame(n / fps).convert("RGB").tobytes())
        proc.stdin.close()
    except BrokenPipeError:
        pass
    if proc.wait() != 0:
        raise RuntimeError(f"FFmpeg falhou na cena de motion: {proc.stderr.read().decode()[-1500:]}")
