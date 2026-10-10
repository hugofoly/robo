# -*- coding: utf-8 -*-
"""Roteiros dos 4 conceitos x 2 hooks do Robô de Date.

Cada conceito tem:
  - hooks: {'A': [linhas], 'B': [linhas]}  -> só o hook muda entre versões
  - body:  [linhas]                        -> idêntico nas duas versões (teste limpo)
  - scenes: specs visuais consumidas por engine/engine.js

Linha:
  id     identificador (usado nas referências de tempo das cenas)
  say    texto enviado ao TTS (com grafia fonética quando necessário)
  cap    legenda exibida; *palavra* = destaque
  scene  id da cena que esta linha abre/continua
  speed  velocidade da fala (1.0 = padrão)
  pause  silêncio depois da linha (s)
  vsl    trecho da VSL que sustenta a mensagem (documentação)

Referências de tempo nas cenas: ('id_linha', offset_s) = offset após o início
da fala da linha; ('id_linha', 'end', offset_s) = offset após o fim da fala.

Conversas e interface são DEMONSTRAÇÕES ILUSTRATIVAS, não provas de resultado.
"""

# ---------------------------------------------------------------------------
# Personagens / conteúdo fictício reaproveitado
# ---------------------------------------------------------------------------
JULIA = {'name': 'Júlia', 'initial': 'J', 'hue': 330}
CAMILA = {'name': 'Camila', 'initial': 'C', 'hue': 280}
BIA = {'name': 'Bia', 'initial': 'B', 'hue': 15}
PEDRO = {'name': 'Pedro', 'initial': 'P', 'hue': 200, 'status': 'amigo'}

CTA_SAY_VEJA = 'Toque em... Saiba Mais. E veja como o Robô de Dêit funciona.'
CTA_SAY_ASSISTA = 'Toque em... Saiba Mais. E assista à explicação completa.'


def L(id, say, cap, scene, speed=1.0, pause=0.22, vsl=None, beat=None):
    return dict(id=id, say=say, cap=cap, scene=scene, speed=speed,
                pause=pause, vsl=vsl, beat=beat)


CTA_SCENE = {
    'type': 'cta',
    'title': 'Veja como funciona',
    'sub': 'Assista à explicação completa',
    'button': 'SAIBA MAIS',
}

# ---------------------------------------------------------------------------
# CONCEITO 1 — "Deu match. E agora?"  (travou na primeira mensagem)
# ---------------------------------------------------------------------------
C1 = {
    'code': 'C1',
    'slug': 'deu-match',
    'title': 'Deu match. E agora?',
    'hooks': {
        'A': [
            L('hA1', 'Deu métch!', 'Deu *match*.', 'hA_match', speed=1.0, pause=0.18,
              beat='hook', vsl='Referência de tom da marca ("Deu match. E agora?") + dor: travar na 1ª mensagem.'),
            L('hA2', 'E agora?', 'E *agora*?', 'hA_match', speed=0.95, pause=0.35, beat='hook'),
        ],
        'B': [
            L('hB1', 'Quantas vezes você já digitou: oi, tudo bem?... e apagou?',
              'Quantas vezes você já digitou *"oi, tudo bem?"*... e apagou?', 'hB_typing',
              speed=1.0, pause=0.35, beat='hook',
              vsl='Situação concreta do briefing (repetir "oi, tudo bem?").'),
        ],
    },
    'body': [
        L('b1', 'Você abre a conversa, pensa demais...', 'Você abre a conversa, *pensa demais*...',
          'b_empty', pause=0.15, beat='problem'),
        L('b2', 'e manda o mesmo oi, tudo bem, que ela já recebeu de todo mundo.',
          'e manda o mesmo *"oi, tudo bem?"* que ela já recebeu de todo mundo.', 'b_inbox',
          pause=0.3, beat='problem',
          vsl='VSL: "É por isso que ela visualiza e não responde. É por isso que a conversa morre."'),
        L('b3', 'A real é que a mensagem certa muda o jogo.', 'A real é que a *mensagem certa* muda o jogo.',
          'b_kinetic', speed=0.95, pause=0.3, beat='turn'),
        L('b4', 'No Robô de Dêit, você manda o print e pergunta: como eu começo essa conversa?',
          'No *Robô de Date*, você manda o print e pergunta: *como eu começo?*', 'b_robot',
          pause=0.2, beat='demo',
          vsl='VSL: "Você manda o print da conversa, e ele te entrega..." / "você também pode perguntar qualquer coisa se tiver em dúvida".'),
        L('b5', 'Ele lê o contexto, e sugere uma mensagem que tem a ver com ela.',
          'Ele lê o *contexto* e sugere uma mensagem que *tem a ver com ela*.', 'b_robot',
          pause=0.25, beat='demo',
          vsl='VSL: "Ele vai entender sua situação e te mostrar como agir."'),
        L('b6', 'Você copia, ajusta do seu jeito, e manda.', 'Você *copia*, ajusta do seu jeito e *manda*.',
          'b_paste', pause=0.3, beat='benefit',
          vsl='VSL: "Manda o print, copia e cola a mensagem. Simples assim."'),
        L('b7', 'Sem cantada pronta. Sem forçar a barra.', 'Sem cantada pronta. *Sem forçar a barra.*',
          'b_kinetic2', speed=0.97, pause=0.35, beat='benefit'),
        L('cta', CTA_SAY_VEJA, 'Toque em *Saiba mais* e veja como funciona.', 'cta',
          speed=1.0, pause=1.6, beat='cta',
          vsl='Destino real: página com VSL (pro.robodedate.com/lp).'),
    ],
    'scenes': {
        'hA_match': {
            'type': 'phone',
            'screen': {'kind': 'match', 'who': JULIA, 'popAt': -0.3},
            'cam': [
                {'at': 0.0, 's': 1.35, 'fy': 0.42, 'rx': 6, 'ry': -16, 'rz': -4, 'blur': 3},
                {'at': ('hA1', 0.0), 's': 1.05, 'fy': 0.5, 'rx': 4, 'ry': -10, 'rz': -2, 'blur': 0, 'ease': 'expoOut'},
                {'at': ('hA2', 0.0), 's': 1.12, 'fy': 0.3, 'rx': 0, 'ry': 0, 'rz': 0, 'ease': 'expoOut'},
            ],
            'headline': {'txt': 'DEU MATCH.<br><b>E AGORA?</b>', 'at': ('hA2', 0.0)},
            'capsOff': True,  # a manchete já é a legenda falada
            'sfx': [('impact', ('hA1', 0.0)), ('notif', ('hA1', 0.08)), ('whoosh', ('hA2', -0.05))],
        },
        'hB_typing': {
            'type': 'phone',
            'screen': {'kind': 'chat', 'who': JULIA, 'note': 'Vocês deram match há 2 dias',
                       'msgs': [],
                       'input': [
                           {'type': 'oi, tudo bem?', 'at': ('hB1', 0.1), 'dur': 1.1},
                           {'del': True, 'at': ('hB1', 1.9), 'dur': 0.7},
                           {'type': 'oi, tudo bem?', 'at': ('hB1', 2.9), 'dur': 0.8},
                           {'del': True, 'at': ('hB1', 'end', -0.4), 'dur': 0.5},
                       ]},
            'cam': [
                {'at': 0.0, 's': 2.25, 'fy': 0.86, 'x': 60, 'rx': 10, 'ry': -8, 'rz': -3},
                {'at': ('hB1', 'end', 0.2), 's': 2.0, 'fy': 0.86, 'x': 40, 'rx': 6, 'ry': -4, 'rz': -2},
            ],
            'sfx': [('typing', ('hB1', 0.1), 1.1), ('delete', ('hB1', 1.9), 0.7),
                    ('typing', ('hB1', 2.9), 0.8), ('delete', ('hB1', 'end', -0.4), 0.5)],
        },
        'b_empty': {
            'type': 'phone',
            'screen': {'kind': 'chat', 'who': JULIA, 'note': 'Vocês deram match há 2 dias', 'msgs': [],
                       'input': [{'type': 'oi', 'at': ('b1', 0.5), 'dur': 0.4},
                                 {'del': True, 'at': ('b1', 1.4), 'dur': 0.3},
                                 {'type': 'oi, tudo bem?', 'at': ('b1', 'end', -0.3), 'dur': 0.7}]},
            'cam': [
                {'at': 0.0, 's': 1.0, 'fy': 0.48, 'rx': 6, 'ry': 14, 'rz': 2},
                {'at': ('b1', 'end', 0.3), 's': 1.12, 'fy': 0.53, 'rx': 3, 'ry': 6, 'rz': 1},
            ],
            'sfx': [('typing', ('b1', 0.5), 0.4), ('delete', ('b1', 1.4), 0.3), ('typing', ('b1', 'end', -0.3), 0.7)],
        },
        'b_inbox': {
            'type': 'phone',
            'screen': {'kind': 'inbox', 'owner': 'Júlia',
                       'sendAt': ('b2', 0.15),
                       'rows': 9, 'preview': 'oi, tudo bem?', 'stagger': 0.13,
                       'startAt': ('b2', 1.4)},
            'cam': [
                {'at': 0.0, 's': 1.0, 'fy': 0.5, 'rx': 2, 'ry': -12, 'rz': -1},
                {'at': ('b2', 'end', 0.2), 's': 1.08, 'fy': 0.48, 'rx': 0, 'ry': -4, 'rz': 0},
            ],
            'sfx': [('send', ('b2', 0.15)), ('tick_run', ('b2', 1.4), 1.2)],
        },
        'b_kinetic': {
            'type': 'kinetic',
            'lines': [
                {'txt': 'A mensagem certa', 'at': ('b3', 0.55)},
                {'txt': '<em>muda o jogo.</em>', 'at': ('b3', 1.45)},
            ],
            'sfx': [('riser_short', ('b3', 0.0)), ('hit', ('b3', 1.45))],
        },
        'b_robot': {
            'type': 'phone',
            'screen': {'kind': 'robot', 'msgs': [
                {'from': 'me', 'kind': 'image', 'at': ('b4', 0.9),
                 'print': {'who': JULIA, 'lines': ['Júlia, 26', 'café ☕ · trilha ⛰️', 'playlist duvidosa 🎧']}},
                {'from': 'me', 'kind': 'text', 'at': ('b4', 'end', -1.2),
                 'text': 'como eu começo sem ser o "oi, tudo bem?" 😅'},
                {'from': 'bot', 'kind': 'thinking', 'at': ('b4', 'end', -0.3)},
                {'from': 'bot', 'kind': 'text', 'at': ('b5', 0.6),
                 'text': 'Ela fala de café e trilha no perfil. Puxa por aí, com leveza:'},
                {'from': 'bot', 'kind': 'suggestion', 'at': ('b5', 1.6), 'label': 'Sugestão',
                 'text': 'Pergunta séria antes de tudo: café antes da trilha ou depois? Isso diz muito sobre uma pessoa ☕',
                 'copyAt': ('b5', 'end', 0.05)},
            ]},
            'cam': [
                {'at': 0.0, 's': 0.98, 'fy': 0.48, 'rx': 4, 'ry': 12, 'rz': 1.5},
                {'at': ('b4', 'end', 0.0), 's': 1.05, 'fy': 0.51, 'rx': 2, 'ry': 4, 'rz': 0.5},
                {'at': ('b5', 1.5), 's': 1.42, 'fy': 0.68, 'rx': 0, 'ry': 0, 'rz': 0},
                {'at': ('b5', 'end', 0.2), 's': 1.48, 'fy': 0.69, 'rx': 0, 'ry': -2, 'rz': 0},
            ],
            'tag': 'Demonstração ilustrativa',
            'sfx': [('send', ('b4', 0.9)), ('send', ('b4', 'end', -1.2)), ('notif_soft', ('b5', 0.6)),
                    ('reveal', ('b5', 1.6)), ('click', ('b5', 'end', 0.05))],
        },
        'b_paste': {
            'type': 'phone',
            'screen': {'kind': 'chat', 'who': JULIA, 'note': 'Vocês deram match há 2 dias', 'msgs': [],
                       'input': [{'paste': 'Pergunta séria antes de tudo: café antes da trilha ou depois? Isso diz muito sobre uma pessoa ☕', 'at': ('b6', 0.35)},
                                 {'send': True, 'at': ('b6', 'end', -0.35)}]},
            'cam': [
                {'at': 0.0, 's': 1.3, 'fy': 0.73, 'rx': 4, 'ry': -8, 'rz': -1},
                {'at': ('b6', 'end', 0.3), 's': 1.12, 'fy': 0.6, 'rx': 2, 'ry': -3, 'rz': 0},
            ],
            'sfx': [('click', ('b6', 0.35)), ('send', ('b6', 'end', -0.35))],
        },
        'b_kinetic2': {
            'type': 'kinetic',
            'lines': [
                {'txt': 'Sem cantada pronta.', 'at': ('b7', 0.0)},
                {'txt': '<em>Sem forçar a barra.</em>', 'at': ('b7', 'end', -1.15)},
            ],
            'sfx': [('hit_soft', ('b7', 0.0)), ('hit_soft', ('b7', 'end', -1.15))],
        },
        'cta': dict(CTA_SCENE, sfx=[('cta_swell', ('cta', -0.2))]),
    },
}

# ---------------------------------------------------------------------------
# CONCEITO 2 — "A conversa esfriou"  (kkk / visualizou e não respondeu)
# ---------------------------------------------------------------------------
GOOD_CHAT = [
    {'from': 'her', 'text': 'pastel de feira é superestimado, pronto falei'},
    {'from': 'me', 'text': 'você acabou de perder 10 pontos comigo 😂'},
    {'from': 'her', 'text': 'kkkkk calma, eu nunca comi na verdade'},
    {'from': 'me', 'text': 'NUNCA?? isso explica muita coisa'},
    {'from': 'me', 'text': 'aliás você é muito linda sabia'},
]

C2 = {
    'code': 'C2',
    'slug': 'conversa-esfriou',
    'title': 'A conversa esfriou',
    'hooks': {
        'A': [
            L('hA1', 'A conversa tava boa...', 'A conversa tava *boa*...', 'hA_chat', speed=1.0, pause=0.25, beat='hook',
              vsl='VSL: "É por isso que quando você manda um elogio ou fica pagando pau [...] você recebe kkk."'),
            L('hA2', 'aí ela respondeu: cá cá cá.', 'aí ela respondeu: *kkk*', 'hA_chat', speed=0.95, pause=0.45, beat='hook'),
        ],
        'B': [
            L('hB1', 'Ela respondeu às nove. Já passou da meia-noite.', 'Ela respondeu às *21h*. Já passou da *meia-noite*.',
              'hB_seen', speed=1.0, pause=0.25, beat='hook',
              vsl='VSL: "É por isso que a conversa morre." + situação do briefing (recebeu resposta e não sabe continuar).'),
            L('hB2', 'E você ainda tá olhando pra tela.', 'E você ainda tá *olhando pra tela*.', 'hB_seen',
              speed=0.97, pause=0.4, beat='hook'),
        ],
    },
    'body': [
        L('b1', 'Puxa outro assunto? Manda meme? Deixa quieto?', 'Puxa outro assunto? *Manda meme?* Deixa quieto?',
          'b_options', speed=1.02, pause=0.25, beat='problem'),
        L('b2', 'Enquanto você pensa, a conversa vai esfriando.', 'Enquanto você pensa, a conversa *vai esfriando*.',
          'b_freeze', pause=0.3, beat='problem', vsl='VSL: "É por isso que a conversa morre."'),
        L('b3', 'Manda o print pro Robô de Dêit.', 'Manda o print pro *Robô de Date*.', 'b_robot',
          pause=0.15, beat='demo', vsl='VSL: "Você manda o print da conversa..."'),
        L('b4', 'Ele lê o contexto da conversa, e sugere como retomar. De um jeito leve... sem parecer desesperado.',
          'Ele lê o *contexto* e sugere como *retomar*. De um jeito leve, sem parecer desesperado.', 'b_robot',
          pause=0.25, beat='demo',
          vsl='VSL: "Mesmo que a conversa esteja morta" / "Você deixa de ser o fã desesperado."'),
        L('b5', 'Você copia, ajusta do seu jeito, e manda.', 'Você *copia*, ajusta do seu jeito e *manda*.', 'b_paste',
          pause=0.25, beat='benefit', vsl='VSL: "Manda o print, copia e cola a mensagem. Simples assim."'),
        L('b6', 'Vale print do WhatsApp... do Tinder... ou do Instagram.',
          'Vale print do *WhatsApp*, do *Tinder* ou do *Instagram*.', 'b_apps', pause=0.3, beat='benefit',
          vsl='VSL: "Pode mandar print de WhatsApp, Tinder, Instagram."'),
        L('cta', CTA_SAY_ASSISTA, 'Toque em *Saiba mais* e assista à explicação.', 'cta',
          pause=1.6, beat='cta', vsl='Destino real: página com VSL.'),
    ],
    'scenes': {
        'hA_chat': {
            'type': 'phone',
            'screen': {'kind': 'chat', 'who': CAMILA, 'online': True,
                       'msgs': [dict(m, at=(-5 if i < 2 else ('hA1', -0.6 + i * 0.3))) for i, m in enumerate(GOOD_CHAT)] + [
                           {'from': 'her', 'kind': 'typing', 'at': ('hA2', 0.0), 'until': ('hA2', 0.85)},
                           {'from': 'her', 'text': 'kkk', 'at': ('hA2', 0.9), 'big': True},
                       ]},
            'cam': [
                {'at': 0.0, 's': 1.02, 'fy': 0.49, 'rx': 4, 'ry': 12, 'rz': 1.5},
                {'at': ('hA2', 0.8), 's': 1.08, 'fy': 0.51, 'rx': 3, 'ry': 8, 'rz': 1},
                {'at': ('hA2', 0.95), 's': 1.9, 'fy': 0.8, 'x': 40, 'rx': 0, 'ry': 0, 'rz': 0, 'ease': 'expoOut'},
            ],
            'sfx': [('pop_run', ('hA1', 0.0), 3, 0.3), ('thud', ('hA2', 0.9))],
        },
        'hB_seen': {
            'type': 'phone',
            'screen': {'kind': 'chat', 'who': CAMILA, 'clock': {'from': '21:00', 'to': '00:14', 'at': ('hB1', 0.3), 'dur': 1.6},
                       'msgs': [dict(m, at=-5) for m in GOOD_CHAT] + [{'from': 'her', 'text': 'kkk', 'at': -5, 'time': '21:00'}]},
            'cam': [
                {'at': 0.0, 's': 1.0, 'fy': 0.5, 'rx': 4, 'ry': -12, 'rz': -1.5},
                {'at': ('hB2', 0.0), 's': 1.9, 'fy': 0.76, 'x': -60, 'rx': 2, 'ry': -2, 'rz': 0, 'ease': 'quintInOut'},
                {'at': ('hB2', 'end', 0.4), 's': 1.98, 'fy': 0.76, 'x': -60, 'rx': 1, 'ry': -1, 'rz': 0},
            ],
            'shake': True,
            'sfx': [('clock_tick', ('hB1', 0.3), 1.6), ('drone', ('hB2', 0.0), 2.0)],
        },
        'b_options': {
            'type': 'kinetic',
            'lines': [
                {'txt': 'Puxa outro assunto?', 'at': ('b1', 0.0), 'stack': True},
                {'txt': 'Manda meme?', 'at': ('b1', 1.25), 'stack': True},
                {'txt': '<em>Deixa quieto?</em>', 'at': ('b1', 'end', -0.9), 'stack': True},
            ],
            'sfx': [('tick', ('b1', 0.0)), ('tick', ('b1', 1.25)), ('tick', ('b1', 'end', -0.9))],
        },
        'b_freeze': {
            'type': 'phone',
            'screen': {'kind': 'chat', 'who': CAMILA,
                       'msgs': [dict(m, at=-5) for m in GOOD_CHAT] + [{'from': 'her', 'text': 'kkk', 'at': -5}],
                       'freeze': {'at': ('b2', 0.4), 'dur': 2.2}},
            'cam': [
                {'at': 0.0, 's': 1.1, 'fy': 0.54, 'rx': 3, 'ry': 10, 'rz': 1},
                {'at': ('b2', 'end', 0.3), 's': 0.96, 'fy': 0.49, 'rx': 6, 'ry': 16, 'rz': 2},
            ],
            'sfx': [('freeze', ('b2', 0.4), 2.2)],
        },
        'b_robot': {
            'type': 'phone',
            'screen': {'kind': 'robot', 'msgs': [
                {'from': 'me', 'kind': 'image', 'at': ('b3', 0.55),
                 'print': {'who': CAMILA, 'chat': ['NUNCA?? isso explica muita coisa', 'aliás você é muito linda sabia', '— kkk']}},
                {'from': 'bot', 'kind': 'thinking', 'at': ('b3', 'end', 0.0)},
                {'from': 'bot', 'kind': 'text', 'at': ('b4', 0.7),
                 'text': 'Vocês estavam bem no assunto do pastel. Volta pra ele com humor, sem cobrar resposta:'},
                {'from': 'bot', 'kind': 'suggestion', 'at': ('b4', 2.3), 'label': 'Sugestão',
                 'text': 'Ainda tô inconformado que você nunca comeu pastel de feira. Isso precisa ser resolvido 😅',
                 'copyAt': ('b4', 'end', 0.0)},
            ]},
            'cam': [
                {'at': 0.0, 's': 0.98, 'fy': 0.48, 'rx': 4, 'ry': -12, 'rz': -1.5},
                {'at': ('b4', 0.6), 's': 1.05, 'fy': 0.51, 'rx': 2, 'ry': -4, 'rz': 0},
                {'at': ('b4', 2.2), 's': 1.42, 'fy': 0.68, 'rx': 0, 'ry': 0, 'rz': 0},
                {'at': ('b4', 'end', 0.2), 's': 1.47, 'fy': 0.69, 'rx': 0, 'ry': 2, 'rz': 0},
            ],
            'tag': 'Demonstração ilustrativa',
            'sfx': [('shutter', ('b3', 0.3)), ('send', ('b3', 0.55)), ('notif_soft', ('b4', 0.7)),
                    ('reveal', ('b4', 2.3)), ('click', ('b4', 'end', 0.0))],
        },
        'b_paste': {
            'type': 'phone',
            'screen': {'kind': 'chat', 'who': CAMILA,
                       'msgs': [dict(m, at=-5) for m in GOOD_CHAT] + [{'from': 'her', 'text': 'kkk', 'at': -5}],
                       'thaw': True,
                       'input': [{'paste': 'Ainda tô inconformado que você nunca comeu pastel de feira. Isso precisa ser resolvido 😅', 'at': ('b5', 0.2)},
                                 {'send': True, 'at': ('b5', 'end', -0.3)}]},
            'cam': [
                {'at': 0.0, 's': 1.3, 'fy': 0.74, 'rx': 3, 'ry': 8, 'rz': 1},
                {'at': ('b5', 'end', 0.3), 's': 1.15, 'fy': 0.67, 'rx': 1, 'ry': 3, 'rz': 0},
            ],
            'sfx': [('click', ('b5', 0.2)), ('send', ('b5', 'end', -0.3))],
        },
        'b_apps': {
            'type': 'kinetic',
            'lines': [
                {'txt': 'Print do', 'at': ('b6', 0.0), 'small': True},
                {'txt': 'WhatsApp', 'at': ('b6', 0.5), 'chip': True},
                {'txt': 'Tinder', 'at': ('b6', 1.3), 'chip': True},
                {'txt': 'Instagram', 'at': ('b6', 2.05), 'chip': True},
            ],
            'sfx': [('tick', ('b6', 0.5)), ('tick', ('b6', 1.3)), ('tick', ('b6', 2.05))],
        },
        'cta': dict(CTA_SCENE, sfx=[('cta_swell', ('cta', -0.2))]),
    },
}

# ---------------------------------------------------------------------------
# CONCEITO 3 — "Manda o print"  (recebeu resposta e não sabe continuar)
# ---------------------------------------------------------------------------
BIA_Q = 'hahaha e você faz o quê da vida além de mandar áudio de 3 minutos?'
OPT1 = 'Trabalho com tecnologia. Os áudios de 3 minutos são hobby, tô tentando profissionalizar 😂'
OPT2 = 'Trabalho com tecnologia. E prometo: o próximo áudio tem no máximo 30 segundos. Você cronometra.'

C3 = {
    'code': 'C3',
    'slug': 'manda-o-print',
    'title': 'Manda o print',
    'hooks': {
        'A': [
            L('hA1', 'Manda o print.', 'Manda o *print*.', 'hA_print', speed=1.0, pause=0.3, beat='hook',
              vsl='VSL: "Manda o print, copia e cola a mensagem. Simples assim."'),
            L('hA2', 'Copia, e cola. Simples assim.', '*Copia* e *cola*. Simples assim.', 'hA_fast', speed=0.95,
              pause=0.35, beat='hook'),
        ],
        'B': [
            L('hB1', 'Todo mundo já mandou print pro amigo perguntando: e agora, respondo o quê?',
              'Todo mundo já mandou print pro amigo perguntando: *"e agora, respondo o quê?"*', 'hB_friend',
              speed=1.02, pause=0.3, beat='hook', vsl='Situação concreta do briefing ("Manda o print").'),
            L('hB2', 'E o amigo responde: sei lá, mano.', 'E o amigo responde: *"sei lá, mano"*.', 'hB_friend',
              speed=0.97, pause=0.4, beat='hook'),
        ],
    },
    'body': [
        L('b1', 'O Robô de Dêit é como um amigo que manja de conversa, na palma da sua mão.',
          'O *Robô de Date* é como um amigo que manja de conversa, *na palma da sua mão*.', 'b_reveal',
          pause=0.25, beat='turn', vsl='VSL: "Na palma da mão. Ilimitado."'),
        L('b2', 'Você manda o print, ele entende a situação, e te mostra o que responder.',
          'Você manda o print, ele *entende a situação* e te mostra *o que responder*.', 'b_robot',
          pause=0.25, beat='demo', vsl='VSL: "Ele vai entender sua situação e te mostrar como agir."'),
        L('b3', 'Se preferir, manda um áudio explicando.', 'Se preferir, manda um *áudio* explicando.', 'b_robot',
          pause=0.25, beat='demo', vsl='VSL: "E se quiser pode mandar áudio pra facilitar!"'),
        L('b4', 'Você escolhe, copia, e manda do seu jeito.', 'Você *escolhe*, copia e manda *do seu jeito*.',
          'b_paste', pause=0.3, beat='benefit', vsl='VSL: "copia e cola a mensagem".'),
        L('cta', CTA_SAY_VEJA, 'Toque em *Saiba mais* e veja como funciona.', 'cta', pause=1.6, beat='cta',
          vsl='Destino real: página com VSL.'),
    ],
    'scenes': {
        'hA_print': {
            'type': 'phone',
            'screen': {'kind': 'chat', 'who': BIA, 'online': True,
                       'msgs': [{'from': 'me', 'text': 'tá, mas e esse áudio de 3 min que eu te mandei? 😂', 'at': -5},
                                {'from': 'her', 'text': BIA_Q, 'at': -5}],
                       'shot': {'at': ('hA1', 0.35)}},
            'cam': [
                {'at': 0.0, 's': 1.6, 'fy': 0.69, 'rx': 6, 'ry': -14, 'rz': -3},
                {'at': ('hA1', 0.3), 's': 1.05, 'fy': 0.5, 'rx': 2, 'ry': -6, 'rz': -1, 'ease': 'expoOut'},
                {'at': ('hA1', 'end', 0.3), 's': 0.55, 'fy': 0.67, 'x': 380, 'rx': 0, 'ry': -20, 'rz': 6, 'ease': 'quintInOut'},
            ],
            'sfx': [('shutter', ('hA1', 0.35)), ('whoosh', ('hA1', 'end', 0.2))],
        },
        'hA_fast': {
            'type': 'phone',
            'screen': {'kind': 'robot', 'msgs': [
                {'from': 'me', 'kind': 'image', 'at': -5, 'print': {'who': BIA, 'chat': [BIA_Q]}},
                {'from': 'bot', 'kind': 'suggestion', 'at': ('hA2', 0.0), 'label': 'Sugestão',
                 'text': OPT1, 'copyAt': ('hA2', 0.25)},
            ], 'jumpTo': {'at': ('hA2', 0.65), 'chat': {'who': BIA, 'msgs': [
                {'from': 'her', 'text': BIA_Q, 'at': -5}],
                'input': [{'paste': OPT1, 'at': ('hA2', 0.75)}, {'send': True, 'at': ('hA2', 1.45)}]}}},
            'cam': [
                {'at': 0.0, 's': 1.35, 'fy': 0.67, 'rx': 0, 'ry': 6, 'rz': 1, 'ease': 'expoOut'},
                {'at': ('hA2', 0.6), 's': 1.25, 'fy': 0.71, 'rx': 0, 'ry': -6, 'rz': -1, 'ease': 'expoOut'},
                {'at': ('hA2', 'end', 0.3), 's': 1.1, 'fy': 0.61, 'rx': 2, 'ry': -8, 'rz': -1},
            ],
            'tag': 'Demonstração ilustrativa',
            'sfx': [('reveal', ('hA2', 0.0)), ('click', ('hA2', 0.25)), ('click', ('hA2', 0.75)), ('send', ('hA2', 1.45))],
        },
        'hB_friend': {
            'type': 'phone',
            'screen': {'kind': 'chat', 'who': PEDRO, 'friend': True, 'msgs': [
                {'from': 'me', 'kind': 'image', 'at': 0.0, 'print': {'who': BIA, 'chat': [BIA_Q]}},
                {'from': 'me', 'text': 'e agora, respondo o quê?? 😭', 'at': ('hB1', 'end', -1.4)},
                {'from': 'her', 'kind': 'typing', 'at': ('hB1', 'end', 0.0), 'until': ('hB2', 1.0)},
                {'from': 'her', 'text': 'sei lá mano kkkkk', 'at': ('hB2', 1.05)},
                {'from': 'her', 'text': 'manda um "e aí sumida"', 'at': ('hB2', 'end', 0.1)},
            ]},
            'cam': [
                {'at': 0.0, 's': 1.0, 'fy': 0.5, 'rx': 4, 'ry': 12, 'rz': 1.5},
                {'at': ('hB2', 0.9), 's': 1.12, 'fy': 0.54, 'rx': 2, 'ry': 6, 'rz': 1},
                {'at': ('hB2', 1.1), 's': 1.7, 'fy': 0.76, 'x': -120, 'rx': 0, 'ry': 0, 'rz': 0, 'ease': 'expoOut'},
            ],
            'sfx': [('send', ('hB1', 0.0)), ('send', ('hB1', 'end', -1.4)), ('pop', ('hB2', 1.05)), ('pop', ('hB2', 'end', 0.1))],
        },
        'b_reveal': {
            'type': 'phone',
            'screen': {'kind': 'robot', 'msgs': [
                {'from': 'bot', 'kind': 'text', 'at': ('b1', 0.6),
                 'text': 'E aí! Manda o print da conversa ou me conta a situação 👊'}]},
            'cam': [
                {'at': 0.0, 's': 0.86, 'fy': 0.42, 'rx': 14, 'ry': -22, 'rz': -5, 'blur': 2},
                {'at': ('b1', 'end', 0.2), 's': 1.02, 'fy': 0.5, 'rx': 4, 'ry': -6, 'rz': -1, 'blur': 0},
            ],
            'sweep': ('b1', 0.2),
            'sfx': [('swell', ('b1', 0.0)), ('notif_soft', ('b1', 0.6))],
        },
        'b_robot': {
            'type': 'phone',
            'screen': {'kind': 'robot', 'msgs': [
                {'from': 'bot', 'kind': 'text', 'at': -5, 'text': 'E aí! Manda o print da conversa ou me conta a situação 👊'},
                {'from': 'me', 'kind': 'image', 'at': ('b2', 0.5), 'print': {'who': BIA, 'chat': [BIA_Q]}},
                {'from': 'bot', 'kind': 'thinking', 'at': ('b2', 1.0)},
                {'from': 'bot', 'kind': 'text', 'at': ('b2', 2.2), 'text': 'Ela brincou com você. Devolve no mesmo tom:'},
                {'from': 'bot', 'kind': 'suggestion', 'at': ('b2', 'end', -1.5), 'label': 'Opção 1 · leve', 'text': OPT1},
                {'from': 'bot', 'kind': 'suggestion', 'at': ('b2', 'end', -0.6), 'label': 'Opção 2 · direto', 'text': OPT2},
                {'from': 'me', 'kind': 'audio', 'at': ('b3', 0.9), 'dur': '0:12'},
                {'from': 'bot', 'kind': 'thinking', 'at': ('b3', 'end', -0.4)},
            ]},
            'cam': [
                {'at': 0.0, 's': 1.0, 'fy': 0.5, 'rx': 3, 'ry': 10, 'rz': 1},
                {'at': ('b2', 'end', -1.6), 's': 1.32, 'fy': 0.67, 'rx': 0, 'ry': 2, 'rz': 0},
                {'at': ('b3', 0.7), 's': 1.55, 'fy': 0.78, 'rx': 0, 'ry': -2, 'rz': 0},
            ],
            'tag': 'Demonstração ilustrativa',
            'sfx': [('send', ('b2', 0.5)), ('notif_soft', ('b2', 2.2)), ('reveal', ('b2', 'end', -1.5)),
                    ('reveal', ('b2', 'end', -0.6)), ('send', ('b3', 0.9))],
        },
        'b_paste': {
            'type': 'phone',
            'screen': {'kind': 'chat', 'who': BIA, 'online': True,
                       'msgs': [{'from': 'me', 'text': 'tá, mas e esse áudio de 3 min que eu te mandei? 😂', 'at': -5},
                                {'from': 'her', 'text': BIA_Q, 'at': -5}],
                       'input': [{'paste': OPT2, 'at': ('b4', 0.6)}, {'send': True, 'at': ('b4', 'end', -0.3)}]},
            'cam': [
                {'at': 0.0, 's': 1.3, 'fy': 0.74, 'rx': 3, 'ry': -8, 'rz': -1},
                {'at': ('b4', 'end', 0.3), 's': 1.12, 'fy': 0.64, 'rx': 1, 'ry': -3, 'rz': 0},
            ],
            'sfx': [('click', ('b4', 0.6)), ('send', ('b4', 'end', -0.3))],
        },
        'cta': dict(CTA_SCENE, sfx=[('cta_swell', ('cta', -0.2))]),
    },
}

# ---------------------------------------------------------------------------
# CONCEITO 4 — "Entenda o porquê"  (não é muleta, é treino)
# ---------------------------------------------------------------------------
WHY = ('Ela fez uma pergunta com humor. Devolver no mesmo tom mostra que você entendeu a '
       'brincadeira, e ainda abre espaço pra ela falar de si.')

C4 = {
    'code': 'C4',
    'slug': 'entenda-o-porque',
    'title': 'Não é muleta. É treino.',
    'hooks': {
        'A': [
            L('hA1', 'Resposta pronta, todo mundo te dá.', 'Resposta pronta, *todo mundo* te dá.', 'hA_split',
              speed=1.0, pause=0.2, beat='hook',
              vsl='VSL 1.2: "O Robô de Date não é muleta. É treino. [...] Cada provocação, você entende o PORQUÊ."'),
            L('hA2', 'Difícil é entender por que ela faz sentido.', 'Difícil é entender *por que* ela faz sentido.',
              'hA_split', speed=0.97, pause=0.35, beat='hook'),
        ],
        'B': [
            L('hB1', 'E se cada conversa te ensinasse o que falar na próxima?',
              'E se cada conversa te *ensinasse* o que falar na próxima?', 'hB_learn', speed=0.98, pause=0.4,
              beat='hook', vsl='VSL: "transformei o robô [...] num PROFESSOR que também ensina".'),
        ],
    },
    'body': [
        L('b1', 'No Robô de Dêit, você manda o print e recebe a sugestão de mensagem.',
          'No *Robô de Date*, você manda o print e recebe a *sugestão de mensagem*.', 'b_robot', pause=0.2,
          beat='demo', vsl='VSL: "Você manda o print da conversa, e ele te entrega..."'),
        L('b2', 'Mas dá pra ir além: perguntar por que falar isso,', 'Mas dá pra ir além: perguntar *por que* falar isso,',
          'b_robot', pause=0.12, beat='demo',
          vsl='VSL: "você também pode perguntar [...] ou quiser entender melhor porque tem que falar isso."'),
        L('b3', 'pedir outra opção, ou mandar um áudio contando a situação.',
          'pedir *outra opção* ou mandar um *áudio* contando a situação.', 'b_robot', pause=0.3, beat='demo',
          vsl='VSL: "E se quiser pode mandar áudio pra facilitar!"'),
        L('b4', 'Não é uma muleta. É treino.', 'Não é uma muleta. *É treino.*', 'b_kinetic', speed=0.92, pause=0.3,
          beat='benefit', vsl='VSL 1.2: "O Robô de Date não é muleta. É treino."'),
        L('b5', 'A cada mensagem, você vai pegando o jeito.', 'A cada mensagem, você vai *pegando o jeito*.',
          'b_kinetic2', pause=0.3, beat='benefit', vsl='VSL 1.2: "Mas cada mensagem que ele manda, você APRENDE."'),
        L('cta', CTA_SAY_ASSISTA, 'Toque em *Saiba mais* e assista à explicação.', 'cta', pause=1.6, beat='cta',
          vsl='Destino real: página com VSL.'),
    ],
    'scenes': {
        'hA_split': {
            'type': 'split',
            'left': {'label': 'Resposta pronta', 'items': ['"Oi gata, tudo bem?"', '"Você caiu do céu?"', '"Bom dia princesa"']},
            'right': {'label': 'Com contexto', 'text': OPT1, 'why': 'Por quê: devolve a brincadeira no mesmo tom.'},
            'leftAt': -0.3, 'strikeAt': ('hA1', 'end', -0.3), 'rightAt': ('hA2', 0.3), 'whyAt': ('hA2', 'end', -0.9),
            'sfx': [('pop_run', ('hA1', 0.1), 3, 0.25), ('strike', ('hA1', 'end', -0.3)), ('reveal', ('hA2', 0.3))],
        },
        'hB_learn': {
            'type': 'phone',
            'screen': {'kind': 'robot', 'msgs': [
                {'from': 'bot', 'kind': 'why', 'at': 0.25, 'title': 'Por que essa mensagem?', 'text': WHY}]},
            'cam': [
                {'at': 0.0, 's': 1.75, 'fy': 0.66, 'rx': 6, 'ry': 12, 'rz': 2, 'blur': 2},
                {'at': ('hB1', 0.5), 's': 1.55, 'fy': 0.71, 'rx': 2, 'ry': 4, 'rz': 1, 'blur': 0, 'ease': 'expoOut'},
                {'at': ('hB1', 'end', 0.3), 's': 1.45, 'fy': 0.72, 'rx': 0, 'ry': 0, 'rz': 0},
            ],
            'headline': {'txt': 'E SE CADA CONVERSA<br><b>TE ENSINASSE?</b>', 'at': 0.0},
            'sfx': [('impact', ('hB1', -0.1)), ('reveal', ('hB1', 0.15))],
        },
        'b_robot': {
            'type': 'phone',
            'screen': {'kind': 'robot', 'msgs': [
                {'from': 'me', 'kind': 'image', 'at': ('b1', 0.9), 'print': {'who': BIA, 'chat': [BIA_Q]}},
                {'from': 'bot', 'kind': 'suggestion', 'at': ('b1', 'end', -0.6), 'label': 'Sugestão', 'text': OPT1},
                {'from': 'bot', 'kind': 'chips', 'at': ('b1', 'end', -0.2),
                 'chips': [{'text': 'Por que essa?', 'tapAt': ('b2', 1.2)}, {'text': 'Outra opção', 'tapAt': ('b3', 0.2)}]},
                {'from': 'bot', 'kind': 'why', 'at': ('b2', 1.6), 'title': 'Por que essa mensagem?', 'text': WHY},
                {'from': 'bot', 'kind': 'suggestion', 'at': ('b3', 0.7), 'label': 'Outra opção', 'text': OPT2},
                {'from': 'me', 'kind': 'audio', 'at': ('b3', 'end', -0.9), 'dur': '0:18'},
            ]},
            'cam': [
                {'at': 0.0, 's': 1.0, 'fy': 0.5, 'rx': 3, 'ry': -10, 'rz': -1},
                {'at': ('b1', 'end', -0.7), 's': 1.25, 'fy': 0.64, 'rx': 0, 'ry': -2, 'rz': 0},
                {'at': ('b2', 1.4), 's': 1.45, 'fy': 0.73, 'rx': 0, 'ry': 2, 'rz': 0},
                {'at': ('b3', 0.6), 's': 1.5, 'fy': 0.77, 'rx': 0, 'ry': -1, 'rz': 0},
            ],
            'tag': 'Demonstração ilustrativa',
            'sfx': [('send', ('b1', 0.9)), ('reveal', ('b1', 'end', -0.6)), ('click', ('b2', 1.2)),
                    ('reveal', ('b2', 1.6)), ('click', ('b3', 0.2)), ('reveal', ('b3', 0.7)), ('send', ('b3', 'end', -0.9))],
        },
        'b_kinetic': {
            'type': 'kinetic',
            'lines': [
                {'txt': 'Não é uma muleta.', 'at': ('b4', 0.0)},
                {'txt': '<em>É treino.</em>', 'at': ('b4', 'end', -0.75)},
            ],
            'sfx': [('hit_soft', ('b4', 0.0)), ('hit', ('b4', 'end', -0.75))],
        },
        'b_kinetic2': {
            'type': 'kinetic',
            'lines': [
                {'txt': 'A cada mensagem,', 'at': ('b5', 0.0)},
                {'txt': 'você vai <em>pegando o jeito.</em>', 'at': ('b5', 1.2)},
            ],
            'progress': True,
            'sfx': [('swell', ('b5', 0.0))],
        },
        'cta': dict(CTA_SCENE, sfx=[('cta_swell', ('cta', -0.2))]),
    },
}

CONCEPTS = [C1, C2, C3, C4]

# Hooks extras (não produzidos) — banco para próximos testes.
EXTRA_HOOKS = [
    ('Humor', 'Você levou 20 minutos pra escrever uma mensagem de três palavras. E ainda mandou "kkk".'),
    ('Curiosidade', 'Esse print aqui tem a resposta certa escondida. Olha o contexto.'),
    ('Contraste', '"Oi, tudo bem?" vs. uma pergunta que só funciona com ela.'),
    ('Pergunta provocativa', 'Você responde ela ou responde o que você acha que ela quer ouvir?'),
    ('Situação reconhecível', 'Ela mandou "e você?". Agora é com você.'),
    ('Demonstração imediata', 'Print entrando. Sugestão saindo. Três segundos de tela.'),
]
