import { card, type DemoContent, type DemoRequest } from './demo'

export type ModeId = 'quick-date' | 'post-date' | 'nudes' | 'express'
export type PostDatePath = 'casual' | 'relationship' | 'second-date'

export const POST_DATE_PATHS: { id: PostDatePath; label: string }[] = [
  { id: 'casual', label: 'Casual' },
  { id: 'relationship', label: 'Buscar namoro' },
  { id: 'second-date', label: 'Tentar segundo encontro' },
]

export interface ModeField {
  id: string
  label: string
  kind: 'textarea' | 'text'
  placeholder: string
  required: boolean
}

export interface ModeDef {
  id: ModeId
  title: string
  /** Uma linha na lista de modos. */
  tagline: string
  description: string
  fields: ModeField[]
  /** Exige confirmar que os dois são maiores de 18. */
  adultConfirm: boolean
  /** Regras exibidas em destaque no topo do formulário. */
  guidelines?: string[]
}

export const MODES: ModeDef[] = [
  {
    id: 'quick-date',
    title: 'Date Rápido',
    tagline: 'Transforme o papo em encontro com dia e hora.',
    description: 'Conte com quem você está falando e quando você pode. As sugestões já chegam com convite e horário.',
    adultConfirm: false,
    fields: [
      {
        id: 'context',
        label: 'Contexto',
        kind: 'textarea',
        placeholder: 'Com quem você está falando, há quanto tempo e do que ela gosta.',
        required: true,
      },
      {
        id: 'availability',
        label: 'Sua disponibilidade',
        kind: 'text',
        placeholder: 'Ex.: quinta depois das 19h ou sábado à tarde',
        required: true,
      },
    ],
  },
  {
    id: 'post-date',
    title: 'Pós-Date',
    tagline: 'A mensagem do dia seguinte, do jeito que você quer seguir.',
    description: 'Escolha o caminho que você quer e conte como foi o encontro.',
    adultConfirm: false,
    fields: [
      {
        id: 'date',
        label: 'Como foi o date?',
        kind: 'textarea',
        placeholder: 'Onde foram, como foi a conversa, como terminou.',
        required: true,
      },
    ],
  },
  {
    id: 'nudes',
    title: 'Protocolo Nudes',
    tagline: 'Conversa consensual entre adultos, com limites claros.',
    description: 'Ajuda a perguntar com clareza, combinar limites e aceitar um não. Não é para pedir nem enviar imagens.',
    adultConfirm: true,
    guidelines: [
      'Só entre adultos e com consentimento claro dos dois. Sinal de flerte não é consentimento.',
      'Este modo não aceita imagens: não há campo de upload e nada é enviado.',
      'Nunca mande conteúdo íntimo sem pedido, nunca insista e nunca compartilhe o que recebeu.',
      'Um não, silêncio ou mudança de ideia encerram o assunto.',
    ],
    fields: [
      {
        id: 'context',
        label: 'Como está a conversa?',
        kind: 'textarea',
        placeholder: 'Há quanto tempo vocês conversam, se já se encontraram e como está o clima.',
        required: true,
      },
    ],
  },
  {
    id: 'express',
    title: 'Sexo Express',
    tagline: 'Fale de interesse em intimidade sem ser gráfico.',
    description: 'Ajuda a comunicar a vontade com clareza e respeito, sempre com espaço para ela recusar.',
    adultConfirm: true,
    guidelines: [
      'Só entre adultos. Interesse se comunica com clareza, sem descrições gráficas.',
      'Todo convite precisa deixar o não tão fácil quanto o sim.',
      'Recusa, hesitação ou silêncio são respostas: aceite e não insista.',
    ],
    fields: [
      {
        id: 'context',
        label: 'Como está a relação de vocês?',
        kind: 'textarea',
        placeholder: 'Quantas vezes já se viram, como foi o último encontro, o que ela disse.',
        required: true,
      },
    ],
  },
]

export function getMode(id: ModeId): ModeDef {
  return MODES.find((m) => m.id === id)!
}

type Values = Record<string, string>

interface ModeExample {
  values: Values
  content: DemoContent
}

const QUICK_DATE: ModeExample = {
  values: {
    context:
      'Conversando com a Bruna há 5 dias pelo app. Ela mora perto, gosta de vinho e comentou que está com a semana tranquila.',
    availability: 'Quinta depois das 19h ou sábado à tarde',
  },
  content: {
    summary: 'Bruna: 5 dias de conversa, mora perto, gosta de vinho e está com a semana tranquila.',
    reading:
      'Ela deu a deixa ("semana tranquila") e vocês têm um interesse em comum, o vinho. Com a sua disponibilidade clara, o melhor é propor um plano simples, com dia e horário, sem enrolar.',
    cards: {
      light: card(
        'Semana tranquila e uma fã de vinho por perto… isso pede uma taça. Topa quinta depois das 19h ou sábado à tarde?',
        'Propor o encontro de forma leve, já com duas opções da sua agenda.',
        'Quando ela escolher, sugira um lugar e confirme o horário.',
        [
          'Topa uma taça de vinho? Quinta à noite ou sábado à tarde.',
          'Já que a semana tá tranquila, bora tomar um vinho? Quinta depois das 19h ou sábado à tarde?',
          'Semana tranquila é desperdício sem um vinho comigo. Quinta à noite ou sábado à tarde?',
          'Se a semana estiver mesmo tranquila, que tal um vinho qualquer dia desses? Quinta ou sábado eu consigo.',
          'Conheço uma adega pequena aqui perto que você vai gostar. Quinta à noite ou sábado à tarde?',
        ],
      ),
      confident: card(
        'Bora tirar essa conversa do app: quinta, 19h30, uma taça de vinho num lugar aqui perto. Se não der, sábado à tarde também funciona.',
        'Assumir a condução com um plano completo e uma alternativa.',
        'Se ela topar, mande o nome do lugar; se sugerir outro horário, adapte sem drama.',
        [
          'Quinta, 19h30, vinho aqui perto. Se não der, sábado à tarde.',
          'Que tal a gente se ver? Quinta 19h30 tomando um vinho aqui perto, ou sábado à tarde se for melhor pra você',
          'Quinta, 19h30, vinho aqui perto. Já tô escolhendo a mesa, só falta você confirmar.',
          'Que tal a gente se conhecer pessoalmente? Pensei em quinta às 19h30 num vinho aqui perto, mas sábado à tarde também dá.',
          'Proposta rápida: quinta, 19h30, uma taça e uma hora de conversa ao vivo. Se for bom, a gente estica. Topa?',
        ],
      ),
      bold: card(
        'Cinco dias de conversa boa já é tempo suficiente. Quinta eu tô livre depois das 19h: me encontra pra um vinho?',
        'Ser direto, mostrando que você quer conhecê-la ao vivo.',
        'Se ela hesitar, ofereça o sábado à tarde como opção mais tranquila.',
        [
          'Cinco dias de papo bom bastam. Vinho quinta à noite?',
          'Acho que já deu de conversar só por aqui haha. Quinta depois das 19h, um vinho?',
          'Cinco dias de conversa e eu já quero ver essa risada ao vivo. Quinta, depois das 19h. Me encontra?',
          'Tô gostando muito da conversa. Topa continuar ao vivo, num vinho, quinta ou sábado?',
          'Vamos fazer um teste: uma taça de vinho na quinta. Se o papo for tão bom ao vivo quanto aqui, a gente marca a segunda.',
        ],
      ),
    },
    recommended: 'confident',
    reason: 'Plano completo (dia, hora e lugar) com alternativa: ela só precisa dizer sim ou escolher a outra opção.',
    followUps: {
      why: 'A recomendada (Confiante) usa a sua disponibilidade de forma concreta: quinta às 19h30, com o sábado como plano B. Ela não precisa organizar nada, só responder.',
      next: 'Quando ela confirmar, mande o nome e a localização do lugar no mesmo dia. Na véspera, uma mensagem curta confirmando basta; evite conversas longas antes do encontro.',
      herReply: {
        message: 'quinta tá ótimo! onde?',
        reading: 'Ela aceitou e já quer saber o local: é hora de fechar os detalhes.',
        suggestion: 'Perfeito! Tem uma adega na rua de cima, bem tranquila. Te mando a localização. 19h30 lá?',
      },
    },
  },
}

const POST_DATE: Record<PostDatePath, ModeExample> = {
  casual: {
    values: {
      date: 'Saí com a Gabi ontem num bar. Rimos muito e rolou beijo no fim. Ela comentou que acabou de sair de um namoro e quer curtir sem compromisso.',
    },
    content: {
      summary: 'Date com a Gabi: risadas, beijo no fim e ela quer algo sem compromisso.',
      reading:
        'Ela foi clara sobre querer algo casual. A mensagem do dia seguinte pode mostrar que você curtiu e que está alinhado com isso, sem prometer mais do que os dois querem.',
      cards: {
        light: card(
          'Ontem foi muito bom, ri demais com você. Chegou bem?',
          'Mostrar que curtiu, de forma leve e sem pressão.',
          'Se ela responder no mesmo clima, sugira repetir em alguns dias.',
          [
            'Ontem foi muito bom. Chegou bem?',
            'Ri demais ontem haha, foi muito bom. Chegou bem?',
            'Ontem foi muito bom, e aquele final então… Chegou bem?',
            'Obrigado pela noite de ontem, foi bem divertida! Chegou bem?',
            'Ainda rindo daquela história do garçom. Foi uma noite ótima, valeu!',
          ],
        ),
        confident: card(
          'Curti muito ontem. Do jeito que você falou: leve, sem cobrança e com vontade de repetir. Topa outra rodada semana que vem?',
          'Alinhar expectativas com o que ela disse e deixar a porta aberta para repetir.',
          'Se ela topar, marque algo simples e mantenha o tom leve que vocês combinaram.',
          [
            'Curti muito ontem. Leve, sem cobrança. Repete semana que vem?',
            'Curti demais ontem. Leve e sem cobrança, do jeito que você falou, mas com vontade de repetir haha. Semana que vem?',
            'Curti muito ontem, principalmente o final. Sem cobrança, mas com vontade de repetir logo. Semana que vem?',
            'Gostei muito de ontem. Sem pressa nenhuma, mas se quiser repetir, tô dentro.',
            'Ontem foi do jeito certo: leve e divertido. Quando der vontade de repetir, é só chamar.',
          ],
        ),
        bold: card(
          'Ontem foi bom demais. Sem compromisso, mas com uma condição: a próxima rodada é por minha conta.',
          'Manter o clima de flerte e já puxar o próximo encontro.',
          'Se ela entrar na brincadeira, proponha um dia.',
          [
            'Ontem foi ótimo. Próxima rodada por minha conta.',
            'Ontem foi bom demais haha. Sem compromisso, mas a próxima é por minha conta',
            'Ontem foi bom demais. Sem compromisso, mas a próxima rodada é minha, e o final pode ser melhor ainda.',
            'Ontem foi muito bom. Se rolar uma próxima, eu pago a primeira!',
            'Proposta casual: mesma companhia, outro bar. Você escolhe o dia.',
          ],
        ),
      },
      recommended: 'confident',
      reason: 'Mostra que você ouviu o que ela quer e que está alinhado, sem pressão e com convite aberto.',
      followUps: {
        why: 'A recomendada (Confiante) devolve o que ela mesma disse (algo leve, sem cobrança) e já deixa um convite. Isso mostra que você escutou e evita mal-entendido sobre expectativas.',
        next: 'Respeite o ritmo casual: não mande mensagens demais entre os encontros. Se em algum momento você quiser algo diferente, fale com clareza, em vez de esperar que ela mude.',
        herReply: {
          message: 'kkkk adorei! semana que vem dá sim',
          reading: 'Ela confirmou que quer repetir, no mesmo tom leve.',
          suggestion: 'Fechado! Quinta ou sexta fica melhor pra você?',
        },
      },
    },
  },
  relationship: {
    values: {
      date: 'Jantei com a Helena no sábado. Conversamos por 3 horas sobre família, viagens e planos. Senti uma conexão forte e quero algo sério.',
    },
    content: {
      summary: 'Jantar de 3 horas com a Helena, conversa profunda e vontade de algo sério.',
      reading:
        'A conexão foi forte e você quer algo sério. Depois do date, o ideal é mostrar interesse genuíno sem pular etapas: deixar claro que gostou de conhecê-la e propor um próximo encontro.',
      cards: {
        light: card(
          'Ainda pensando na nossa conversa de sábado. Fazia tempo que três horas não passavam tão rápido.',
          'Mostrar que a conversa marcou você, com sinceridade.',
          'Se ela responder com carinho, proponha um próximo encontro com um programa diferente.',
          [
            'Três horas que passaram voando. Adorei sábado.',
            'Ainda pensando no sábado, sério. Três horas passaram muito rápido',
            'Ainda pensando no sábado. Três horas foram pouco, quero mais tempo com você.',
            'Adorei nossa conversa de sábado, obrigado pela noite!',
            'Aquela história da sua avó em Portugal ficou na minha cabeça. Foi uma noite muito boa.',
          ],
        ),
        confident: card(
          'Gostei muito de te conhecer no sábado. Quero te ver de novo: topa um passeio no parque no domingo?',
          'Deixar seu interesse claro e propor um próximo passo concreto.',
          'Se ela topar, mantenha a constância: interesse claro, sem sufocar.',
          [
            'Gostei muito de sábado. Parque no domingo?',
            'Gostei muito de te conhecer no sábado. Bora repetir? Pensei num parque no domingo',
            'Gostei muito de te conhecer e quero muito te ver de novo. Domingo, parque, eu levo o café.',
            'Gostei muito de sábado. Se você quiser, adoraria te ver de novo.',
            'Sábado foi especial. Que tal o próximo ser de dia? Domingo, feira e almoço.',
          ],
        ),
        bold: card(
          'Vou ser direto: fazia tempo que eu não saía de um encontro tão animado. Quero te conhecer melhor. Domingo?',
          'Ser transparente sobre a conexão, sem rodeios.',
          'Dê espaço para ela responder no ritmo dela; não cobre retorno.',
          [
            'Fazia tempo que eu não saía tão animado de um date. Domingo?',
            'Vou ser sincero: saí muito animado de sábado haha. Quero te conhecer melhor, domingo?',
            'Vou ser direto: saí de sábado querendo mais. Quero te conhecer de verdade. Domingo?',
            'Saí muito feliz de sábado. Adoraria te conhecer melhor, quando você puder.',
            'Sem joguinho: gostei muito de você e quero repetir. Qual dia é bom pra você?',
          ],
        ),
      },
      recommended: 'confident',
      reason: 'Deixa o interesse claro sem pular etapas e transforma a conexão em um próximo encontro concreto.',
      followUps: {
        why: 'A recomendada (Confiante) mostra interesse real ("quero te ver de novo") e propõe algo concreto e diferente do primeiro date. Para quem busca algo sério, clareza vale mais do que joguinho.',
        next: 'Mantenha constância: responda com interesse, proponha encontros com regularidade e conheça a rotina dela aos poucos. Falar de relacionamento sério cedo demais pode pesar; deixe isso surgir com o tempo.',
        herReply: {
          message: 'também adorei! domingo eu topo 😊',
          reading: 'Ela retribuiu o interesse e aceitou o convite: o sentimento é recíproco.',
          suggestion: 'Que bom! Te encontro às 10h? Conheço uma padaria ótima perto do parque.',
        },
      },
    },
  },
  'second-date': {
    values: {
      date: 'Tomei um café com a Tati na terça. Foi bom, mas um pouco travado no início; melhorou quando falamos de séries. Não sei se ela curtiu tanto quanto eu.',
    },
    content: {
      summary: 'Café com a Tati: começo travado, melhorou falando de séries e você está em dúvida.',
      reading:
        'O date começou travado, mas engrenou num assunto em comum (séries). Para tentar um segundo encontro, use esse assunto como ponte e proponha algo com atividade, que tira a pressão da conversa.',
      cards: {
        light: card(
          'Fiquei pensando na série que você indicou e já vi o primeiro episódio. Você tinha razão!',
          'Retomar pelo assunto que funcionou entre vocês.',
          'Quando ela responder, sugira comentar ou assistir o próximo episódio juntos.',
          [
            'Vi o primeiro episódio da série que você indicou. Você tinha razão!',
            'Comecei a série que você falou haha, já tô viciado. Você tinha razão',
            'Vi o primeiro episódio da série que você indicou. Agora você me deve uma maratona juntos.',
            'Comecei a série que você indicou, gostei bastante! Obrigado pela dica.',
            'Spoiler: a série que você indicou me ganhou. Qual é a próxima da sua lista?',
          ],
        ),
        confident: card(
          'Gostei do café! Melhorou muito quando a gente começou a falar de séries. Bora repetir num programa mais leve? Tem um cinema ao ar livre no sábado.',
          'Reconhecer o que funcionou e propor um segundo encontro com atividade.',
          'Se ela topar, combine os detalhes; se recusar, agradeça e não insista.',
          [
            'Gostei do café! Bora repetir? Cinema ao ar livre no sábado.',
            'Gostei do café haha, ainda mais quando a gente começou a falar de série. Bora num cinema ao ar livre sábado?',
            'Gostei do café, e quero ver se no segundo encontro você ri ainda mais. Cinema ao ar livre, sábado?',
            'Gostei de te conhecer! Se você quiser repetir, tem um cinema ao ar livre no sábado.',
            'Segundo round com menos entrevista e mais diversão? Tem um boliche perto daqui.',
          ],
        ),
        bold: card(
          'Primeiro encontro é sempre meio entrevista. Proponho um segundo sem formalidade: boliche no sábado. Topa?',
          'Assumir com humor que o começo foi travado e propor algo descontraído.',
          'Se ela rir e topar, marque o horário; se não responder, não mande outra cobrança.',
          [
            'Primeiro encontro é entrevista. O segundo é boliche. Sábado?',
            'Primeiro encontro sempre tem cara de entrevista né haha. Bora num boliche sábado, sem formalidade?',
            'Primeiro encontro é entrevista. No segundo eu quero te ver rindo do meu boliche horrível. Sábado?',
            'Primeiro encontro é sempre meio tenso, né? Se você quiser, um segundo mais leve seria legal.',
            'Proposta: um segundo encontro em que é proibido perguntar "o que você faz da vida". Sábado?',
          ],
        ),
      },
      recommended: 'confident',
      reason: 'Valoriza o que funcionou, reconhece sem drama o começo travado e propõe algo mais leve.',
      followUps: {
        why: 'A recomendada (Confiante) destaca o melhor momento do date (as séries) e propõe uma atividade, o que tira a pressão de "só conversar". Isso aumenta a chance de um segundo encontro mais solto.',
        next: 'Se ela aceitar, escolha algo com atividade e duração curta. Se ela recusar ou não responder, agradeça e siga em frente: insistir depois de um não só piora a impressão.',
        herReply: {
          message: 'haha adorei a ideia, mas sábado não posso 😕',
          reading: 'Ela gostou da ideia, mas não pode no sábado. Não é recusa: ofereça outra data uma vez, sem pressão.',
          suggestion: 'Sem problema! Domingo ou algum dia da semana que vem fica melhor pra você?',
        },
      },
    },
  },
}

const NUDES: ModeExample = {
  values: {
    context:
      'Conversando com a Lara há 3 semanas, já saímos duas vezes. Ontem à noite o papo ficou mais quente, ela fez piadas de duplo sentido e disse que eu era "perigoso".',
  },
  content: {
    summary: 'Lara: duas saídas, papo mais quente ontem e ela brincou que você é "perigoso".',
    reading:
      'Há sinais de interesse e flerte, mas sinal não é consentimento. Antes de qualquer conteúdo íntimo, o caminho é perguntar com clareza se ela tem vontade, deixar fácil dizer não e combinar limites e privacidade.',
    cards: {
      light: card(
        'Gostei de como o papo ficou ontem 😏 Fiquei curioso: até onde você gosta que essa conversa vá?',
        'Sondar o interesse dela sem pressupor nada, deixando ela definir o limite.',
        'Se ela der abertura, pergunte de forma direta antes de mandar ou pedir qualquer coisa.',
        [
          'Gostei do clima de ontem 😏 Até onde você gosta que esse papo vá?',
          'Gostei de como a conversa esquentou ontem haha. Até onde você curte que esse papo vá?',
          'O clima de ontem ficou na minha cabeça 😏 Me conta: até onde você gosta que essa conversa vá?',
          'Curti nossa conversa de ontem. Fico à vontade no ritmo que for bom pra você.',
          'Perigoso eu? Depende de até onde você quiser levar esse papo 😏 Você que manda.',
        ],
      ),
      confident: card(
        'Vou perguntar com clareza: você curtiria trocar fotos mais ousadas comigo? Se não for sua praia, tudo bem, sem problema nenhum.',
        'Pedir consentimento explícito e deixar o "não" tão fácil quanto o "sim".',
        'Se ela disser sim, combinem limites e privacidade (sem rosto, sem print, apagar se pedir). Se disser não, siga o papo normalmente.',
        [
          'Pergunta direta: você curtiria trocar fotos mais ousadas? Se não, tudo bem.',
          'Posso te perguntar uma coisa direto? Você curtiria trocar umas fotos mais ousadas? Se não for sua vibe, de boa mesmo',
          'Sem rodeio: tô com vontade de trocar fotos mais ousadas com você. Você também? Se não, tá tudo certo.',
          'Queria saber se você ficaria à vontade com conversas mais íntimas. Se preferir não, tá tudo certo.',
          'Antes de qualquer coisa: você tem vontade de deixar essa conversa mais ousada, com fotos? Pode ser sincera, qualquer resposta tá ok.',
        ],
      ),
      bold: card(
        'Esse "perigoso" me deixou curioso 😏 Se você também tiver vontade de apimentar a conversa, me fala. Se não, a gente segue no flerte mesmo.',
        'Assumir o flerte com confiança, devolvendo a decisão para ela.',
        'Só avance se ela disser com clareza que quer; silêncio ou mudança de assunto é um não.',
        [
          'Perigoso, é? 😏 Se quiser apimentar, me fala. Se não, tudo certo.',
          'Esse "perigoso" me pegou haha 😏 Se tiver vontade de apimentar o papo, me fala. Se não, segue o flerte',
          'Já que eu sou perigoso, deixo a decisão com você 😏 Quer apimentar essa conversa? Qualquer resposta é bem-vinda.',
          'Fiquei curioso com o "perigoso" 😄 Se um dia quiser deixar o papo mais ousado, é só falar.',
          'Perigoso só se você quiser 😏 A conversa vai até onde você estiver à vontade.',
        ],
      ),
    },
    recommended: 'confident',
    reason: 'Pergunta com clareza e deixa o "não" fácil: consentimento explícito vale mais do que interpretar sinais.',
    followUps: {
      why: 'A recomendada (Confiante) pede consentimento de forma direta e já normaliza a recusa ("tudo bem, sem problema nenhum"). Isso protege os dois: ninguém recebe o que não pediu e ninguém se sente pressionado.',
      next: 'Se ela disser sim, combinem antes: o que cada um topa, nada de rosto ou tatuagem, nada de print ou encaminhar e apagar se o outro pedir. Se ela disser não ou mudar de ideia, aceite na hora e siga a conversa sem insistir.',
      herReply: {
        message: 'hmm acho que ainda não, prefiro te conhecer melhor antes',
        reading: 'É um não, por enquanto. A melhor resposta aceita sem pressionar e mostra que o interesse continua.',
        suggestion: 'Tranquilo, sem pressa nenhuma. Gosto do nosso papo do jeito que ele está. Quando a gente se vê de novo?',
      },
    },
  },
}

const EXPRESS: ModeExample = {
  values: {
    context:
      'Saí com a Carla três vezes. No último encontro rolou beijo e ela disse que adorou a noite. Hoje ela mandou "ainda pensando em ontem".',
  },
  content: {
    summary: 'Carla: três encontros, beijo no último e ela disse que ainda está pensando na noite.',
    reading:
      'Há interesse dos dois lados e um clima bom. Para falar de intimidade, seja claro sobre a sua vontade, sem descrição gráfica, e faça um convite que ela possa recusar sem constrangimento.',
    cards: {
      light: card(
        'Também tô pensando em ontem 😊 Bem que podia ter durado mais.',
        'Retribuir o clima e sinalizar vontade de mais, sem pressão.',
        'Se ela der abertura, faça um convite claro para um próximo encontro mais reservado.',
        [
          'Também tô pensando em ontem 😊',
          'Também fiquei pensando em ontem haha, podia ter durado mais',
          'Também tô pensando em ontem. E em como ia ser se a noite não tivesse acabado ali 😏',
          'Ontem foi muito bom, também fiquei pensando 😊',
          'Ontem acabou cedo demais, né? 😊',
        ],
      ),
      confident: card(
        'Também tô. Vou ser sincero: tô com vontade de ficar mais perto de você. Topa vir aqui em casa sexta, pra um vinho e ver no que dá? Se preferir ir com calma, tudo certo.',
        'Comunicar o interesse com clareza e respeito, deixando espaço explícito para recusar.',
        'Se ela aceitar, combine com tranquilidade e, no encontro, siga checando se ela está à vontade. Se recusar, aceite e mantenha o clima.',
        [
          'Também tô. Tô com vontade de ficar mais perto de você. Vinho aqui em casa sexta? Se preferir com calma, tudo certo.',
          'Também tô haha. Sendo sincero, tô com vontade de ficar mais perto de você. Vinho aqui em casa sexta? Se quiser ir com calma, de boa',
          'Também tô. E confesso que tô com vontade de você. Sexta, vinho aqui em casa? Só se você também quiser.',
          'Também tô. Se você quiser, adoraria um encontro mais tranquilo aqui em casa um dia, sem pressa nenhuma.',
          'Também. Que tal a próxima ser num lugar mais nosso? Sexta, aqui em casa, vinho e música. Só se fizer sentido pra você.',
        ],
      ),
      bold: card(
        'Ontem ficou um gostinho de quero mais 😏 Sexta, aqui em casa? Só se você também estiver com vontade.',
        'Ser direto sobre o desejo, mantendo a decisão nas mãos dela.',
        'Se ela não responder com clareza, trate como não e não insista.',
        [
          'Ficou um gostinho de quero mais 😏 Sexta, aqui em casa?',
          'Ficou um gostinho de quero mais né haha 😏 Sexta aqui em casa? Só se você quiser também',
          'Ficou um gostinho de quero mais, e eu quero 😏 Sexta, aqui em casa. Se você também quiser.',
          'Ficou um gostinho de quero mais 😊 Se quiser, sexta pode ser aqui em casa. Sem pressão.',
          'Proposta: sexta, aqui em casa, sem hora pra acabar. Se você tiver vontade também, é só dizer 😏',
        ],
      ),
    },
    recommended: 'confident',
    reason: 'Deixa a vontade clara sem ser gráfico e oferece uma saída explícita: ela pode recusar sem constrangimento.',
    followUps: {
      why: 'A recomendada (Confiante) é honesta sobre o interesse, faz um convite concreto e diz com todas as letras que tudo bem ir com calma. Clareza e uma saída fácil tornam o convite respeitoso.',
      next: 'Se ela aceitar, mantenha o encontro leve e confirme no momento se ela está à vontade: consentimento vale a cada passo e pode mudar. Se ela recusar ou hesitar, aceite sem insistir e proponha outro tipo de programa.',
      herReply: {
        message: 'adorei o convite, mas prefiro ir com calma ainda',
        reading: 'Ela recusou o convite para casa, mas gostou do interesse. Respeitar sem cobrança mantém a confiança e o clima.',
        suggestion: 'Super entendo, sem pressa nenhuma. Bora num barzinho sexta, então? Gosto de passar tempo com você de qualquer jeito.',
      },
    },
  },
}

function exampleFor(mode: ModeId, path: PostDatePath): ModeExample {
  switch (mode) {
    case 'quick-date':
      return QUICK_DATE
    case 'post-date':
      return POST_DATE[path]
    case 'nudes':
      return NUDES
    case 'express':
      return EXPRESS
  }
}

export function getModeContent(mode: ModeId, path: PostDatePath = 'casual'): DemoContent {
  return exampleFor(mode, path).content
}

export function getModeExampleValues(mode: ModeId, path: PostDatePath = 'casual'): Values {
  return exampleFor(mode, path).values
}

/** Todos os conteúdos de modos, para testes e checagens de unicidade. */
export function allModeContents(): { key: string; content: DemoContent }[] {
  return [
    { key: 'quick-date', content: QUICK_DATE.content },
    ...POST_DATE_PATHS.map((p) => ({ key: `post-date/${p.id}`, content: POST_DATE[p.id].content })),
    { key: 'nudes', content: NUDES.content },
    { key: 'express', content: EXPRESS.content },
  ]
}

// ---------- Formulário ----------

export interface ModeDraft {
  values: Values
  path: PostDatePath
  adult: boolean
}

export const emptyModeDraft = (): ModeDraft => ({ values: {}, path: 'casual', adult: false })

export function isModeValid(def: ModeDef, draft: ModeDraft): boolean {
  const fieldsOk = def.fields.every((f) => !f.required || (draft.values[f.id] ?? '').trim().length > 0)
  return fieldsOk && (!def.adultConfirm || draft.adult)
}

/** Exemplo intacto do modo (e do caminho, no Pós-Date). Qualquer edição conta como entrada própria. */
export function isModeExample(def: ModeDef, draft: ModeDraft): boolean {
  const example = getModeExampleValues(def.id, draft.path)
  return def.fields.every((f) => (draft.values[f.id] ?? '').trim() === (example[f.id] ?? ''))
}

export function hasOwnModeInput(def: ModeDef, draft: ModeDraft): boolean {
  return def.fields.some((f) => (draft.values[f.id] ?? '').trim() !== '') && !isModeExample(def, draft)
}

export function toModeRequest(def: ModeDef, draft: ModeDraft): DemoRequest {
  const isPostDate = def.id === 'post-date'
  const pathLabel = POST_DATE_PATHS.find((p) => p.id === draft.path)?.label
  return {
    content: getModeContent(def.id, draft.path),
    label: isPostDate ? `${def.title} · ${pathLabel}` : def.title,
    modeLabel: def.title,
    goalLabel: isPostDate ? (pathLabel ?? null) : null,
    feedbackKey: isPostDate ? `mode/${def.id}/${draft.path}` : `mode/${def.id}`,
    source: isModeExample(def, draft) ? 'example' : 'own-text',
  }
}
