import { card, type DemoContent } from './types'

/** Exemplo fictício do Robô de Match: valores do formulário e resultado (três bios). */
export const MATCH_EXAMPLE: { values: Record<string, string>; content: DemoContent } = {
  values: {
    app: 'Tinder',
    about:
      'Lucas, 29 anos, engenheiro de software. Corro meia maratona, cozinho risoto aos domingos, tenho um gato chamado Pixel e viajo de mochila uma vez por ano.',
    bio: 'Engenheiro, 1,80, gosto de viajar e sair com os amigos.',
  },
  content: {
    summary: 'Perfil do Lucas: bio genérica, mas com ótimos ganchos (corrida, risoto e o gato Pixel).',
    reading:
      'A bio atual lista fatos que aparecem em milhares de perfis (profissão, altura, "gosto de viajar") e não dá assunto para ninguém começar a conversa. Os melhores ganchos estão nos detalhes: a meia maratona, o risoto de domingo e o gato Pixel.',
    cards: {
      light: card(
        'Corro meia maratona só pra justificar o risoto de domingo. O Pixel, meu gato, acha que a casa precisa de mais visitas.',
        'Mostrar personalidade com humor e entregar dois assuntos fáceis de puxar.',
        'Use como primeira foto uma em que você aparece sorrindo e deixe uma foto com o Pixel entre as três primeiras.',
        [
          'Corro pra justificar o risoto de domingo. O Pixel aprova visitas.',
          'Corro meia maratona basicamente pra poder comer risoto no domingo haha. E tenho um gato, o Pixel, que adora visita',
          'Corro meia maratona pra justificar o risoto de domingo. Se você gostar de risoto, o Pixel já liberou o convite.',
          'Gosto de correr, de cozinhar no domingo e tenho um gato chamado Pixel. Sempre aberto a indicações de viagem.',
          'Meia maratona no sábado, risoto no domingo, viagem de mochila uma vez por ano. Me conta qual foi a sua última.',
        ],
      ),
      confident: card(
        'Engenheiro de software que troca o teclado por uma meia maratona no fim de semana. Faço um risoto que merece segunda opinião. Me conta qual foi a última viagem que você fez de mochila.',
        'Juntar profissão, rotina e um convite à conversa, terminando com uma pergunta.',
        'Mantenha a pergunta no fim: ela dá um motivo pronto para a outra pessoa mandar a primeira mensagem.',
        [
          'Engenheiro, corredor de meia maratona e cozinheiro de risoto. Qual foi sua última viagem de mochila?',
          'Engenheiro de software, corro meia maratona e faço um risoto bem decente aos domingos haha. Qual foi sua última viagem de mochila?',
          'Engenheiro de software, corredor nas horas vagas e dono de um risoto que aceita contestação só ao vivo. Qual foi sua última viagem de mochila?',
          'Trabalho com tecnologia, gosto de correr e de cozinhar com calma no domingo. Adoro trocar dicas de viagem.',
          'Meu fim de semana ideal: correr de manhã, risoto à noite e o Pixel no sofá. O que não pode faltar no seu?',
        ],
      ),
      bold: card(
        'Aviso: o risoto é bom, a corrida é sagrada e o Pixel julga todo mundo que entra em casa. Acha que passa no teste?',
        'Criar um desafio leve que provoca resposta e mostra confiança.',
        'Funciona melhor com fotos que confirmem o texto: uma correndo, uma cozinhando ou com o gato.',
        [
          'O risoto é bom, a corrida é sagrada e o Pixel julga. Passa no teste?',
          'Já aviso: o risoto é bom, a corrida é sagrada e o Pixel julga todo mundo haha. Acha que passa?',
          'O risoto é bom, a corrida é sagrada e o Pixel é exigente. Se você passar no teste dele, o jantar é por minha conta.',
          'Faço um risoto bom, corro aos sábados e tenho um gato curioso. Acho que a gente ia se dar bem.',
          'Procuro alguém pra dividir o risoto de domingo e discutir com o Pixel quem manda em casa.',
        ],
      ),
    },
    recommended: 'confident',
    reason: 'Troca fatos genéricos por detalhes concretos e termina com uma pergunta, o que facilita a primeira mensagem.',
    followUps: {
      why: 'A recomendada (Confiante) troca o que todo perfil tem (profissão solta, altura, "gosto de viajar") por detalhes que só você tem e fecha com uma pergunta. Isso dá à outra pessoa um motivo pronto para escrever primeiro.',
      next: 'Atualize a bio e depois revise as fotos: rosto bem iluminado na primeira, uma de corpo inteiro e uma fazendo algo que a bio cita (correndo, cozinhando ou com o Pixel). Em Fotos de Impacto há prompts para montar essas fotos.',
    },
  },
}
