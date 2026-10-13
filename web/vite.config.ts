import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Política de privacidade aplicada no build: a página não pode abrir conexões
// de rede nem enviar formulários. Garante que prints e textos nunca saiam do
// navegador. Só no build porque o servidor de dev precisa de WebSocket (HMR).
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "connect-src 'none'",
  "form-action 'none'",
  "object-src 'none'",
  "base-uri 'none'",
].join('; ')

function contentSecurityPolicy(): Plugin {
  return {
    name: 'robo-csp',
    apply: 'build',
    transformIndexHtml: () => [
      { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' },
    ],
  }
}

export default defineConfig({
  plugins: [react(), contentSecurityPolicy()],
})
