/**
 * Prompts da galeria Fotos de Impacto. Só dados: para trocar pelos prompts oficiais, edite esta lista.
 *
 * - `example: true` marca um prompt de exemplo (a galeria avisa enquanto houver algum).
 * - `image` é opcional: caminho de uma imagem em `web/public/` (ex.: '/fotos/retrato.jpg') para ilustrar o card.
 */

export const PHOTO_CATEGORIES = ['Foto principal', 'Estilo de vida', 'Viagem', 'Esporte', 'Social', 'Noite'] as const
export type PhotoCategory = (typeof PHOTO_CATEGORIES)[number]

export interface PhotoPrompt {
  id: string
  title: string
  category: PhotoCategory
  /** Uma linha: para que serve a foto no perfil. */
  description: string
  prompt: string
  image?: string
  example?: boolean
}

const KEEP_FACE =
  'Use a foto anexada como referência e mantenha meu rosto, traços, tom de pele, cabelo e corpo exatamente como são.'

export const PHOTO_PROMPTS: PhotoPrompt[] = [
  {
    id: 'retrato-luz-natural',
    title: 'Retrato com luz natural',
    category: 'Foto principal',
    description: 'A primeira foto: rosto nítido, sorriso real e fundo limpo.',
    prompt: `${KEEP_FACE} Crie um retrato da cintura para cima, ao ar livre no fim da tarde, com luz suave vindo de lado e fundo desfocado de uma rua arborizada. Sorriso natural, olhando para a câmera, camiseta lisa de cor neutra. Estilo foto de celular de boa qualidade, sem filtros exagerados, proporção 4:5.`,
    example: true,
  },
  {
    id: 'cozinhando-em-casa',
    title: 'Cozinhando em casa',
    category: 'Estilo de vida',
    description: 'Mostra rotina e dá assunto para a conversa.',
    prompt: `${KEEP_FACE} Mostre-me preparando uma receita numa cozinha clara e organizada, rindo enquanto mexo a panela, com luz da janela. Foto espontânea, como se um amigo tivesse tirado, enquadramento de meio corpo, proporção 4:5.`,
    example: true,
  },
  {
    id: 'mirante-viagem',
    title: 'Mirante na viagem',
    category: 'Viagem',
    description: 'Corpo inteiro e paisagem: mostra estilo e aventura.',
    prompt: `${KEEP_FACE} Coloque-me de corpo inteiro em um mirante com montanhas ao fundo, de mochila, olhando para a câmera com um sorriso leve. Céu limpo, cores naturais, luz da manhã, proporção 4:5.`,
    example: true,
  },
  {
    id: 'depois-da-corrida',
    title: 'Depois da corrida',
    category: 'Esporte',
    description: 'Hábito saudável sem parecer pose de academia.',
    prompt: `${KEEP_FACE} Mostre-me em um parque logo depois de correr, com roupa de corrida, expressão tranquila e confiante, luz da manhã e árvores desfocadas ao fundo. Enquadramento de meio corpo, aparência natural, proporção 4:5.`,
    example: true,
  },
  {
    id: 'mesa-com-amigos',
    title: 'Com amigos, você em destaque',
    category: 'Social',
    description: 'Prova social sem deixar dúvida de quem é você.',
    prompt: `${KEEP_FACE} Coloque-me no centro e em foco numa mesa de bar ao ar livre com amigos ao redor, desfocados, todos rindo. Luz quente de fim de tarde, clima descontraído, proporção 4:5.`,
    example: true,
  },
  {
    id: 'look-para-sair',
    title: 'Look para sair',
    category: 'Noite',
    description: 'Uma foto mais arrumada para equilibrar o perfil.',
    prompt: `${KEEP_FACE} Mostre-me de pé numa rua à noite, com luzes da cidade desfocadas ao fundo, vestindo camisa ou jaqueta escura. Enquadramento de meio corpo, luz de vitrine iluminando o rosto, expressão tranquila, proporção 4:5.`,
    example: true,
  },
]
