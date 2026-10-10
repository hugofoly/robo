# -*- coding: utf-8 -*-
"""Sound design e trilha 100% sintetizados (sem samples de terceiros -> sem
problema de licença) + mixagem com ducking da trilha sob a voz.

Uso: python sound.py [ID ...]  -> $BUILD/audio/<ID>_mix.wav  (48 kHz, -14 LUFS, -1 dBTP)
"""
import json, os, subprocess, sys, glob
import numpy as np
import soundfile as sf
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.environ.get('BUILD', os.path.join(HERE, 'build'))
SR = 48000
RNG = np.random.default_rng(7)


# ----------------------------------------------------------------- utilidades
def t_(d):
    return np.arange(int(d * SR)) / SR


def env_exp(d, tau):
    return np.exp(-t_(d) / tau)


def lp(x, fc, order=2):
    sos = signal.butter(order, min(fc, SR * 0.45), 'low', fs=SR, output='sos')
    return signal.sosfilt(sos, x)


def hp(x, fc, order=2):
    sos = signal.butter(order, fc, 'high', fs=SR, output='sos')
    return signal.sosfilt(sos, x)


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], 'band', fs=SR, output='sos')
    return signal.sosfilt(sos, x)


def noise(d):
    return RNG.standard_normal(int(d * SR))


def add(buf, i, x):
    if i >= len(buf) or i < 0:
        return
    m = min(len(x), len(buf) - i)
    buf[i:i + m] += x[:m]


def norm(x, peak=0.9):
    m = np.max(np.abs(x)) + 1e-9
    return x / m * peak


def fade(x, fi=0.005, fo=0.02):
    n_i, n_o = int(fi * SR), int(fo * SR)
    if n_i:
        x[:n_i] *= np.linspace(0, 1, n_i)
    if n_o:
        x[-n_o:] *= np.linspace(1, 0, n_o)
    return x


def sweep_sine(f0, f1, d, curve='exp'):
    t = t_(d)
    if curve == 'exp':
        f = f0 * (f1 / f0) ** (t / d)
    else:
        f = f0 + (f1 - f0) * t / d
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def reverb(x, decay=1.2, mix=0.25):
    """Reverb simples por convolução com ruído decaindo (sala escura/cinema)."""
    ir_len = int(decay * SR)
    ir = RNG.standard_normal(ir_len) * np.exp(-np.arange(ir_len) / (decay * SR / 6))
    ir = lp(ir, 6000)
    ir /= np.sqrt(np.sum(ir ** 2))
    wet = signal.fftconvolve(x, ir)[:len(x) + ir_len]
    out = np.zeros(len(wet))
    out[:len(x)] += x * (1 - mix)
    out += wet * mix
    return out


# --------------------------------------------------------------------- efeitos
def sfx_impact():
    d = 1.6
    sub = sweep_sine(70, 32, d) * env_exp(d, 0.45)
    body = lp(noise(d), 900) * env_exp(d, 0.08) * 0.8
    click = hp(noise(0.02), 2000) * 0.5
    x = sub + body
    x[:len(click)] += click
    return norm(reverb(x, 2.0, 0.3), 0.95)


def sfx_hit():
    d = 1.0
    x = sweep_sine(110, 45, d) * env_exp(d, 0.22) + lp(noise(d), 2500) * env_exp(d, 0.05) * 0.6
    return norm(reverb(x, 1.4, 0.3), 0.8)


def sfx_hit_soft():
    d = 0.8
    x = sweep_sine(90, 50, d) * env_exp(d, 0.18) + lp(noise(d), 1200) * env_exp(d, 0.04) * 0.4
    return norm(reverb(x, 1.0, 0.25), 0.55)


def tone(f, d, tau, harm=(1, 0.3, 0.1)):
    t = t_(d)
    x = sum(a * np.sin(2 * np.pi * f * (i + 1) * t) for i, a in enumerate(harm))
    return x * env_exp(d, tau)


def sfx_notif():
    a = tone(1318.5, 0.35, 0.09)            # E6
    b = tone(1975.5, 0.5, 0.12)             # B6
    x = np.zeros(int(0.65 * SR))
    x[:len(a)] += a
    o = int(0.09 * SR)
    x[o:o + len(b)] += b
    return norm(reverb(fade(x), 0.8, 0.2), 0.6)


def sfx_notif_soft():
    x = tone(1046.5, 0.5, 0.12, (1, 0.5, 0.15)) + tone(1567.98, 0.5, 0.1, (0.5,))
    return norm(reverb(fade(x), 0.7, 0.2), 0.4)


def sfx_whoosh(d=0.55):
    n = noise(d)
    t = t_(d)
    out = np.zeros_like(n)
    seg = 256
    for i in range(0, len(n), seg):
        c = 300 + 3200 * np.sin(np.pi * min(1, i / len(n))) ** 2
        out[i:i + seg] = n[i:i + seg]
    out = bp(out, 250, 4200)
    envl = np.sin(np.pi * t / d) ** 2
    return norm(out * envl, 0.5)


def click(level=1.0, f=3500):
    d = 0.012
    x = hp(noise(d), f) * env_exp(d, 0.002)
    x += tone(1800, d, 0.003, (0.4,))
    return x * level


def sfx_typing(dur=1.0, f=3500, rate=(0.07, 0.13)):
    x = np.zeros(int((dur + 0.1) * SR))
    t = 0.0
    while t < dur:
        c = click(RNG.uniform(0.5, 1.0), f * RNG.uniform(0.85, 1.15))
        i = int(t * SR)
        x[i:i + len(c)] += c
        t += RNG.uniform(*rate)
    return norm(reverb(x, 0.3, 0.1), 0.35)


def sfx_delete(dur=0.6):
    return sfx_typing(dur, 2600, (0.05, 0.07)) * 0.9


def sfx_send():
    d = 0.22
    x = sweep_sine(500, 1400, d) * np.sin(np.pi * t_(d) / d) ** 1.5 * 0.6
    x += bp(noise(d), 1500, 6000) * np.sin(np.pi * t_(d) / d) ** 2 * 0.2
    return norm(fade(x), 0.4)


def sfx_pop():
    d = 0.09
    x = sweep_sine(950, 380, d) * env_exp(d, 0.025)
    return norm(fade(x, 0.001, 0.01), 0.4)


def sfx_tick():
    d = 0.06
    x = tone(2400, d, 0.012, (1, 0.2)) + hp(noise(d), 4000) * env_exp(d, 0.004) * 0.4
    return norm(x, 0.35)


def sfx_thud():
    d = 0.7
    x = sweep_sine(120, 48, d) * env_exp(d, 0.15) + lp(noise(d), 400) * env_exp(d, 0.03)
    return norm(reverb(x, 0.9, 0.2), 0.8)


def sfx_riser(d=1.3):
    t = t_(d)
    x = bp(noise(d), 800, 9000) * (t / d) ** 2.2 * 0.5
    x += sweep_sine(200, 1200, d) * (t / d) ** 2 * 0.25
    return norm(fade(x, 0.05, 0.01), 0.45)


def sfx_reveal():
    d = 0.9
    t = t_(d)
    x = sum(np.sin(2 * np.pi * f * t + RNG.uniform(0, 6)) * env_exp(d, 0.25) * a
            for f, a in [(1760, .5), (2217.5, .35), (2637, .3), (3520, .15)])
    x *= np.minimum(1, t / 0.02)
    return norm(reverb(x, 1.2, 0.35), 0.28)


def sfx_click():
    x = click(1.0, 2500) + click(0.6, 5000)
    return norm(reverb(np.pad(x, (0, 2000)), 0.2, 0.1), 0.4)


def sfx_shutter():
    d = 0.3
    x = np.zeros(int(d * SR))
    for off, lvl in [(0.0, 1.0), (0.085, 0.8)]:
        c = hp(noise(0.03), 1500) * env_exp(0.03, 0.006) * lvl
        i = int(off * SR)
        x[i:i + len(c)] += c
    return norm(reverb(x, 0.4, 0.15), 0.6)


def sfx_clock_tick(dur=1.6):
    x = np.zeros(int((dur + 0.2) * SR))
    t, gap = 0.0, 0.22
    while t < dur:
        c = tone(3000, 0.04, 0.006, (1, 0.3))
        c[:960] += hp(noise(0.02), 3000) * env_exp(0.02, 0.003) * 0.5
        i = int(t * SR)
        x[i:i + len(c)] += c
        t += gap
        gap = max(0.05, gap * 0.86)
    return norm(x, 0.35)


def sfx_drone(dur=2.0):
    t = t_(dur)
    x = (np.sin(2 * np.pi * 55 * t) + 0.5 * np.sin(2 * np.pi * 55.6 * t) + 0.25 * np.sin(2 * np.pi * 82.4 * t))
    x = lp(x + 0.1 * lp(noise(dur), 300), 400) * np.minimum(1, t / 0.6) * np.minimum(1, (dur - t) / 0.5)
    return norm(x, 0.5)


def sfx_freeze(dur=2.2):
    t = t_(dur)
    sh = sum(np.sin(2 * np.pi * f * t) * a for f, a in [(3136, .3), (4186, .2), (5274, .12)])
    crack = np.zeros_like(t)
    for _ in range(30):
        i = RNG.integers(0, len(t) - 600)
        crack[i:i + 400] += hp(noise(400 / SR), 3000) * env_exp(400 / SR, 0.002) * RNG.uniform(0.2, 0.8)
    x = (sh * 0.4 + crack) * np.minimum(1, t / 0.5) * np.minimum(1, (dur - t) / 0.4)
    return norm(reverb(x, 1.5, 0.4), 0.32)


def sfx_swell(d=1.4):
    t = t_(d)
    x = bp(noise(d), 300, 7000) * (t / d) ** 2 * np.minimum(1, (d - t) / 0.08)
    x += lp(sweep_sine(110, 220, d), 800) * (t / d) ** 2 * 0.4
    return norm(x, 0.35)


def sfx_strike():
    d = 0.35
    t = t_(d)
    x = bp(noise(d), 1500, 7000) * np.sin(np.pi * t / d) * 0.6
    return norm(x, 0.35)


def sfx_cta_swell():
    d = 2.4
    t = t_(d)
    x = sfx_swell(1.0)
    chime = sum(np.sin(2 * np.pi * f * t) * env_exp(d, 0.7) * a for f, a in [(880, .4), (1318.5, .3), (1760, .2)])
    out = np.zeros(int(d * SR) + len(x))
    out[:len(x)] += x
    out[len(x) - 2000:len(x) - 2000 + len(chime)] += chime * 0.35
    return norm(reverb(out, 1.8, 0.35), 0.4)


SFX = {
    'impact': sfx_impact, 'hit': sfx_hit, 'hit_soft': sfx_hit_soft, 'notif': sfx_notif,
    'notif_soft': sfx_notif_soft, 'whoosh': sfx_whoosh, 'typing': sfx_typing, 'delete': sfx_delete,
    'send': sfx_send, 'pop': sfx_pop, 'tick': sfx_tick, 'thud': sfx_thud, 'riser_short': sfx_riser,
    'reveal': sfx_reveal, 'click': sfx_click, 'shutter': sfx_shutter, 'clock_tick': sfx_clock_tick,
    'drone': sfx_drone, 'freeze': sfx_freeze, 'swell': sfx_swell, 'strike': sfx_strike,
    'cta_swell': sfx_cta_swell,
}
SFX_GAIN = {'impact': 0.9, 'hit': 0.7, 'notif': 0.55, 'whoosh': 0.6, 'typing': 0.7, 'delete': 0.6,
            'thud': 0.8, 'reveal': 0.6, 'cta_swell': 0.7, 'drone': 0.6}


def render_sfx(cues, total):
    out = np.zeros(int((total + 3) * SR))
    for c in cues:
        name = c['name']
        if name == 'pop_run':
            items = [{'name': 'pop', 't': c['t'] + i * c.get('gap', 0.3)} for i in range(int(c.get('dur', 3)))]
        elif name == 'tick_run':
            n = 9
            items = [{'name': 'tick', 't': c['t'] + i * c.get('dur', 1.2) / n} for i in range(n)]
        else:
            items = [c]
        for it in items:
            fn = SFX[it['name']]
            x = fn(it['dur']) if 'dur' in it and it['name'] in ('typing', 'delete', 'clock_tick', 'drone', 'freeze') else fn()
            x = x * SFX_GAIN.get(it['name'], 0.6)
            i = max(0, int(it['t'] * SR))
            add(out, i, x)
    return out[:int(total * SR)]


# ----------------------------------------------------------------------- trilha
BPM = 96
BEAT = 60 / BPM
BAR = 4 * BEAT
A4 = 440.0


def midi(m):
    return A4 * 2 ** ((m - 69) / 12)


CHORDS = [  # Am – F – C – G   (i – VI – III – VII)
    [57, 60, 64, 69], [53, 57, 60, 65], [48, 55, 60, 64], [55, 59, 62, 67]]
ROOTS = [45, 41, 48, 43]
LEVEL = {  # intensidade por seção: pad cutoff, bateria, arpejo
    'hook':    dict(cut=500, kick=0, hat=0, arp=0, sub=1.0, pad=0.6),
    'problem': dict(cut=800, kick=0, hat=1, arp=0, sub=0.8, pad=0.7),
    'turn':    dict(cut=1400, kick=1, hat=1, arp=0, sub=0.9, pad=0.85),
    'demo':    dict(cut=2000, kick=1, hat=2, arp=1, sub=0.9, pad=0.8),
    'benefit': dict(cut=2600, kick=1, hat=2, arp=1, sub=1.0, pad=0.9),
    'cta':     dict(cut=3000, kick=1, hat=1, arp=1, sub=1.0, pad=1.0),
}


def saw(f, d, detune_cents=(0, -8, 8)):
    t = t_(d)
    x = 0
    for c in detune_cents:
        ff = f * 2 ** (c / 1200)
        ph = (ff * t + RNG.uniform()) % 1.0
        x = x + (2 * ph - 1)
    return x / len(detune_cents)


def section_at(sections, t):
    for s in sections:
        if s['start'] <= t < s['end']:
            return s['beat']
    return sections[-1]['beat']


def render_music(sections, total):
    n = int((total + 2) * SR)
    pad = np.zeros(n); bass = np.zeros(n); drums = np.zeros(n); arp = np.zeros(n)
    nbars = int(np.ceil(total / BAR)) + 1
    for b in range(nbars):
        t0 = b * BAR
        sec = section_at(sections, t0 + 0.01)
        lv = LEVEL.get(sec, LEVEL['demo'])
        ch = CHORDS[b % 4]
        # pad (ataque lento, cauda que cruza o compasso seguinte)
        d = BAR + 0.8
        tt = t_(d)
        envl = np.minimum(1, tt / 0.35) * np.minimum(1, (d - tt) / 0.8)
        x = sum(saw(midi(m), d) for m in ch) / len(ch)
        x = lp(x, lv['cut'], 2) * envl * lv['pad']
        i = int(t0 * SR)
        add(pad, i, x)
        # sub/baixo: pulsa em colcheias no hook/problema, sustenta depois
        root = midi(ROOTS[b % 4] - 12)
        steps = 8
        for k in range(steps):
            st = t0 + k * BAR / steps
            dd = BAR / steps
            tt = t_(dd)
            if sec in ('hook', 'problem'):
                e = np.exp(-tt / 0.12)
            else:
                e = np.minimum(1, tt / 0.01) * np.minimum(1, (dd - tt) / 0.02)
            y = (np.sin(2 * np.pi * root * tt) + 0.3 * np.sin(4 * np.pi * root * tt)) * e * lv['sub']
            j = int(st * SR)
            add(bass, j, y)
        # bateria
        for k in range(16):
            st = t0 + k * BAR / 16
            j = int(st * SR)
            if lv['kick'] and k % 4 == 0:
                kd = 0.4
                y = sweep_sine(150, 45, kd) * env_exp(kd, 0.12) * 0.9
                add(drums, j, y)
            if lv['hat'] == 1 and k % 2 == 1 or lv['hat'] == 2:
                hd = 0.05
                acc = 1.0 if k % 2 == 1 else 0.5
                y = hp(noise(hd), 7000) * env_exp(hd, 0.012) * 0.22 * acc
                add(drums, j, y)
            if lv['kick'] and k in (4, 12) and sec in ('demo', 'benefit', 'cta'):
                sd = 0.25
                y = (bp(noise(sd), 900, 5000) * env_exp(sd, 0.05) * 0.35 +
                     np.sin(2 * np.pi * 190 * t_(sd)) * env_exp(sd, 0.04) * 0.3)
                add(drums, j, y)
        # arpejo (pluck) em semicolcheias
        if lv['arp']:
            pattern = [0, 2, 1, 3, 2, 1, 3, 2]
            for k in range(16):
                m = ch[pattern[k % 8]] + 12
                st = t0 + k * BAR / 16
                pd = 0.35
                tt = t_(pd)
                y = (np.sin(2 * np.pi * midi(m) * tt) + 0.35 * np.sin(4 * np.pi * midi(m) * tt) +
                     0.15 * np.sin(6 * np.pi * midi(m) * tt)) * np.exp(-tt / 0.09) * (0.55 if k % 2 else 0.8)
                j = int(st * SR)
                add(arp, j, y)
    arp = reverb(lp(arp, 4000), 1.2, 0.35)[:n]
    pad = reverb(pad, 2.2, 0.3)[:n]
    mix = 0.55 * pad + 0.5 * lp(bass, 220) + 0.55 * drums + 0.22 * arp
    # final: sustenta e desvanece nos últimos 1.4 s
    tt = np.arange(n) / SR
    mix *= np.clip((total - tt) / 1.4, 0, 1)
    return norm(mix[:int(total * SR)], 0.8)


# ---------------------------------------------------------------------- mixagem
def load_voice(lines, total):
    out = np.zeros(int((total + 1) * SR))
    for l in lines:
        x, sr = sf.read(l['wav'], dtype='float64')
        if sr != SR:
            x = signal.resample_poly(x, SR, sr)
        i = int(l['start'] * SR)
        add(out, i, x)
    return out[:int(total * SR)]


def follower(x, att=0.02, rel=0.35):
    a = np.abs(x)
    win = int(0.03 * SR)
    a = np.sqrt(signal.fftconvolve(a ** 2, np.ones(win) / win, mode='same').clip(0))
    out = np.zeros_like(a)
    ca, cr = np.exp(-1 / (att * SR)), np.exp(-1 / (rel * SR))
    # passo vetorizado aproximado via filtros de 1 polo (subida rápida / descida lenta)
    up = signal.lfilter([1 - ca], [1, -ca], a)
    down = signal.lfilter([1 - cr], [1, -cr], a)
    return np.maximum(up, down)


def mix(tl):
    total = tl['duration']
    voice = load_voice(tl['lines'], total)
    vr = np.sqrt(np.mean(voice[np.abs(voice) > 0.01] ** 2)) + 1e-9
    voice *= 10 ** (-17 / 20) / vr                    # voz ~ -17 dBFS RMS
    music = render_music(tl['sections'], total)
    mr = np.sqrt(np.mean(music ** 2)) + 1e-9
    music *= 10 ** (-24 / 20) / mr                    # trilha ~ -24 dBFS RMS nos respiros
    env = follower(voice)
    duck = 1 - 0.68 * np.clip(env / (10 ** (-26 / 20)), 0, 1)   # ~ -10 dB sob a voz
    music *= duck
    sfx = render_sfx(tl['sfx'], total) * 10 ** (-7 / 20)
    sfx *= 1 - 0.3 * np.clip(env / (10 ** (-26 / 20)), 0, 1)
    out = voice + music + sfx
    return out, voice, music, sfx


def loudnorm(src, dst, I=-14, TP=-1.0):
    cmd = ['ffmpeg', '-hide_banner', '-y', '-i', src, '-af', f'loudnorm=I={I}:TP={TP}:LRA=11:print_format=json',
           '-f', 'null', '-']
    err = subprocess.run(cmd, capture_output=True, text=True).stderr
    js = json.loads(err[err.rindex('{'):err.rindex('}') + 1])
    af = (f'loudnorm=I={I}:TP={TP}:LRA=11:measured_I={js["input_i"]}:measured_TP={js["input_tp"]}:'
          f'measured_LRA={js["input_lra"]}:measured_thresh={js["input_thresh"]}:offset={js["target_offset"]}:linear=true,'
          'aresample=48000')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-af', af, '-ar', '48000', dst], check=True)


def main(ids):
    os.makedirs(f'{BUILD}/audio', exist_ok=True)
    files = sorted(glob.glob(f'{BUILD}/timeline/*.json'))
    for f in files:
        tl = json.load(open(f))
        if ids and tl['id'] not in ids:
            continue
        out, voice, music, sfx = mix(tl)
        raw = f'{BUILD}/audio/{tl["id"]}_raw.wav'
        sf.write(raw, (out / max(1.0, np.max(np.abs(out)) / 0.98)).astype('float32'), SR)
        # stems para o projeto editável
        for name, st in (('voz', voice), ('trilha', music), ('sfx', sfx)):
            sf.write(f'{BUILD}/audio/{tl["id"]}_stem_{name}.wav', st.astype('float32'), SR)
        loudnorm(raw, f'{BUILD}/audio/{tl["id"]}_mix.wav')
        os.remove(raw)
        print('mix', tl['id'], flush=True)


if __name__ == '__main__':
    main(sys.argv[1:])
