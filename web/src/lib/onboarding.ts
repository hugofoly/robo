/** Passos do tour de navegação: elemento destacado (seletor CSS), título e texto. */
export interface TourStep {
  target: string
  title: string
  body: string
}

export const TOUR_STEPS: TourStep[] = [
  {
    target: '.app-nav .nav-item[aria-label="Assistente"]',
    title: 'Assistente',
    body: 'Mande um print, texto ou áudio da conversa e receba três sugestões de resposta, com explicação.',
  },
  {
    target: '.entry-row',
    title: 'Modos especiais',
    body: 'Fluxos prontos para momentos específicos: Date Rápido, Pós-Date, Protocolo Nudes e Sexo Express.',
  },
  {
    target: '.app-nav .nav-item[aria-label="Robô de Match"]',
    title: 'Robô de Match',
    body: 'Envie sua bio e suas fotos para receber bios novas, a revisão das fotos e a força do seu perfil.',
  },
  {
    target: '.app-nav .nav-item[aria-label="Fotos de Impacto"]',
    title: 'Fotos de Impacto',
    body: 'Prompts prontos para criar fotos de perfil no gerador de imagens que você já usa.',
  },
  {
    target: '.header-action',
    title: 'Minhas conversas',
    body: 'As conversas que você salvar e as suas preferências ficam aqui, no canto do cabeçalho.',
  },
]
