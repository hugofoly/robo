import type { AssistantTab, Goal } from '../lib/assistant'
import { card, type DemoScenario } from './types'

/** Cenários fictícios do Assistente: um por aba × objetivo, com cards, variantes e acompanhamento. */
export const DEMO_SCENARIOS: Record<AssistantTab, Record<Goal, DemoScenario>> = {
  reply: {
    continue: {
      summary: 'Marina contou que fez uma caneca torta na aula de cerâmica.',
      text: 'Marina: acabei de voltar da aula de cerâmica, minhas mãos tão destruídas kkk\nEu: kkkk e saiu alguma coisa?\nMarina: uma caneca meio torta, mas é minha',
      context: 'Match de 4 dias, a conversa está fluindo bem.',
      reading:
        'Ela está dividindo um hobby e brincou com o próprio resultado ("meio torta, mas é minha"). O papo está quente e aberto para curiosidade e humor.',
      cards: {
        light: card(
          'Caneca torta tem personalidade. Já tem nome ou ainda tá em fase de adaptação?',
          'Brincar com o que ela mesma achou engraçado, sem julgar o resultado.',
          'Se ela der um nome, entre na brincadeira e pergunte há quanto tempo ela faz aula.',
          [
            'Caneca torta tem personalidade. Já tem nome?',
            'kkkk caneca torta é a melhor caneca. Já deu nome pra ela?',
            'Caneca torta tem personalidade, igual à dona. Já tem nome?',
            'Que legal! Caneca torta tem seu charme. Já pensou num nome pra ela?',
            'Primeira peça sempre sai com personalidade. Vai usar pra café ou é peça de exposição?',
          ],
        ),
        confident: card(
          'Torta e com dona orgulhosa: já gostei da caneca. Quero ver uma foto dela, e depois você me conta o que te levou pra cerâmica.',
          'Valorizar o orgulho dela e pedir algo concreto, abrindo um tema mais pessoal.',
          'Quando ela mandar a foto, comente um detalhe específico da peça e siga para o motivo da cerâmica.',
          [
            'Torta e com dona orgulhosa: já gostei. Manda uma foto dela?',
            'Torta mas sua, é isso que importa haha. Me manda uma foto? E como você foi parar na cerâmica?',
            'Já gostei da caneca e mais ainda da dona orgulhosa. Manda foto das duas?',
            'Torta e cheia de orgulho, adorei. Se quiser, me manda uma foto dela!',
            'Caneca feita à mão vale mais que dez de loja. Qual vai ser a próxima peça?',
          ],
        ),
        bold: card(
          'Tô começando a achar que vou precisar de uma aula particular pra entender o charme dessa caneca torta.',
          'Criar tensão leve sugerindo um encontro de forma indireta.',
          'Se ela entrar no jogo, proponha algo concreto, como conhecer o ateliê ou tomar um café.',
          [
            'Acho que vou precisar de uma aula particular sobre essa caneca.',
            'Tô achando que vou precisar de uma aula particular pra entender o charme dessa caneca kkk',
            'Já aviso: quero uma aula particular. E um café nessa caneca torta, servido por você.',
            'Agora fiquei curioso pra ver essa caneca de perto, hein.',
            'Se a caneca torta é sua, aceito um café nela quando você quiser estrear.',
          ],
        ),
      },
      recommended: 'confident',
      reason: 'Valida o orgulho dela, pede algo concreto (a foto) e abre um tema mais pessoal sem pressionar.',
      followUps: {
        why: 'A recomendada (Confiante) responde ao orgulho dela ("mas é minha") e pede uma foto: um pedido concreto e fácil de atender, que mantém o papo vivo e abre espaço para falar do hobby.',
        next: 'Quando ela mandar a foto, comente algo específico da peça e pergunte o que a levou para a cerâmica. Depois de duas ou três trocas boas, sugira algo ligado ao tema, como um café.',
        herReply: {
          message: 'kkkk tá aqui, olha que obra-prima 😂 [foto]',
          reading: 'Ela atendeu ao pedido e continuou no tom de humor: bom sinal de interesse.',
          suggestion: 'Obra-prima mesmo, e com assinatura de artista. Agora me conta: o que te fez começar a cerâmica?',
        },
      },
    },
    flirt: {
      summary: 'Júlia se disse praiana raiz, mas confessou que não sabe nadar direito.',
      text: 'Júlia: vi aqui que você também curte praia\nEu: curto demais, e você?\nJúlia: sou praiana raiz, mas confesso que não sei nadar direito 🙈',
      context: 'Conversa leve há 2 dias.',
      reading:
        'Ela revelou algo levemente vulnerável e usou um emoji de vergonha. É um convite para brincar com cuidado: bom gancho para um flerte leve.',
      cards: {
        light: card(
          'Praiana raiz que não sabe nadar é meu tipo favorito de contradição 😄',
          'Mostrar que achou a confissão dela fofa, com humor e sem expor.',
          'Se ela rir, pergunte qual é a praia favorita dela para levar a conversa para planos.',
          [
            'Praiana raiz que não nada? Adorei a contradição 😄',
            'kkkk praiana raiz que não sabe nadar, adorei isso',
            'Praiana raiz que não sabe nadar: contraditória e charmosa, gostei 😄',
            'Haha, que contradição boa! Você fica mais na areia então?',
            'Então você é do time que vai pra praia pela vibe, não pelo mar. Respeito demais.',
          ],
        ),
        confident: card(
          'Relaxa, eu fico de salva-vidas. Só aviso que cobro em açaí.',
          'Colocar vocês dois na mesma cena, com humor e um flerte leve.',
          'Se ela topar a brincadeira do açaí, já dá para sugerir uma praia ou um açaí de verdade.',
          [
            'Relaxa, eu sou seu salva-vidas. Cobro em açaí.',
            'Relaxa, eu fico de salva-vidas haha. Mas cobro em açaí, aviso logo',
            'Pode deixar que eu fico de salva-vidas. Mas vou querer ficar de olho em você bem de perto.',
            'Relaxa, se precisar eu ajudo. Em troca, você escolhe o açaí.',
            'Perfeito: você cuida da playlist na areia e eu cuido de você no mar.',
          ],
        ),
        bold: card(
          'Então já temos plano: eu te ensino a nadar e você me ensina a ser praiano raiz. Fechado?',
          'Transformar a confissão em um plano a dois, com uma pergunta direta.',
          'Se ela disser "fechado", combine uma data; se desconversar, volte ao tom leve.',
          [
            'Plano: eu te ensino a nadar, você me ensina a ser praiano raiz. Fechado?',
            'Fechado então: eu te ensino a nadar e você me ensina a ser praiano raiz haha',
            'Proposta: aula de natação particular comigo, no próximo sábado. Você topa?',
            'Quem sabe um dia eu te ensino a nadar e você me mostra as melhores praias?',
            'Troca justa: você me leva na sua praia favorita e eu garanto que você volta sabendo boiar.',
          ],
        ),
      },
      recommended: 'confident',
      reason: 'Brinca com a vulnerabilidade sem expor ela e já coloca vocês dois na mesma cena, com humor.',
      followUps: {
        why: 'A recomendada (Confiante) usa a confissão dela como ponto de flerte sem deixá-la sem graça: você se coloca como "salva-vidas", o que cria uma cena a dois, e o açaí deixa a brincadeira leve.',
        next: 'Se ela entrar na brincadeira, pergunte qual é a praia favorita dela. Com a praia definida, você já tem um plano concreto para sugerir mais adiante.',
        herReply: {
          message: 'kkkkk fechado, mas o açaí é com granola, hein',
          reading: 'Ela aceitou a brincadeira e acrescentou um detalhe: sinal de que topa o tom de flerte.',
          suggestion: 'Com granola e leite ninho, sou profissional. Qual praia você recomenda pra estreia?',
        },
      },
    },
    reconnect: {
      summary: 'Beatriz prometeu contar como foi a apresentação e sumiu há 9 dias.',
      text: 'Eu: e aí, como foi a apresentação?\nBeatriz: foi bem!! depois te conto melhor\n[sem resposta há 9 dias]',
      context: 'Ela parou de responder depois disso. A gente conversou bem por uma semana.',
      reading:
        'A conversa parou numa promessa ("depois te conto"), não numa recusa. Retomar pelo gancho que ela deixou é mais natural do que cobrar o sumiço.',
      cards: {
        light: card(
          'Ainda tô esperando o making of da apresentação, hein 😄 Como foi?',
          'Retomar pelo assunto que ela deixou aberto, sem cobrar o sumiço.',
          'Se ela contar, aprofunde com uma pergunta sobre o que ela sentiu; se pedir desculpas, deixe pra lá com leveza.',
          [
            'E o making of da apresentação? 😄',
            'E aí, a apresentação foi bem mesmo? Fiquei curioso pra saber como foi',
            'Ainda tô esperando o making of da apresentação. Já virou série de tanto suspense 😄',
            'Oi, Beatriz! Lembrei de você. Como foi a apresentação no fim?',
            'Passando pra saber: a apresentação rendeu aplauso de pé ou só aplauso normal?',
          ],
        ),
        confident: card(
          'Beatriz, abriu uma vaga na minha agenda pra ouvir aquela história da apresentação. Ainda tá de pé?',
          'Retomar com segurança e humor, mostrando que você lembra da conversa.',
          'Se ela responder, ouça a história e, depois de algumas trocas, proponha que ela conte pessoalmente.',
          [
            'Abriu uma vaga na minha agenda pra ouvir a história da apresentação. Tá de pé?',
            'Beatriz, e aquela história da apresentação? Ainda quero ouvir',
            'Abriu uma vaga na minha agenda pra ouvir a história da apresentação. De preferência num café, ao vivo.',
            'Oi, Beatriz! Ainda quero ouvir a história da apresentação, se você quiser contar.',
            'Beatriz, tô cobrando o "depois te conto". Os juros já estão altos 😄',
          ],
        ),
        bold: card(
          'Vou considerar que a apresentação foi tão boa que você virou CEO e ficou sem tempo. Me conta da promoção 😏',
          'Brincar com o sumiço de forma exagerada, tirando o peso da situação.',
          'Se ela rir, mantenha o humor e volte ao assunto real da apresentação.',
          [
            'Sumiu porque virou CEO depois da apresentação? 😏',
            'Pelo sumiço, imagino que a apresentação foi tão boa que você virou CEO haha. Como foi?',
            'Imagino que virou CEO depois da apresentação. Só aceito um sumiço desses se tiver jantar de comemoração comigo.',
            'Pelo jeito a apresentação foi um sucesso e a vida ficou corrida! Como foi?',
            'Ou a apresentação foi um sucesso absurdo ou foi um desastre épico. Qual dos dois? 😄',
          ],
        ),
      },
      recommended: 'light',
      reason: 'Retoma pelo assunto que ela mesma deixou aberto, sem cobrança e com uma resposta fácil de dar.',
      followUps: {
        why: 'A recomendada (Leve) volta para a promessa que ela mesma fez ("depois te conto"). Assim você não precisa comentar o sumiço, e ela tem uma resposta fácil: contar como foi.',
        next: 'Se ela responder, mostre interesse genuíno na história com uma ou duas perguntas. Se ela pedir desculpas pela demora, diga que tudo bem e siga no assunto, sem voltar a falar do sumiço.',
        herReply: {
          message: 'aaaah desculpa o sumiço!! foi ótima, consegui o projeto 🎉',
          reading: 'Ela se desculpou e trouxe uma boa notícia: a conversa voltou com energia positiva.',
          suggestion: 'Imagina, o importante é que deu certo! Parabéns 🎉 Isso merece comemoração. Que projeto é?',
        },
      },
    },
    'ask-out': {
      summary: 'Carol indicou uma feira gastronômica com um pastel de costela "surreal".',
      text: 'Carol: esse fim de semana vai ter feira gastronômica no centro\nEu: sério? nunca fui\nCarol: é muito bom, tem um pastel de costela que é surreal',
      context: 'Conversamos há uma semana, sempre bem.',
      reading:
        'Ela trouxe um evento concreto e elogiou algo específico. Na prática é um convite indireto: o caminho está aberto para você propor.',
      cards: {
        light: card(
          'Agora fiquei curioso com esse pastel. Você me apresenta?',
          'Abrir a porta para o encontro de forma sutil, deixando ela conduzir.',
          'Se ela disser que sim, defina dia e horário na mensagem seguinte.',
          [
            'Fiquei curioso. Me apresenta esse pastel?',
            'Agora fiquei com vontade desse pastel haha, você me leva lá?',
            'Fiquei curioso com o pastel, mas mais ainda com a guia. Me apresenta?',
            'Que demais, agora fiquei curioso pra provar esse pastel!',
            'Pastel de costela surreal é argumento forte. Qual é a barraca?',
          ],
        ),
        confident: card(
          'Então tá decidido: sábado a gente vai nessa feira e você me prova que o pastel de costela é tudo isso. Que horário fica bom pra você?',
          'Transformar a dica dela em um plano com dia definido.',
          'Quando ela disser o horário, confirme o ponto de encontro e mantenha o papo leve até lá.',
          [
            'Sábado a gente vai nessa feira e você me prova esse pastel. Que horas?',
            'Então bora sábado? Você me mostra esse pastel de costela. Que horário fica bom?',
            'Sábado é nosso: feira, pastel de costela e você de guia. Me diz o horário que eu te encontro lá.',
            'Que tal a gente ir junto nessa feira no sábado? Se você puder, claro.',
            'Tá decidido: se o pastel for surreal mesmo, o próximo programa é por minha conta. Sábado, que horas?',
          ],
        ),
        bold: card(
          'Pastel surreal e guia local? Sábado eu tô lá. Só falta você confirmar que vem comigo.',
          'Convidar com convicção, como se o plano já estivesse feito.',
          'Se ela confirmar, combine horário e local; se hesitar, ofereça outro dia sem pressão.',
          [
            'Sábado eu tô lá. Só falta você vir comigo.',
            'Pastel surreal e guia local? Tô dentro haha. Bora sábado?',
            'Sábado eu tô lá. Pode me esperar na barraca do pastel, a primeira rodada é minha.',
            'Pastel surreal e guia local, difícil recusar. Topa ir comigo no sábado?',
            'Combinado: você escolhe o pastel, eu escolho a sobremesa. Sábado?',
          ],
        ),
      },
      recommended: 'confident',
      reason: 'Transforma a dica dela em plano com dia definido e termina perguntando o horário, o que facilita o sim.',
      followUps: {
        why: 'A recomendada (Confiante) pega a dica que ela mesma deu e transforma em plano: dia definido (sábado) e uma pergunta sobre horário. Isso facilita o sim, porque ela só precisa escolher a hora.',
        next: 'Quando ela disser o horário, confirme o lugar de encontro em uma mensagem curta. Até o dia, mantenha a conversa leve, sem excesso de mensagens.',
        herReply: {
          message: 'hahaha bora! umas 11h?',
          reading: 'Ela aceitou e já sugeriu horário: o encontro está praticamente marcado.',
          suggestion: 'Fechado, 11h. Te encontro na entrada da feira? Vou com fome, hein.',
        },
      },
    },
  },
  opener: {
    continue: {
      summary: 'Perfil da Luana: trilha no Pico da Bandeira, um golden e uma bio sobre domingo no mato.',
      text: "Perfil da Luana, 27 anos. Foto fazendo trilha no Pico da Bandeira e outra com um golden retriever. Bio: 'café forte, playlist boa e domingo no mato'.",
      context: 'Match novo, ninguém mandou mensagem ainda.',
      reading:
        'O perfil tem três ganchos claros: trilha, cachorro e a bio. Perguntas abertas sobre isso rendem mais do que um elogio à aparência.',
      cards: {
        light: card(
          'Pico da Bandeira com golden de assistente? Ele foi junto na trilha ou ficou de supervisor em casa?',
          'Abrir com uma pergunta divertida sobre algo que ela claramente gosta.',
          'Se ela responder sobre o cachorro, pergunte o nome dele e conte se você tem pet.',
          [
            'O golden foi junto na trilha ou ficou de supervisor?',
            'Seu golden foi junto no Pico da Bandeira ou ficou em casa? haha',
            'Pergunta importante antes de tudo: o golden aprova companhia nova nas trilhas?',
            'Que lindo seu golden! Ele vai nas trilhas com você?',
            'O que foi mais difícil: subir o Pico da Bandeira ou fazer o golden ficar parado pra foto?',
          ],
        ),
        confident: card(
          'Café forte, playlist boa e domingo no mato: você resumiu meu fim de semana ideal. Qual trilha vem depois do Pico da Bandeira?',
          'Criar afinidade a partir da bio e terminar numa pergunta fácil.',
          'Quando ela indicar a próxima trilha, compartilhe uma experiência sua parecida.',
          [
            'Café forte, playlist boa e domingo no mato: meu ideal. Qual a próxima trilha?',
            'Sua bio resumiu meu domingo ideal haha. Qual trilha vem depois do Pico da Bandeira?',
            'Café forte, playlist boa e domingo no mato: só falta companhia pra próxima trilha. Qual vai ser?',
            'Gostei muito da sua bio! Qual trilha você recomenda depois do Pico da Bandeira?',
            'Concordo com tudo na sua bio. Só me diz: café coado ou espresso antes da trilha?',
          ],
        ),
        bold: card(
          'Vou ser sincero: dei match pelo golden, mas fiquei pela bio. Qual música não pode faltar no domingo no mato?',
          'Ser direto com humor e mostrar que leu o perfil inteiro.',
          'Quando ela disser a música, comente com opinião própria em vez de só elogiar.',
          [
            'Dei match pelo golden, fiquei pela bio. Qual a música do domingo?',
            'Confesso que dei match pelo golden haha, mas a bio me ganhou. Qual música não pode faltar no domingo?',
            'Dei match pelo golden, fiquei pela bio e agora quero a playlist. Me manda sua música favorita?',
            'Seu golden chamou atenção, mas a bio também. Qual música não pode faltar no domingo?',
            'Sendo honesto: o golden fez metade do trabalho. Agora me conta, quem é mais aventureiro, você ou ele?',
          ],
        ),
      },
      recommended: 'confident',
      reason: 'Cria afinidade a partir da bio e termina numa pergunta fácil sobre algo que ela claramente gosta.',
      followUps: {
        why: 'A recomendada (Confiante) mostra que você leu a bio e se identificou, sem elogiar aparência. A pergunta sobre a próxima trilha é fácil de responder e puxa um assunto de que ela gosta.',
        next: 'Quando ela responder, compartilhe algo seu relacionado, como uma trilha que fez ou quer fazer. Isso transforma pergunta e resposta em conversa de verdade.',
        herReply: {
          message: 'quero fazer a Serra Fina esse ano! você faz trilha?',
          reading: 'Ela respondeu com um plano e devolveu a pergunta: sinal claro de interesse em continuar.',
          suggestion: 'Serra Fina é nível hard, respeito! Faço sim, a última foi a Pedra do Baú. Você vai com grupo ou sozinha?',
        },
      },
    },
    flirt: {
      summary: 'Perfil da Fernanda: show de rock, bar com amigas e uma bio sobre karaokê.',
      text: "Perfil da Fernanda, 29 anos. Foto num show de rock e outra rindo num bar com as amigas. Bio: 'procuro alguém que aguente meu karaokê'.",
      context: 'Match de hoje.',
      reading:
        'A bio já é um convite brincalhão. Entrar no jogo do karaokê, no mesmo tom, mostra humor e cria uma tensão leve.',
      cards: {
        light: card(
          'Aguento seu karaokê tranquilo. A pergunta é: você aguenta o meu?',
          'Entrar no jogo da bio virando o desafio para ela.',
          'Se ela responder no mesmo tom, pergunte qual é a música dela no karaokê.',
          [
            'Aguento seu karaokê. Mas você aguenta o meu?',
            'Seu karaokê eu aguento tranquilo haha, o problema é o meu',
            'Aguento seu karaokê sem problema. Difícil vai ser você resistir ao meu.',
            'Haha, adorei a bio! Qual é a sua música no karaokê?',
            'Seu karaokê é nível show ou nível chuveiro?',
          ],
        ),
        confident: card(
          'Topo o desafio do karaokê, mas só se você escolher a primeira música. Quero ver se é rock mesmo ou se tem um sertanejo escondido.',
          'Aceitar o desafio e criar um cenário a dois com provocação leve.',
          'Quando ela disser a música, comente com opinião e sugira um dueto.',
          [
            'Topo o desafio, mas você escolhe a primeira música. Rock mesmo?',
            'Topo o desafio do karaokê haha, mas a primeira música é sua. Rock ou sertanejo escondido?',
            'Topo o desafio, mas a primeira música é sua. E se for sertanejo, eu canto junto olhando pra você.',
            'Topo o desafio! Qual seria a primeira música?',
            'Desafio aceito. Só preciso saber: no karaokê você é do tipo que canta ou do tipo que dança?',
          ],
        ),
        bold: card(
          'Já aviso: no dueto eu sou ótimo. Tô até ensaiando o olhar de clipe pra você.',
          'Flertar de forma explícita, com humor exagerado.',
          'Se ela rir, proponha a música do dueto; se ela esfriar, volte para o tom leve.',
          [
            'No dueto eu sou ótimo. Já tô ensaiando o olhar de clipe.',
            'Já aviso que no dueto eu mando bem haha, até o olhar de clipe tá ensaiado',
            'No dueto eu sou ótimo. Olhar de clipe ensaiado, só falta você no microfone ao lado.',
            'No dueto eu me garanto! Topa um dia?',
            'Se for pra aguentar seu karaokê, quero a vaga fixa de backing vocal.',
          ],
        ),
      },
      recommended: 'confident',
      reason: 'Aceita o jogo da bio, cria um cenário a dois e fecha com uma provocação leve que pede resposta.',
      followUps: {
        why: 'A recomendada (Confiante) responde à bio no mesmo tom brincalhão e cria um cenário de vocês dois no karaokê. A provocação sobre o "sertanejo escondido" pede uma resposta divertida.',
        next: 'Quando ela disser a música, dê sua opinião com humor e sugira um dueto. Se o papo render, o karaokê vira um convite natural para sair.',
        herReply: {
          message: 'rock sempre! mas confesso que um Jorge e Mateus sai às vezes 🙈',
          reading: 'Ela entrou na brincadeira e se expôs um pouco: o tom de flerte está funcionando.',
          suggestion: 'Eu sabia! Então nosso dueto já tem música. Eu faço a segunda voz, você escolhe qual.',
        },
      },
    },
    reconnect: {
      summary: 'Match parado há 3 semanas com a Paula, designer que vive planejando viagens.',
      text: "Match com a Paula de umas 3 semanas atrás, ninguém puxou assunto. Perfil: designer, foto em Lisboa. Bio: 'sempre planejando a próxima viagem'.",
      context: 'Esqueci de mandar mensagem na época.',
      reading:
        'Match parado sem conversa não é rejeição, só ninguém começou. Assumir com leveza e ir direto a um gancho do perfil funciona melhor do que se desculpar demais.',
      cards: {
        light: card(
          'Demorei 3 semanas pra mandar mensagem, mas em minha defesa eu tava escolhendo a melhor pergunta: qual foi a melhor viagem até agora?',
          'Assumir a demora com humor e ir direto para uma pergunta.',
          'Quando ela disser a viagem, pergunte do que ela mais gostou lá.',
          [
            'Demorei 3 semanas, mas trouxe uma boa pergunta: qual foi sua melhor viagem?',
            'Demorei pra mandar mensagem haha, mas me conta: qual foi a melhor viagem até agora?',
            'Demorei 3 semanas porque tava escolhendo a pergunta perfeita: qual seria a viagem ideal pra fazer a dois?',
            'Oi, Paula! Vi que você ama viajar. Qual foi a melhor viagem até agora?',
            'Antes tarde do que nunca: Lisboa ou outro destino no topo da sua lista?',
          ],
        ),
        confident: card(
          'Paula, a gente deu match e ninguém falou nada. Vou corrigir isso: Lisboa foi a melhor viagem ou só a mais fotogênica?',
          'Reconhecer o match parado sem pedir desculpas e ir direto ao perfil.',
          'Se ela responder, conte um destino seu e pergunte qual é o próximo dela.',
          [
            'Paula, vou corrigir esse match parado: Lisboa foi a melhor viagem?',
            'Paula, a gente deu match e ninguém falou nada haha. Lisboa foi a melhor viagem ou só a mais fotogênica?',
            'Paula, match parado é desperdício. Lisboa foi a melhor viagem ou eu ainda tenho chance de te mostrar um lugar melhor?',
            'Oi, Paula! A gente deu match e ainda não conversou. Como foi Lisboa?',
            'Paula, ninguém puxou assunto, então vou eu: designer em Lisboa parece filme. Foi trabalho ou férias?',
          ],
        ),
        bold: card(
          'Esse match ficou parado tempo demais pra quem vive planejando a próxima viagem. Qual é o próximo destino? Talvez eu tenha sugestões.',
          'Provocar com o próprio perfil dela e se oferecer para ajudar no plano.',
          'Se ela disser o destino, dê uma sugestão real sobre o lugar.',
          [
            'Match parado pra quem vive planejando viagem? Qual o próximo destino?',
            'Esse match ficou parado demais pra quem vive planejando viagem haha. Qual o próximo destino?',
            'Match parado demais pra quem vive planejando viagem. Qual o próximo destino? Posso ir de sugestão ou de companhia.',
            'Vi que você vive planejando viagens! Qual é o próximo destino?',
            'Se você sempre planeja a próxima viagem, já deve ter uma lista. Qual é o top 1 agora?',
          ],
        ),
      },
      recommended: 'confident',
      reason: 'Reconhece o tempo parado sem pedir desculpas e já entrega uma pergunta específica sobre o perfil.',
      followUps: {
        why: 'A recomendada (Confiante) reconhece que o match ficou parado, sem se desculpar demais, e já entrega uma pergunta específica sobre Lisboa. Isso mostra iniciativa e interesse no perfil dela.',
        next: 'Se ela responder, conte uma viagem sua e pergunte qual é o próximo destino dela. Viagem é um tema que rende e pode virar convite para um café mais adiante.',
        herReply: {
          message: 'kkkk verdade! Lisboa foi a melhor, voltaria amanhã',
          reading: 'Ela riu do match parado e respondeu com entusiasmo: a conversa começou bem.',
          suggestion: 'Voltaria amanhã é um ótimo sinal. O que te pegou mais lá: a comida, o clima ou as vistas?',
        },
      },
    },
    'ask-out': {
      summary: 'Perfil da Camila: mora perto e está em busca do melhor cappuccino da cidade.',
      text: "Perfil da Camila, 31 anos, mora na mesma região. Foto num café com latte art. Bio: 'em busca do melhor cappuccino da cidade'.",
      context: 'Match de ontem. Ela parece objetiva.',
      reading:
        'A bio tem uma missão clara e ela está perto. Para alguém objetiva, uma abertura que já sugere um plano leve faz sentido, sem parecer apressada.',
      cards: {
        light: card(
          'Também tô nessa busca pelo melhor cappuccino. Qual está no topo do seu ranking até agora?',
          'Puxar assunto pelo tema da bio antes de qualquer convite.',
          'Quando ela disser o café favorito, sugira testar o seu candidato junto.',
          [
            'Qual cappuccino está no topo do seu ranking?',
            'Também tô nessa busca pelo melhor cappuccino haha, qual tá ganhando até agora?',
            'Também procuro o melhor cappuccino. Me passa seu ranking que eu te levo no meu favorito.',
            'Adorei sua bio! Qual cafeteria você mais gostou até agora?',
            'Cappuccino com canela ou sem? Preciso saber antes de qualquer coisa.',
          ],
        ),
        confident: card(
          'Tenho um candidato forte ao melhor cappuccino da cidade. Topa avaliar comigo essa semana?',
          'Fazer um convite concreto e de baixo compromisso usando a bio.',
          'Se ela topar, sugira dois dias; se perguntar qual é o café, conte e mantenha a proposta de irem juntos.',
          [
            'Tenho um candidato a melhor cappuccino. Topa avaliar comigo?',
            'Acho que conheço um forte candidato ao melhor cappuccino da cidade. Bora testar essa semana?',
            'Tenho o melhor cappuccino da cidade, e não aceito discordância sem você provar. Quinta?',
            'Conheço um café que talvez entre no seu ranking. Se quiser, te indico ou a gente vai junto.',
            'Minha aposta pro melhor cappuccino fica a 10 minutos daqui. Topa ser a jurada?',
          ],
        ),
        bold: card(
          'Proposta: a gente testa um cappuccino por semana até achar o melhor. A primeira rodada é por minha conta.',
          'Propor uma série de encontros em tom de brincadeira.',
          'Se ela entrar na ideia, marque a primeira rodada com dia e lugar.',
          [
            'Um cappuccino por semana até achar o melhor. O primeiro é por minha conta.',
            'Bora testar um cappuccino por semana até achar o melhor? A primeira rodada eu pago haha',
            'Proposta: um cappuccino por semana até achar o melhor. Já aviso que vou enrolar pra essa busca demorar.',
            'Que tal a gente trocar indicações de café? Quem sabe testar um juntos.',
            'Proposta séria: eu levo você num cappuccino e você dá a nota. Se passar de 8, o próximo você escolhe.',
          ],
        ),
      },
      recommended: 'confident',
      reason: 'A bio dá o pretexto perfeito e ela é objetiva: um convite concreto e de baixo compromisso.',
      followUps: {
        why: 'A recomendada (Confiante) usa a missão da bio como pretexto para um convite concreto e leve: um café, essa semana. Para alguém objetiva, isso soa direto sem ser apressado.',
        next: 'Se ela topar, ofereça dois dias e um café específico. Se ela perguntar qual é o café, conte, mas mantenha a proposta de irem juntos.',
        herReply: {
          message: 'hmm, que café? preciso saber se é confiável 👀',
          reading: 'Ela não recusou: está curiosa e quer um motivo. É a deixa para dar o nome e reforçar o convite.',
          suggestion: 'É um café pequeno aqui perto, o cappuccino deles é sério. Mas só confio no seu veredito ao vivo: quinta ou sexta?',
        },
      },
    },
  },
  story: {
    continue: {
      summary: 'Story da Renata: bolo de cenoura que finalmente deu certo com a receita da avó.',
      text: "Story da Renata: foto de um bolo de cenoura com cobertura de chocolate. Legenda: 'primeira vez que acerto a receita da vó'.",
      context: 'Já conversamos algumas vezes, o papo anda morno.',
      reading:
        'Ela mostrou uma conquista com valor afetivo. Reconhecer o esforço e perguntar pela história rende mais conversa do que só reagir com um emoji.',
      cards: {
        light: card(
          'A vó aprovaria esse bolo com certeza 👏 Qual era o segredo que faltava?',
          'Valorizar o lado afetivo e convidar ela a contar a história.',
          'Se ela contar o segredo, pergunte se ela tem outras receitas da avó.',
          [
            'A vó aprovaria 👏 Qual era o segredo?',
            'Que orgulho, a vó ia amar 👏 O que faltava nas outras vezes?',
            'A vó aprovaria, e eu também, se tivesse um pedaço aqui 👏',
            'Que lindo! A vó ia ficar orgulhosa 👏',
            'Receita de vó sempre tem um segredo que ninguém conta. Qual era o desse bolo?',
          ],
        ),
        confident: card(
          'Receita de vó acertada é conquista desbloqueada. Agora me conta: o que dava errado nas outras tentativas?',
          'Celebrar a conquista e mostrar curiosidade pelo processo.',
          'Quando ela contar, brinque com o erro e pergunte qual é a próxima receita.',
          [
            'Conquista desbloqueada! O que dava errado antes?',
            'Conquista desbloqueada haha. O que dava errado nas outras tentativas?',
            'Conquista desbloqueada. Agora preciso provar pra confirmar se tá mesmo igual ao da vó.',
            'Parabéns, ficou lindo! O que deu certo dessa vez?',
            'Bolo de cenoura com chocolate da vó é patrimônio. Quantas tentativas até acertar?',
          ],
        ),
        bold: card(
          'Esse bolo tá com cara de que precisa de uma avaliação externa. Me candidato oficialmente.',
          'Pedir um pedaço em tom de brincadeira para abrir espaço a um encontro.',
          'Se ela entrar na brincadeira, sugira trocar por algo que você sabe fazer.',
          [
            'Esse bolo precisa de avaliação externa. Me candidato.',
            'Esse bolo tá pedindo uma avaliação externa haha, me candidato',
            'Esse bolo merece avaliação externa. Me candidato e ainda levo o café.',
            'Esse bolo parece incrível, deu até vontade de provar!',
            'Proposta de troca: um pedaço desse bolo por um café passado na hora.',
          ],
        ),
      },
      recommended: 'light',
      reason: 'Valoriza o lado afetivo da história e faz uma pergunta que convida ela a contar mais.',
      followUps: {
        why: 'A recomendada (Leve) reconhece o valor afetivo da receita da avó e pergunta pelo "segredo". Isso convida ela a contar uma história pessoal, o que aquece um papo que estava morno.',
        next: 'Quando ela contar, mostre interesse pela história da família ou da receita. Depois de algumas trocas, dá para brincar sobre provar o bolo.',
        herReply: {
          message: 'o segredo é bater bem a cenoura com o óleo kkkk',
          reading: 'Ela respondeu com detalhe e humor: o story abriu uma conversa de verdade.',
          suggestion: 'Anotado o segredo da vó haha. Você cozinha sempre ou foi um ataque de saudade?',
        },
      },
    },
    flirt: {
      summary: 'Story da Isabela: selfie arrumada para sair, com a legenda "sexta-feira finalmente".',
      text: "Story da Isabela: selfie no espelho, arrumada pra sair. Legenda: 'sexta-feira finalmente'.",
      context: 'Conversamos de vez em quando, clima bom.',
      reading:
        'Selfie produzida pede reação. Um elogio indireto e com humor se destaca mais do que "linda" e evita soar carente.',
      cards: {
        light: card(
          'A sexta começou bem, pelo visto 🔥 Pra onde vai?',
          'Reagir com energia positiva e uma pergunta simples.',
          'Quando ela disser o lugar, comente algo sobre ele e deseje uma boa noite.',
          [
            'Sexta começou bem 🔥 Pra onde?',
            'Sexta começou bem hein 🔥 vai pra onde?',
            'Sexta começou bem demais 🔥 Quem vai ter a sorte de te ver hoje?',
            'Que bonita! Aproveita a sexta 😊',
            'Esse é o look de quem vai fechar a noite. Qual é o plano?',
          ],
        ),
        confident: card(
          'Esse look é injusto com quem vai ficar em casa hoje. Onde vai ser a noite?',
          'Elogiar de forma indireta, com humor, e manter a conversa.',
          'Se ela disser o lugar, brinque sobre aparecer por lá ou combine para outro dia.',
          [
            'Esse look é injusto com quem fica em casa. Onde vai ser?',
            'Esse look é injusto com quem vai ficar em casa hoje haha. Vai pra onde?',
            'Esse look é injusto com quem vai ficar em casa hoje. Principalmente comigo. Onde vai ser?',
            'Você tá muito bonita! Vai pra onde hoje?',
            'Pelo look, a sexta já tem nota 10. Qual é a programação?',
          ],
        ),
        bold: card(
          'Se esse look for pro lugar certo, sou capaz de aparecer lá por puro acaso 😏',
          'Flertar abertamente sugerindo um encontro "por acaso".',
          'Se ela disser onde vai estar, decida se vai mesmo; se não disser, deixe o convite para outro dia.',
          [
            'Com esse look, sou capaz de aparecer lá por acaso 😏',
            'Se esse look for pro lugar certo, sou capaz de aparecer lá por acaso haha 😏',
            'Me diz onde vai ser. Com esse look, aparecer lá por acaso deixou de ser opção e virou plano 😏',
            'Esse look merecia uma companhia à altura 😊',
            'Pergunta sem segundas intenções (mentira): onde vai ser a noite? 😏',
          ],
        ),
      },
      recommended: 'confident',
      reason: 'Elogia de forma indireta e com humor, e termina com uma pergunta que mantém a conversa.',
      followUps: {
        why: 'A recomendada (Confiante) elogia sem dizer só "linda": o "injusto com quem vai ficar em casa" é indireto e divertido. Fechar com uma pergunta sobre a noite dá a ela um motivo para responder.',
        next: 'Se ela disser onde vai, comente o lugar e deseje uma boa noite, sem forçar. No dia seguinte, pergunte como foi: é um gancho natural para continuar e, depois, convidar.',
        herReply: {
          message: 'kkkk obrigada! vou num aniversário de uma amiga',
          reading: 'Ela agradeceu e deu informação: está aberta, mas a noite dela já tem plano.',
          suggestion: 'Aproveita muito! Amanhã quero o relatório de como foi 😄',
        },
      },
    },
    reconnect: {
      summary: 'Story da Letícia num show do Bruno Mars, depois de dois meses sem falar.',
      text: "Story da Letícia: foto de um show do Bruno Mars. Legenda: 'melhor noite do ano'.",
      context: 'A gente não se fala há uns dois meses.',
      reading:
        'O story é a porta mais natural para retomar contato: o assunto já está pronto e não exige explicar o tempo sem conversa.',
      cards: {
        light: card(
          'Bruno Mars ao vivo deve ter sido incrível! Ele tocou Treasure?',
          'Retomar pelo assunto dela, com uma pergunta fácil e sem mencionar o tempo sem contato.',
          'Se ela responder, continue no tema música e pergunte qual é o próximo show.',
          [
            'Bruno Mars ao vivo! Tocou Treasure?',
            'Bruno Mars ao vivo deve ter sido incrível demais. Tocou Treasure?',
            'Bruno Mars ao vivo! Só não te perdoo se ele não tocou Treasure.',
            'Que demais esse show! Fiquei feliz por você 😊',
            'Bruno Mars ao vivo é sonho de muita gente. Qual música você mais esperava?',
          ],
        ),
        confident: card(
          'Sumi, mas não dava pra deixar passar: Bruno Mars ao vivo é outro nível. Qual foi o momento da noite?',
          'Reconhecer o sumiço rapidamente e ir direto para o assunto dela.',
          'Quando ela contar o momento, compartilhe um show marcante seu.',
          [
            'Sumi, mas Bruno Mars ao vivo não dava pra ignorar. Qual foi o momento?',
            'Sei que sumi, mas não dava pra não comentar: Bruno Mars ao vivo! Qual foi o melhor momento?',
            'Sumi, mas Bruno Mars ao vivo me fez voltar. Qual foi o momento da noite? Quero detalhes.',
            'Oi, Letícia! Vi seu story. Como foi o show?',
            'Esse story me fez lembrar de você. Qual música te pegou mais?',
          ],
        ),
        bold: card(
          'Melhor noite do ano e eu nem fui convidado? Vou precisar de um relatório completo pra me recuperar.',
          'Usar humor exagerado para quebrar o gelo depois do tempo sem falar.',
          'Se ela entrar na brincadeira, mantenha o tom e proponha o próximo show juntos.',
          [
            'Melhor noite do ano e eu não fui convidado? Quero o relatório.',
            'Melhor noite do ano e nem me chamou? haha quero o relatório completo',
            'Melhor noite do ano e eu não fui convidado? No próximo show você me deve companhia.',
            'Melhor noite do ano, que legal! Conta como foi?',
            'Pela legenda, minha noite de sábado perdeu feio. Como foi?',
          ],
        ),
      },
      recommended: 'light',
      reason: 'Entra pelo assunto dela sem chamar atenção para o tempo sem contato, com uma pergunta fácil.',
      followUps: {
        why: 'A recomendada (Leve) usa o story como porta de entrada: pergunta algo específico do show e não fala do tempo sem contato. Ela pode responder sem precisar explicar nada.',
        next: 'Se ela responder, siga no tema música por algumas trocas. Só depois, se o papo esquentar, sugira um programa parecido, como outro show.',
        herReply: {
          message: 'TOCOU! chorei em Treasure kkkk e você, sumido?',
          reading: 'Ela respondeu animada e comentou o sumiço com humor: a porta está aberta.',
          suggestion: 'Sumido, mas de volta pro que importa haha. Chorar em Treasure é justo. Qual é o próximo show da lista?',
        },
      },
    },
    'ask-out': {
      summary: 'Story da Mariana num bar novo, dizendo que já quer voltar.',
      text: "Story da Mariana: foto de um bar com drinks coloridos. Legenda: 'descobri esse lugar e já quero voltar'.",
      context: 'Conversamos bem há duas semanas, ainda não saímos.',
      reading:
        'Ela disse que quer voltar a um lugar. É o gancho ideal para um convite: o plano já existe, só falta você entrar nele.',
      cards: {
        light: card(
          'Esse lugar tem cara de ótimo! Qual drink vale a pena?',
          'Mostrar interesse pelo lugar antes do convite.',
          'Quando ela indicar o drink, proponha experimentar juntos.',
          [
            'Que lugar! Qual drink vale a pena?',
            'Que lugar massa haha, qual drink você recomenda?',
            'Que lugar! Me fala qual drink vale a pena, que eu já quero ir com você.',
            'Que lugar bonito! Onde fica?',
            'Esses drinks coloridos têm cara de perigosos. Qual é o melhor?',
          ],
        ),
        confident: card(
          'Já que você quer voltar, que tal voltar comigo? Quinta ou sexta fica melhor pra você?',
          'Usar a vontade dela de voltar para fazer um convite com opções de dia.',
          'Quando ela escolher o dia, confirme o horário e mantenha o resto leve.',
          [
            'Já que quer voltar, volta comigo? Quinta ou sexta?',
            'Já que você quer voltar, bora junto? Quinta ou sexta fica melhor?',
            'Você quer voltar e eu quero te ver. Quinta ou sexta?',
            'Se você quiser voltar, eu toparia ir junto um dia!',
            'Esse lugar merece uma segunda visita, e eu me ofereço de companhia. Que dia você pode?',
          ],
        ),
        bold: card(
          'Você já achou o lugar, agora só falta a companhia certa. Sexta, 20h, eu chego primeiro.',
          'Convidar de forma decidida, já com dia e horário.',
          'Se ela aceitar, confirme o local; se não puder, ofereça outro dia logo em seguida.',
          [
            'Só falta a companhia certa. Sexta, 20h?',
            'Você já achou o lugar, agora falta a companhia haha. Sexta às 20h?',
            'Lugar escolhido, companhia definida. Sexta, 20h. Eu chego primeiro e já peço o seu drink.',
            'Você achou o lugar, eu levo a companhia. Topa um dia desses?',
            'Eu reservo a mesa, você escolhe os drinks. Sexta, 20h?',
          ],
        ),
      },
      recommended: 'confident',
      reason: 'Aproveita a vontade que ela já demonstrou e oferece duas opções de dia, o que facilita o sim.',
      followUps: {
        why: 'A recomendada (Confiante) aproveita a vontade que ela mesma postou ("já quero voltar") e oferece duas opções de dia. Escolher entre quinta e sexta é mais fácil do que responder a um "quer sair?".',
        next: 'Quando ela escolher o dia, confirme horário e lugar numa mensagem curta. Até lá, mantenha a conversa leve, sem excesso de mensagens.',
        herReply: {
          message: 'sexta eu consigo! umas 20h?',
          reading: 'Ela aceitou e propôs horário: o encontro está marcado.',
          suggestion: 'Perfeito, sexta às 20h. Te encontro lá. Vou confiar na sua recomendação de drink!',
        },
      },
    },
  },
}
