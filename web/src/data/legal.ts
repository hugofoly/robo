/**
 * Textos legais (rascunho). Descrevem o que esta versão do app faz de fato: tudo roda no navegador,
 * nada é enviado nem guardado. Precisam de revisão jurídica antes do lançamento comercial, e de nova
 * revisão antes de conectar IA, login, pagamento ou analytics.
 *
 * Dados da empresa: nunca inventar. Enquanto não houver o dado real, fica `A_DEFINIR`.
 */

export const A_DEFINIR = 'a definir'

export const COMPANY = {
  brand: 'Robô de Date',
  legalName: A_DEFINIR,
  cnpj: A_DEFINIR,
  address: A_DEFINIR,
  email: A_DEFINIR,
  /** Encarregado pelo tratamento de dados pessoais (LGPD, art. 41). */
  dpo: A_DEFINIR,
}

export const LEGAL_DRAFT_NOTICE = 'Versão preliminar, em revisão jurídica.'
export const LEGAL_UPDATED_AT = '14 de outubro de 2026'

export type LegalPageId = 'privacy' | 'terms' | 'contact'

export interface LegalSection {
  title: string
  paragraphs: string[]
}

export interface LegalPage {
  id: LegalPageId
  title: string
  /** Rótulo curto para links e para o seletor entre páginas. */
  short: string
  sections: LegalSection[]
}

export const LEGAL_PAGES: LegalPage[] = [
  {
    id: 'privacy',
    title: 'Política de privacidade',
    short: 'Privacidade',
    sections: [
      {
        title: 'Resumo',
        paragraphs: [
          'Nesta versão, o Robô de Date funciona só no seu navegador. Prints, textos, áudios e fotos que você usa ficam no seu aparelho: não são enviados a servidores nem a serviços de inteligência artificial, e não são guardados por nós.',
          'As respostas são exemplos prontos de demonstração. Elas não analisam o conteúdo que você envia.',
        ],
      },
      {
        title: 'O que fica no seu aparelho, e por quanto tempo',
        paragraphs: [
          'Conversas salvas, preferências e avaliações de respostas ficam só na memória da página aberta e são apagadas ao recarregar ou fechar a página.',
          'Prints, áudios e fotos nunca são guardados em Minhas conversas: ao salvar, fica só o texto e a quantidade de fotos.',
          'Não usamos cookies, armazenamento do navegador (como localStorage), ferramentas de analytics ou rastreadores.',
        ],
      },
      {
        title: 'Microfone',
        paragraphs: [
          'O microfone só é ligado quando você toca em gravar e é liberado ao parar, cancelar ou sair da tela. A gravação fica no seu aparelho e não é transcrita: a transcrição exibida no exemplo é fictícia.',
        ],
      },
      {
        title: 'Dados de outras pessoas',
        paragraphs: [
          'Prints e conversas costumam ter dados de outras pessoas (nome, foto, telefone, o que ela escreveu). Use só o necessário para a sua dúvida e, quando der, esconda nomes, rostos e contatos antes de enviar.',
          'Nunca envie imagens íntimas, suas ou de outra pessoa.',
        ],
      },
      {
        title: 'Quando a inteligência artificial for conectada',
        paragraphs: [
          'Antes de qualquer envio de dados para fora do seu navegador, esta política será revista para dizer, de forma clara: quais dados são enviados, para qual fornecedor e país, com que finalidade e base legal, por quanto tempo ficam guardados e como você pode pedir a exclusão.',
        ],
      },
      {
        title: 'Seus direitos',
        paragraphs: [
          'Pela Lei Geral de Proteção de Dados (LGPD, art. 18), você pode pedir confirmação de tratamento, acesso, correção, anonimização, portabilidade e exclusão dos seus dados, entre outros direitos.',
          `Nesta versão não guardamos dados seus. Para dúvidas, fale com a gente pelo e-mail de contato (${COMPANY.email}). Encarregado pelo tratamento de dados: ${COMPANY.dpo}.`,
        ],
      },
      {
        title: 'Idade mínima',
        paragraphs: ['O Robô de Date é só para maiores de 18 anos.'],
      },
    ],
  },
  {
    id: 'terms',
    title: 'Termos de uso',
    short: 'Termos',
    sections: [
      {
        title: 'O que é esta versão',
        paragraphs: [
          'Esta é uma versão de demonstração. As respostas, a nota do perfil e as dicas são exemplos prontos e não analisam o conteúdo que você envia.',
          'Esta versão não tem cobrança nem pagamento.',
        ],
      },
      {
        title: 'Quem pode usar',
        paragraphs: ['Só maiores de 18 anos. Ao confirmar a idade nas boas-vindas, você declara ter 18 anos ou mais.'],
      },
      {
        title: 'Uso responsável',
        paragraphs: [
          'As sugestões servem para conversar melhor, não para pressionar, enganar, assediar ou expor ninguém.',
          'Interesse e consentimento precisam ser claros dos dois lados. Um não, uma hesitação ou o silêncio encerram o assunto.',
          'Não envie nem compartilhe conteúdo íntimo de outra pessoa, e não use o app em conversas com menores de 18 anos.',
        ],
      },
      {
        title: 'Conteúdo que você usa',
        paragraphs: [
          'Você é responsável pelos prints, textos, áudios e fotos que usa no app, e por ter o direito de usá-los.',
          'Em Fotos de Impacto, os prompts são para usar no gerador de imagens de sua escolha, com fotos suas. As fotos do perfil devem representar você de verdade. Confira as regras de cada app de relacionamento sobre fotos editadas ou geradas por IA antes de usá-las.',
        ],
      },
      {
        title: 'Sem garantia de resultado',
        paragraphs: [
          'Nenhuma sugestão garante resposta, match ou encontro. A decisão do que enviar, e como, é sempre sua.',
        ],
      },
      {
        title: 'Mudanças e lei aplicável',
        paragraphs: [
          'Estes termos podem mudar, por exemplo, quando a inteligência artificial, contas ou planos pagos forem lançados. Mudanças relevantes serão avisadas no app antes de valerem.',
          'Vale a lei brasileira, inclusive o Código de Defesa do Consumidor.',
        ],
      },
    ],
  },
  {
    id: 'contact',
    title: 'Contato e empresa',
    short: 'Contato',
    sections: [
      {
        title: 'Quem somos',
        paragraphs: [
          `Marca: ${COMPANY.brand}.`,
          `Razão social: ${COMPANY.legalName}.`,
          `CNPJ: ${COMPANY.cnpj}.`,
          `Endereço: ${COMPANY.address}.`,
        ],
      },
      {
        title: 'Atendimento',
        paragraphs: [
          `E-mail: ${COMPANY.email}.`,
          `Encarregado pelo tratamento de dados (LGPD): ${COMPANY.dpo}.`,
        ],
      },
    ],
  },
]

export function getLegalPage(id: LegalPageId): LegalPage {
  return LEGAL_PAGES.find((p) => p.id === id)!
}
