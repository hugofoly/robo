# A Biologia da Conquista

Módulo do curso do Robô de Date: 5 aulas verticais (9:16) de ~5 min, geradas
com a skill `documentario-faceless`.

| Aula | Tema | Missão prática |
|---|---|---|
| 1 | Atração não é uma escolha | Reler as 3 últimas conversas e marcar onde tentou convencer |
| 2 | As 3 caixas do seu valor | Nota de 0 a 10 por caixa + 1 ação por caixa na semana |
| 3 | O ambiente decide o jogo | Ir 2x ao ambiente onde a sua caixa mais forte rende |
| 4 | Anatomia de uma abordagem | 3 aberturas diretas, de dia |
| 5 | Do papo ao encontro | Meta semanal de 5 aberturas, com registro |

Base de conteúdo: pasta do Drive com a aula "VSM – Tudo que você precisa
saber" e os swipes 01, 02 e 04. Ficaram de fora, de propósito: piadas sobre
"boa noite, Cinderela", abordar mulher comprometida, contato físico sem
leitura de sinais, acusação de uso de drogas e as afirmações sobre carreira e
fertilidade feminina. As afirmações de biologia aparecem como modelo da
psicologia evolutiva, sem estatística inventada.

Render (formato e cores da marca):
```bash
python3 scripts/documentario_faceless.py midia  --projeto <pasta>/aula-01 --formato vertical \
  --estilo-imagem "Cool dark color palette with subtle indigo-violet accent lighting, modern Brazilian urban setting"
python3 scripts/documentario_faceless.py render --projeto <pasta>/aula-01 --formato vertical \
  --cor-destaque "#4F4CFD" --cor-fundo "#0E1218" --nome-saida aula-01
```
