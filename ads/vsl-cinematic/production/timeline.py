# -*- coding: utf-8 -*-
"""Monta a timeline de cada variante (conceito x hook): tempos de fala, cenas,
legendas por bloco, cues de efeitos sonoros, seções da trilha e SRT.

Uso: python timeline.py  -> $BUILD/timeline/<C>_<H>.json e $OUT/<...>.srt
"""
import json, os, re
from content import CONCEPTS

HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.environ.get('BUILD', os.path.join(HERE, 'build'))
OUT = os.environ.get('OUT', os.path.join(HERE, '..', 'output'))
FIRST_LINE_AT = 0.12   # o hook fala já no primeiro frame útil
SCENE_LEAD = 0.12      # a imagem entra um pouco antes da fala
TIME_KEYS = {'at', 'until', 'tapAt', 'copyAt', 'popAt', 'sendAt', 'startAt', 'leftAt', 'strikeAt',
             'rightAt', 'whyAt', 'sweep'}


def voice_path(code, lid):
    clone = f'{BUILD}/voice_clone/{code}/{lid}.wav'
    return clone if os.path.exists(clone) else f'{BUILD}/voice/{code}/{lid}.wav'


def duration(path):
    import subprocess
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                                          '-of', 'csv=p=0', path]).decode())


def syllables(w):
    w = re.sub(r'[^a-záéíóúâêôãõàüç]', '', w.lower())
    return max(1, len(re.findall(r'[aeiouáéíóúâêôãõàü]+', w)))


def caption_blocks(cap, start, end, hold):
    """Divide a legenda em blocos curtos (até 3 palavras / ~17 caracteres) com
    tempo proporcional às sílabas, quebrando em pontuação."""
    toks = []
    hl = False
    for raw in cap.split():
        w = raw
        opens, closes = w.startswith('*'), w.endswith('*') or w.rstrip('.,?!…"').endswith('*')
        w = w.replace('*', '')
        toks.append({'w': w, 'hl': hl or opens})
        if opens:
            hl = True
        if closes and (hl or opens):
            hl = False
            toks[-1]['hl'] = True
    # 1) segmenta por pontuação; 2) divide cada segmento em blocos equilibrados (~18 caracteres)
    segs, cur, inq = [], [], False
    for t in toks:
        cur.append(t)
        inq ^= t['w'].count('"') % 2 == 1
        if not inq and re.search(r'[.,?!…:]["”]?$', t['w']):
            segs.append(cur)
            cur = []
    if cur:
        segs.append(cur)
    blocks = []
    for seg in segs:
        n = max(1, round(len(' '.join(x['w'] for x in seg)) / 18))
        n = min(n, len(seg))
        tot = len(' '.join(x['w'] for x in seg))
        target = tot / n
        chunk, acc = [], 0
        for i, t in enumerate(seg):
            chunk.append(t)
            acc += len(t['w']) + 1
            left_words = len(seg) - i - 1
            if acc >= target * 0.92 and left_words > 0 and len(blocks) < 999 and n > 1:
                blocks.append(chunk)
                chunk, acc = [], 0
                n -= 1
                rem = seg[i + 1:]
                target = len(' '.join(x['w'] for x in rem)) / max(1, n)
        if chunk:
            blocks.append(chunk)
    weights = []
    for b in blocks:
        wsum = sum(syllables(x['w']) for x in b)
        if re.search(r'[.,?!…:]["”]?$', b[-1]['w']):
            wsum += 1.2
        weights.append(wsum)
    total = sum(weights)
    out, t = [], start
    span = end - start
    for b, wgt in zip(blocks, weights):
        d = span * wgt / total
        html = ' '.join(f'<b>{x["w"]}</b>' if x['hl'] else x['w'] for x in b)
        out.append({'start': round(t, 3), 'end': round(t + d, 3), 'html': html,
                    'text': ' '.join(x['w'] for x in b)})
        t += d
    out[-1]['end'] = round(end + hold, 3)
    return out


def srt_time(t):
    ms = int(round(t * 1000))
    return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'


def build(c, hook):
    lines = [dict(l) for l in c['hooks'][hook]] + [dict(l) for l in c['body']]
    t = FIRST_LINE_AT
    for l in lines:
        l['wav'] = voice_path(c['code'], l['id'])
        l['dur'] = duration(l['wav'])
        l['start'] = round(t, 3)
        l['end'] = round(t + l['dur'], 3)
        t = l['end'] + l['pause']
    total = round(t, 3)
    by_id = {l['id']: l for l in lines}

    order = []
    for l in lines:
        if l['scene'] not in order:
            order.append(l['scene'])
    scenes = []
    for i, sid in enumerate(order):
        first = next(l for l in lines if l['scene'] == sid)
        st = 0.0 if i == 0 else max(0.0, first['start'] - SCENE_LEAD)
        scenes.append({'id': sid, 'start': round(st, 3)})
    for i, s in enumerate(scenes):
        s['end'] = scenes[i + 1]['start'] if i + 1 < len(scenes) else total

    def ref(v, sc_start):
        if isinstance(v, tuple) and v and isinstance(v[0], str) and v[0] in by_id:
            l = by_id[v[0]]
            if len(v) == 3 and v[1] == 'end':
                return round(l['end'] + v[2], 3)
            return round(l['start'] + (v[1] if len(v) > 1 else 0), 3)
        return v

    def resolve(o, sc_start, key=None):
        if isinstance(o, tuple):
            r = ref(o, sc_start)
            if r is not o:
                return r
            return [resolve(x, sc_start) for x in o]
        if isinstance(o, dict):
            return {k: resolve(v, sc_start, k) for k, v in o.items()}
        if isinstance(o, list):
            return [resolve(x, sc_start, key) for x in o]
        if key in TIME_KEYS and isinstance(o, (int, float)):
            return round(sc_start + o, 3)
        return o

    sfx = []
    out_scenes = []
    for s in scenes:
        spec = c['scenes'][s['id']]
        r = resolve({k: v for k, v in spec.items() if k != 'sfx'}, s['start'])
        r.update(s)
        out_scenes.append(r)
        for cue in spec.get('sfx', []):
            name, at = cue[0], cue[1]
            item = {'name': name, 't': ref(at, s['start'])}
            if len(cue) > 2:
                item['dur'] = cue[2]
            if len(cue) > 3:
                item['gap'] = cue[3]
            sfx.append(item)

    caps = []
    for i, l in enumerate(lines):
        hold = min(l['pause'], 0.35) if l['id'] != 'cta' else 0.6
        caps += caption_blocks(l['cap'], l['start'], l['end'], hold)
    for i in range(len(caps) - 1):
        caps[i]['end'] = min(caps[i]['end'], caps[i + 1]['start'])

    # seções musicais pelo "beat" das falas
    sections = []
    for l in lines:
        b = l.get('beat') or 'demo'
        if not sections or sections[-1]['beat'] != b:
            sections.append({'beat': b, 'start': 0.0 if not sections else round(l['start'] - 0.15, 3)})
    for i, s in enumerate(sections):
        s['end'] = sections[i + 1]['start'] if i + 1 < len(sections) else total

    return {
        'id': f'{c["code"]}_{hook}', 'code': c['code'], 'hook': hook, 'slug': c['slug'], 'title': c['title'],
        'duration': total,
        'lines': [{k: l[k] for k in ('id', 'say', 'cap', 'start', 'end', 'dur', 'wav', 'beat', 'scene', 'vsl')}
                  for l in lines],
        'scenes': out_scenes, 'captions': caps, 'sfx': sorted(sfx, key=lambda x: x['t']),
        'sections': sections,
    }


def write_srt(tl, path):
    """SRT por frase (até ~42 caracteres por linha) — para upload na plataforma."""
    items = []
    for l in tl['lines']:
        clean = re.sub(r'\*', '', l['cap'])
        words = clean.split()
        chunks, cur = [], ''
        for w in words:
            if len(cur) + len(w) + 1 > 42 and cur:
                chunks.append(cur)
                cur = w
            else:
                cur = (cur + ' ' + w).strip()
        if cur:
            chunks.append(cur)
        tot = sum(len(x) for x in chunks)
        t = l['start']
        for ch in chunks:
            d = (l['end'] - l['start']) * len(ch) / tot
            items.append((t, t + d, ch))
            t += d
    with open(path, 'w', encoding='utf-8') as f:
        for i, (a, b, txt) in enumerate(items, 1):
            f.write(f'{i}\n{srt_time(a)} --> {srt_time(b)}\n{txt}\n\n')


def main():
    os.makedirs(f'{BUILD}/timeline', exist_ok=True)
    os.makedirs(f'{OUT}/legendas', exist_ok=True)
    for c in CONCEPTS:
        for h in c['hooks']:
            tl = build(c, h)
            json.dump(tl, open(f'{BUILD}/timeline/{tl["id"]}.json', 'w'), ensure_ascii=False, indent=1)
            write_srt(tl, f'{OUT}/legendas/{tl["id"]}_{c["slug"]}.srt')
            print(tl['id'], tl['duration'], 's', len(tl['scenes']), 'cenas', len(tl['captions']), 'blocos')


if __name__ == '__main__':
    main()
