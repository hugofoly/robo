/**
 * Exemplos locais da demonstração, separados dos componentes.
 *
 * Ponto de integração futura: hoje `toDemoRequest`/`toModeRequest` (src/lib) escolhem um destes exemplos
 * pela aba/objetivo/modo, sem ler a entrada do usuário. Uma fonte real (IA, transcrição, OCR) deve
 * devolver conteúdo no formato de `DemoContent` (./types) a partir da entrada, e a interface continua igual.
 */
export * from './types'
export { DEMO_SCENARIOS } from './assistantScenarios'
export { AUDIO_EXAMPLE } from './audioExample'
export { EXPRESS, NUDES, POST_DATE, QUICK_DATE } from './modeExamples'
