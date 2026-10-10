# -*- coding: utf-8 -*-
"""Gera docs/02_roteiros.md a partir das timelines reais (tempos medidos da narração)."""
import json, os, re, glob
from content import CONCEPTS, EXTRA_HOOKS

HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.environ.get('BUILD', os.path.join(HERE, 'build'))
DOCS = os.path.join(HERE, '..', 'docs')

SFX_PT = {'impact': 'impacto grave', 'notif': 'notificação', 'notif_soft': 'notificação suave', 'whoosh': 'whoosh',
          'typing': 'digitação', 'delete': 'apagando', 'send': 'envio', 'pop': 'balão', 'pop_run': 'balões em sequência',
          'tick': 'tick de UI', 'tick_run': 'ticks em cascata', 'thud': 'thud cômico', 'riser_short': 'riser',
          'hit': 'hit cinematográfico', 'hit_soft': 'hit suave', 'reveal': 'brilho de revelação', 'click': 'toque/copiar',
          'shutter': 'obturador (print)', 'clock_tick': 'relógio acelerando', 'drone': 'drone de tensão',
          'freeze': 'gelo/cristal', 'swell': 'swell', 'strike': 'risco', 'cta_swell': 'swell + chime do CTA'}
MUSIC_PT = {'hook': 'drone grave + sub pulsando (tensão)', 'problem': 'pad filtrado + hi-hat leve',
            'turn': 'abre filtro, entra bumbo', 'demo': 'groove completo, arpejo (clareza)',
            'benefit': 'groove cheio, brilho máximo', 'cta': 'acorde sustentado, chime, fade final'}

DESC = {
    'hA_match': ('Close no celular em 3/4, tela de match pulsando (avatares se encontram, faíscas).',
                 'Crash zoom-out revelando a tela → push-in rápido; manchete "DEU MATCH. E AGORA?" bate no topo.'),
    'hB_typing': ('Macro no campo de texto: "oi, tudo bem?" digitado e apagado duas vezes, cursor vermelho.',
                  'Câmera colada no input, leve deriva; cortes no ritmo da digitação.'),
    'b_empty': ('Conversa vazia com Júlia ("vocês deram match há 2 dias"); dedo digita e apaga.',
                'Push-in lento (dúvida).'),
    'b_inbox': ('Caixa de entrada dela: o seu "oi, tudo bem?" é soterrado por 9 iguais.',
                'Linhas entram em cascata empurrando a sua para baixo; deriva lateral.'),
    'b_kinetic': ('Tipografia cinética sobre fundo escuro com luz vermelha.', 'Texto entra com desfoque→foco; leve zoom contínuo.'),
    'b_kinetic2': ('Tipografia cinética, segunda linha em vermelho.', 'Entrada desfoque→foco.'),
    'b_robot': ('Tela do Robô de Date (ilustrativa): print enviado → "analisando o print" → sugestão em card vermelho.',
                'Deriva 3D → push-in no card de sugestão; toque em "Copiar" com ripple.'),
    'b_paste': ('De volta à conversa: mensagem colada no campo, destaque e envio.', 'Close no input → recua enquanto o balão sobe.'),
    'hA_chat': ('Conversa fluindo bem (balões entrando), até chegar o "kkk" gigante.', 'Deriva → crash zoom no "kkk" com thud.'),
    'hB_seen': ('Conversa parada no "kkk" das 21:00; relógio da barra de status corre até 00:14.',
                'Câmera na mão (tremor sutil) → push-in lento no último balão.'),
    'b_options': ('Três opções empilhadas em tipografia cinética; as anteriores escurecem.', 'Entradas secas no ritmo da fala.'),
    'b_freeze': ('A conversa "esfria": gelo cobre a tela, cores dessaturam e azulam.', 'Recuo lento, leve rotação (solidão).'),
    'b_apps': ('Chips de WhatsApp / Tinder / Instagram em texto (sem logos).', 'Pop dos chips no ritmo.'),
    'hA_print': ('Conversa com Bia: flash de captura de tela (print).', 'Crash zoom-out → celular voa para fora em miniatura.'),
    'hA_fast': ('Robô entrega sugestão → "Copiado ✓" → conversa desliza e a mensagem é colada e enviada.',
                'Cortes rápidos sincronizados com "Copia… cola…".'),
    'hB_friend': ('Chat com o amigo Pedro: print enviado, "digitando…" eterno, "sei lá mano kkkkk".',
                  'Deriva → crash zoom na resposta inútil.'),
    'b_reveal': ('Revelação do Robô de Date (cabeçalho com avatar, mensagem de boas-vindas).',
                 'Celular gira de 3/4 para frente, sai do desfoque; reflexo de luz cruza o vidro.'),
    'hA_split': ('Dois cards: "Resposta pronta" (cantadas genéricas riscadas) x "Com contexto" (sugestão + porquê).',
                 'Cards flutuando; risco vermelho; card da direita sobe com rebote.'),
    'hB_learn': ('Card "Por que essa mensagem?" no Robô; manchete no topo.', 'Desfoque→foco com push-in.'),
    'cta': ('End card: avatar do Robô, "Veja como funciona", botão SAIBA MAIS pulsando, "Toque no botão Saiba mais ↓", aviso de conteúdo ilustrativo.',
            'Elementos entram em cascata; brilho pulsante no botão; fade final.'),
}


def fmt(t):
    return f'{t:05.2f}'


def main():
    out = ['# Roteiros, narração e decupagem por cena', '',
           'Tempos medidos na narração-guia renderizada (30 fps). Conversas e interface são **demonstrações ilustrativas**.',
           'O corpo (após o hook) é idêntico entre as versões A e B de cada conceito, para isolar a variável do teste.', '']
    for c in CONCEPTS:
        out += [f'## {c["code"]} — {c["title"]}', '']
        for h in c['hooks']:
            tl = json.load(open(f'{BUILD}/timeline/{c["code"]}_{h}.json'))
            out += [f'### {tl["id"]} · hook {h} · {tl["duration"]:.1f}s', '']
            out += ['**Narração completa:** ' + ' '.join(re.sub(r'\*', '', l['cap']) for l in tl['lines']), '']
            out += ['| Tempo | Narração | Texto na tela | Imagem / enquadramento | Movimento / transição | Trilha · SFX | Base na VSL |',
                    '|---|---|---|---|---|---|---|']
            for s in tl['scenes']:
                ls = [l for l in tl['lines'] if l['scene'] == s['id']]
                narr = ' '.join(re.sub(r'\*', '', l['cap']) for l in ls)
                if s['type'] == 'kinetic':
                    screen = ' / '.join(re.sub('<[^>]+>', '', x['txt']) for x in s['lines'])
                elif s['type'] == 'cta':
                    screen = f'{s["title"]} · {s["sub"]} · botão {s["button"]} · "Toque no botão Saiba mais"'
                else:
                    screen = 'Legendas sincronizadas' + (f' + manchete "{re.sub("<[^>]+>", " ", s["headline"]["txt"])}"' if s.get('headline') else '')
                    if s.get('tag'):
                        screen += f' + selo "{s["tag"]}"'
                img, mov = DESC.get(s['id'], ('', ''))
                sfx = [SFX_PT.get(x['name'], x['name']) for x in tl['sfx'] if s['start'] <= x['t'] < s['end']]
                sec = next((x['beat'] for x in tl['sections'] if x['start'] <= s['start'] + 0.2 < x['end']), 'demo')
                vsl = ' '.join(l['vsl'] for l in ls if l.get('vsl'))
                out.append(f'| {fmt(s["start"])}–{fmt(s["end"])} | {narr} | {screen} | {img} | {mov} | '
                           f'{MUSIC_PT[sec]} · {", ".join(dict.fromkeys(sfx)) or "—"} | {vsl or "—"} |')
            cta = next(l for l in tl['lines'] if l['id'] == 'cta')
            out += ['', f'**CTA falado:** "{re.sub(r"\.\.\.", "", cta["say"]).replace("Dêit", "Date")}"  ',
                    '**CTA escrito:** "Veja como funciona · Assista à explicação completa · SAIBA MAIS → · Toque no botão Saiba mais ↓"', '']
    out += ['## Banco de hooks (14)', '', '| # | Abordagem | Hook | Status |', '|---|---|---|---|']
    n = 0
    kinds = {('C1', 'A'): 'Situação reconhecível', ('C1', 'B'): 'Pergunta provocativa', ('C2', 'A'): 'Humor / situação',
             ('C2', 'B'): 'Humor (tempo passando)', ('C3', 'A'): 'Demonstração imediata', ('C3', 'B'): 'Situação reconhecível + humor',
             ('C4', 'A'): 'Contraste', ('C4', 'B'): 'Curiosidade sustentada pelo produto'}
    for c in CONCEPTS:
        for h, ls in c['hooks'].items():
            n += 1
            out.append(f'| {n} | {kinds[(c["code"], h)]} | {" ".join(re.sub(r"\*", "", l["cap"]) for l in ls)} | Produzido ({c["code"]}_{h}) |')
    for k, txt in EXTRA_HOOKS:
        n += 1
        out.append(f'| {n} | {k} | {txt} | Banco (próximo teste) |')
    os.makedirs(DOCS, exist_ok=True)
    open(f'{DOCS}/02_roteiros.md', 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    print('ok', len(out), 'linhas')


if __name__ == '__main__':
    main()
