import type { AssistantDraft, AssistantTab, Goal } from './assistant'

export const DEMO_NOTICE = 'Demonstração: as respostas são exemplos e não analisam o conteúdo enviado.'

export type Tone = 'light' | 'confident' | 'bold'

export const TONES: { id: Tone; label: string }[] = [
  { id: 'light', label: 'Leve' },
  { id: 'confident', label: 'Confiante' },
  { id: 'bold', label: 'Ousada' },
]

/** Cenário fictício e conhecido, com respostas escritas à mão. Nada aqui é gerado a partir da entrada do usuário. */
export interface DemoScenario {
  /** Uma linha descrevendo o cenário, mostrada junto da leitura. */
  summary: string
  /** Conteúdo que "Usar exemplo" coloca no campo de texto. */
  text: string
  context: string
  reading: string
  messages: Record<Tone, string>
  recommended: Tone
  reason: string
}

export const DEMO_SCENARIOS: Record<AssistantTab, Record<Goal, DemoScenario>> = {
  reply: {
    continue: {
      summary: 'Marina contou que fez uma caneca torta na aula de cerâmica.',
      text: 'Marina: acabei de voltar da aula de cerâmica, minhas mãos tão destruídas kkk\nEu: kkkk e saiu alguma coisa?\nMarina: uma caneca meio torta, mas é minha',
      context: 'Match de 4 dias, a conversa está fluindo bem.',
      reading:
        'Ela está dividindo um hobby e brincou com o próprio resultado ("meio torta, mas é minha"). O papo está quente e aberto para curiosidade e humor.',
      messages: {
        light: 'Caneca torta tem personalidade. Já tem nome ou ainda tá em fase de adaptação?',
        confident:
          'Torta e com dona orgulhosa: já gostei da caneca. Quero ver uma foto dela, e depois você me conta o que te levou pra cerâmica.',
        bold: 'Tô começando a achar que vou precisar de uma aula particular pra entender o charme dessa caneca torta.',
      },
      recommended: 'confident',
      reason: 'Valida o orgulho dela, pede algo concreto (a foto) e abre um tema mais pessoal sem pressionar.',
    },
    flirt: {
      summary: 'Júlia se disse praiana raiz, mas confessou que não sabe nadar direito.',
      text: 'Júlia: vi aqui que você também curte praia\nEu: curto demais, e você?\nJúlia: sou praiana raiz, mas confesso que não sei nadar direito 🙈',
      context: 'Conversa leve há 2 dias.',
      reading:
        'Ela revelou algo levemente vulnerável e usou um emoji de vergonha. É um convite para brincar com cuidado: bom gancho para um flerte leve.',
      messages: {
        light: 'Praiana raiz que não sabe nadar é meu tipo favorito de contradição 😄',
        confident: 'Relaxa, eu fico de salva-vidas. Só aviso que cobro em açaí.',
        bold: 'Então já temos plano: eu te ensino a nadar e você me ensina a ser praiano raiz. Fechado?',
      },
      recommended: 'confident',
      reason: 'Brinca com a vulnerabilidade sem expor ela e já coloca vocês dois na mesma cena, com humor.',
    },
    reconnect: {
      summary: 'Beatriz prometeu contar como foi a apresentação e sumiu há 9 dias.',
      text: 'Eu: e aí, como foi a apresentação?\nBeatriz: foi bem!! depois te conto melhor\n[sem resposta há 9 dias]',
      context: 'Ela parou de responder depois disso. A gente conversou bem por uma semana.',
      reading:
        'A conversa parou numa promessa ("depois te conto"), não numa recusa. Retomar pelo gancho que ela deixou é mais natural do que cobrar o sumiço.',
      messages: {
        light: 'Ainda tô esperando o making of da apresentação, hein 😄 Como foi?',
        confident: 'Beatriz, abriu uma vaga na minha agenda pra ouvir aquela história da apresentação. Ainda tá de pé?',
        bold: 'Vou considerar que a apresentação foi tão boa que você virou CEO e ficou sem tempo. Me conta da promoção 😏',
      },
      recommended: 'light',
      reason: 'Retoma pelo assunto que ela mesma deixou aberto, sem cobrança e com uma resposta fácil de dar.',
    },
    'ask-out': {
      summary: 'Carol indicou uma feira gastronômica com um pastel de costela "surreal".',
      text: 'Carol: esse fim de semana vai ter feira gastronômica no centro\nEu: sério? nunca fui\nCarol: é muito bom, tem um pastel de costela que é surreal',
      context: 'Conversamos há uma semana, sempre bem.',
      reading:
        'Ela trouxe um evento concreto e elogiou algo específico. Na prática é um convite indireto: o caminho está aberto para você propor.',
      messages: {
        light: 'Agora fiquei curioso com esse pastel. Você me apresenta?',
        confident:
          'Então tá decidido: sábado a gente vai nessa feira e você me prova que o pastel de costela é tudo isso. Que horário fica bom pra você?',
        bold: 'Pastel surreal e guia local? Sábado eu tô lá. Só falta você confirmar que vem comigo.',
      },
      recommended: 'confident',
      reason: 'Transforma a dica dela em plano com dia definido e termina perguntando o horário, o que facilita o sim.',
    },
  },
  opener: {
    continue: {
      summary: 'Perfil da Luana: trilha no Pico da Bandeira, um golden e uma bio sobre domingo no mato.',
      text: "Perfil da Luana, 27 anos. Foto fazendo trilha no Pico da Bandeira e outra com um golden retriever. Bio: 'café forte, playlist boa e domingo no mato'.",
      context: 'Match novo, ninguém mandou mensagem ainda.',
      reading:
        'O perfil tem três ganchos claros: trilha, cachorro e a bio. Perguntas abertas sobre isso rendem mais do que um elogio à aparência.',
      messages: {
        light: 'Pico da Bandeira com golden de assistente? Ele foi junto na trilha ou ficou de supervisor em casa?',
        confident:
          'Café forte, playlist boa e domingo no mato: você resumiu meu fim de semana ideal. Qual trilha vem depois do Pico da Bandeira?',
        bold: 'Vou ser sincero: dei match pelo golden, mas fiquei pela bio. Qual música não pode faltar no domingo no mato?',
      },
      recommended: 'confident',
      reason: 'Cria afinidade a partir da bio e termina numa pergunta fácil sobre algo que ela claramente gosta.',
    },
    flirt: {
      summary: 'Perfil da Fernanda: show de rock, bar com amigas e uma bio sobre karaokê.',
      text: "Perfil da Fernanda, 29 anos. Foto num show de rock e outra rindo num bar com as amigas. Bio: 'procuro alguém que aguente meu karaokê'.",
      context: 'Match de hoje.',
      reading:
        'A bio já é um convite brincalhão. Entrar no jogo do karaokê, no mesmo tom, mostra humor e cria uma tensão leve.',
      messages: {
        light: 'Aguento seu karaokê tranquilo. A pergunta é: você aguenta o meu?',
        confident:
          'Topo o desafio do karaokê, mas só se você escolher a primeira música. Quero ver se é rock mesmo ou se tem um sertanejo escondido.',
        bold: 'Já aviso: no dueto eu sou ótimo. Tô até ensaiando o olhar de clipe pra você.',
      },
      recommended: 'confident',
      reason: 'Aceita o jogo da bio, cria um cenário a dois e fecha com uma provocação leve que pede resposta.',
    },
    reconnect: {
      summary: 'Match parado há 3 semanas com a Paula, designer que vive planejando viagens.',
      text: "Match com a Paula de umas 3 semanas atrás, ninguém puxou assunto. Perfil: designer, foto em Lisboa. Bio: 'sempre planejando a próxima viagem'.",
      context: 'Esqueci de mandar mensagem na época.',
      reading:
        'Match parado sem conversa não é rejeição, só ninguém começou. Assumir com leveza e ir direto a um gancho do perfil funciona melhor do que se desculpar demais.',
      messages: {
        light:
          'Demorei 3 semanas pra mandar mensagem, mas em minha defesa eu tava escolhendo a melhor pergunta: qual foi a melhor viagem até agora?',
        confident: 'Paula, a gente deu match e ninguém falou nada. Vou corrigir isso: Lisboa foi a melhor viagem ou só a mais fotogênica?',
        bold: 'Esse match ficou parado tempo demais pra quem vive planejando a próxima viagem. Qual é o próximo destino? Talvez eu tenha sugestões.',
      },
      recommended: 'confident',
      reason: 'Reconhece o tempo parado sem pedir desculpas e já entrega uma pergunta específica sobre o perfil.',
    },
    'ask-out': {
      summary: 'Perfil da Camila: mora perto e está em busca do melhor cappuccino da cidade.',
      text: "Perfil da Camila, 31 anos, mora na mesma região. Foto num café com latte art. Bio: 'em busca do melhor cappuccino da cidade'.",
      context: 'Match de ontem. Ela parece objetiva.',
      reading:
        'A bio tem uma missão clara e ela está perto. Para alguém objetiva, uma abertura que já sugere um plano leve faz sentido, sem parecer apressada.',
      messages: {
        light: 'Também tô nessa busca pelo melhor cappuccino. Qual está no topo do seu ranking até agora?',
        confident: 'Tenho um candidato forte ao melhor cappuccino da cidade. Topa avaliar comigo essa semana?',
        bold: 'Proposta: a gente testa um cappuccino por semana até achar o melhor. A primeira rodada é por minha conta.',
      },
      recommended: 'confident',
      reason: 'A bio dá o pretexto perfeito e ela é objetiva: um convite concreto e de baixo compromisso.',
    },
  },
  story: {
    continue: {
      summary: 'Story da Renata: bolo de cenoura que finalmente deu certo com a receita da avó.',
      text: "Story da Renata: foto de um bolo de cenoura com cobertura de chocolate. Legenda: 'primeira vez que acerto a receita da vó'.",
      context: 'Já conversamos algumas vezes, o papo anda morno.',
      reading:
        'Ela mostrou uma conquista com valor afetivo. Reconhecer o esforço e perguntar pela história rende mais conversa do que só reagir com um emoji.',
      messages: {
        light: 'A vó aprovaria esse bolo com certeza 👏 Qual era o segredo que faltava?',
        confident: 'Receita de vó acertada é conquista desbloqueada. Agora me conta: o que dava errado nas outras tentativas?',
        bold: 'Esse bolo tá com cara de que precisa de uma avaliação externa. Me candidato oficialmente.',
      },
      recommended: 'light',
      reason: 'Valoriza o lado afetivo da história e faz uma pergunta que convida ela a contar mais.',
    },
    flirt: {
      summary: 'Story da Isabela: selfie arrumada para sair, com a legenda "sexta-feira finalmente".',
      text: "Story da Isabela: selfie no espelho, arrumada pra sair. Legenda: 'sexta-feira finalmente'.",
      context: 'Conversamos de vez em quando, clima bom.',
      reading:
        'Selfie produzida pede reação. Um elogio indireto e com humor se destaca mais do que "linda" e evita soar carente.',
      messages: {
        light: 'A sexta começou bem, pelo visto 🔥 Pra onde vai?',
        confident: 'Esse look é injusto com quem vai ficar em casa hoje. Onde vai ser a noite?',
        bold: 'Se esse look for pro lugar certo, sou capaz de aparecer lá por puro acaso 😏',
      },
      recommended: 'confident',
      reason: 'Elogia de forma indireta e com humor, e termina com uma pergunta que mantém a conversa.',
    },
    reconnect: {
      summary: 'Story da Letícia num show do Bruno Mars, depois de dois meses sem falar.',
      text: "Story da Letícia: foto de um show do Bruno Mars. Legenda: 'melhor noite do ano'.",
      context: 'A gente não se fala há uns dois meses.',
      reading:
        'O story é a porta mais natural para retomar contato: o assunto já está pronto e não exige explicar o tempo sem conversa.',
      messages: {
        light: 'Bruno Mars ao vivo deve ter sido incrível! Ele tocou Treasure?',
        confident: 'Sumi, mas não dava pra deixar passar: Bruno Mars ao vivo é outro nível. Qual foi o momento da noite?',
        bold: 'Melhor noite do ano e eu nem fui convidado? Vou precisar de um relatório completo pra me recuperar.',
      },
      recommended: 'light',
      reason: 'Entra pelo assunto dela sem chamar atenção para o tempo sem contato, com uma pergunta fácil.',
    },
    'ask-out': {
      summary: 'Story da Mariana num bar novo, dizendo que já quer voltar.',
      text: "Story da Mariana: foto de um bar com drinks coloridos. Legenda: 'descobri esse lugar e já quero voltar'.",
      context: 'Conversamos bem há duas semanas, ainda não saímos.',
      reading:
        'Ela disse que quer voltar a um lugar. É o gancho ideal para um convite: o plano já existe, só falta você entrar nele.',
      messages: {
        light: 'Esse lugar tem cara de ótimo! Qual drink vale a pena?',
        confident: 'Já que você quer voltar, que tal voltar comigo? Quinta ou sexta fica melhor pra você?',
        bold: 'Você já achou o lugar, agora só falta a companhia certa. Sexta, 20h, eu chego primeiro.',
      },
      recommended: 'confident',
      reason: 'Aproveita a vontade que ela já demonstrou e oferece duas opções de dia, o que facilita o sim.',
    },
  },
}

export function getScenario(tab: AssistantTab, goal: Goal): DemoScenario {
  return DEMO_SCENARIOS[tab][goal]
}

/**
 * Verdadeiro só quando a entrada é exatamente o exemplo da aba e do objetivo atuais.
 * Qualquer edição, print ou outra combinação conta como entrada própria, que nunca recebe leitura.
 */
export function isUsingExample(draft: AssistantDraft): boolean {
  const scenario = getScenario(draft.tab, draft.goal)
  return draft.mode === 'text' && draft.text.trim() === scenario.text && draft.context.trim() === scenario.context
}

export interface DemoRequest {
  tab: AssistantTab
  goal: Goal
  source: 'example' | 'own-image' | 'own-text'
}

export function toDemoRequest(draft: AssistantDraft): DemoRequest {
  const source = isUsingExample(draft) ? 'example' : draft.mode === 'image' ? 'own-image' : 'own-text'
  return { tab: draft.tab, goal: draft.goal, source }
}
