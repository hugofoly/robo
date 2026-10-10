# -*- coding: utf-8 -*-
"""Renderiza os vídeos: captura quadro a quadro o engine/engine.html (Chromium
headless via Playwright), codifica em H.264 e junta com a mixagem de áudio.

Uso:
  python render.py                 -> todos (vertical + feed)
  python render.py C1_A:vertical   -> um só
  python render.py --stills C1_A:vertical 0.5 3 12   -> PNGs para revisão
"""
import json, os, subprocess, sys, glob
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.environ.get('BUILD', os.path.join(HERE, 'build'))
OUT = os.environ.get('OUT', os.path.join(HERE, '..', 'output'))
CHROME = os.environ.get('CHROME', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
FPS = 30
SIZES = {'vertical': (1080, 1920), 'feed': (1080, 1350)}
LABEL = {'vertical': '9x16_1080x1920', 'feed': '4x5_1080x1350'}


def open_page(p, tl, fmt):
    w, h = SIZES[fmt]
    b = p.chromium.launch(executable_path=CHROME, args=['--disable-gpu-vsync', '--force-color-profile=srgb'])
    pg = b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=1)
    pg.goto('file://' + os.path.join(HERE, 'engine', 'engine.html'))
    pg.wait_for_function('typeof window.setup === "function"')
    pg.evaluate('([tl, f]) => setup(tl, f)', [tl, fmt])
    pg.evaluate('document.fonts.ready')
    return b, pg


def stills(spec, times):
    vid, fmt = spec.split(':')
    tl = json.load(open(f'{BUILD}/timeline/{vid}.json'))
    os.makedirs(f'{BUILD}/stills', exist_ok=True)
    with sync_playwright() as p:
        b, pg = open_page(p, tl, fmt)
        for t in times:
            pg.evaluate(f'render({float(t)})')
            path = f'{BUILD}/stills/{vid}_{fmt}_{float(t):06.2f}.png'
            pg.screenshot(path=path)
            print(path)
        b.close()


def render(vid, fmt):
    tl = json.load(open(f'{BUILD}/timeline/{vid}.json'))
    w, h = SIZES[fmt]
    n = int(round(tl['duration'] * FPS))
    os.makedirs(OUT, exist_ok=True)
    silent = f'{BUILD}/video/{vid}_{fmt}.mp4'
    os.makedirs(os.path.dirname(silent), exist_ok=True)
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'image2pipe', '-framerate', str(FPS), '-c:v', 'mjpeg',
                            '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-tune', 'film', '-pix_fmt', 'yuv420p',
                            '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
                            '-movflags', '+faststart', silent], stdin=subprocess.PIPE)
    with sync_playwright() as p:
        b, pg = open_page(p, tl, fmt)
        cdp = pg.context.new_cdp_session(pg)
        import base64
        for i in range(n):
            pg.evaluate(f'render({i / FPS})')
            shot = cdp.send('Page.captureScreenshot', {'format': 'jpeg', 'quality': 94, 'optimizeForSpeed': False})
            enc.stdin.write(base64.b64decode(shot['data']))
            if i % 150 == 0:
                print(f'{vid} {fmt} {i}/{n}', flush=True)
        b.close()
    enc.stdin.close()
    enc.wait()
    final = f'{OUT}/{LABEL[fmt]}/RoboDeDate_{vid}_{tl["slug"]}_{LABEL[fmt]}.mp4'
    os.makedirs(os.path.dirname(final), exist_ok=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', silent, '-i', f'{BUILD}/audio/{vid}_mix.wav',
                    '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
                    '-shortest', '-movflags', '+faststart', final], check=True)
    print('OK', final, flush=True)
    return final


def main(args):
    if args and args[0] == '--stills':
        return stills(args[1], args[2:])
    jobs = []
    if args:
        for a in args:
            v, f = a.split(':')
            jobs.append((v, f))
    else:
        for path in sorted(glob.glob(f'{BUILD}/timeline/*.json')):
            v = os.path.basename(path)[:-5]
            for f in SIZES:
                jobs.append((v, f))
    for v, f in jobs:
        render(v, f)


if __name__ == '__main__':
    main(sys.argv[1:])
