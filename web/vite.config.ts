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
  "media-src 'self' blob:",
  "font-src 'self'",
  "connect-src 'none'",
  "form-action 'none'",
  "object-src 'none'",
  "base-uri 'none'",
].join('; ')

// Cabeçalhos HTTP de produção. A meta tag acima não cobre tudo: `frame-ancestors` (impede o app de ser
// embutido em outro site), HSTS e Permissions-Policy só valem como cabeçalho do servidor.
const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': `${CSP}; frame-ancestors 'none'`,
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  // Só o próprio app pode pedir o microfone (gravação de áudio); câmera, localização e pagamento ficam bloqueados.
  'Permissions-Policy': 'microphone=(self), camera=(), geolocation=(), payment=(), usb=()',
}

function contentSecurityPolicy(): Plugin {
  return {
    name: 'robo-csp',
    apply: 'build',
    transformIndexHtml: () => [
      { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' },
    ],
    // `dist/_headers`: formato lido por Netlify e Cloudflare Pages. Em outro host, configurar os mesmos valores.
    generateBundle() {
      const lines = Object.entries(SECURITY_HEADERS).map(([k, v]) => `  ${k}: ${v}`)
      this.emitFile({ type: 'asset', fileName: '_headers', source: ['/*', ...lines, ''].join('\n') })
    },
  }
}

export default defineConfig({
  plugins: [react(), contentSecurityPolicy()],
  // `npm run preview` serve o build com os mesmos cabeçalhos de produção, para testar localmente.
  preview: { headers: SECURITY_HEADERS },
})
