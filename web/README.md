# Robô de Date · Web (Beta)

Frontend inicial do Robô de Date. Vite + React + TypeScript, sem backend.

```bash
cd web
npm install
npm run dev        # http://localhost:5173
npm test           # testes de validação de upload
npm run build      # typecheck + build em dist/
```

## O que existe

- **Assistente** (tela inicial) com as abas Responder conversa, Puxar assunto e Responder story.
  - Entrada por print (PNG/JPEG/WebP até 10 MB, com preview local, trocar e remover; aceita arrastar e colar) ou por texto.
  - Contexto opcional e objetivo (Continuar o papo, Flertar, Retomar contato, Chamar para sair).
  - "Gerar sugestões" fica desabilitado sem entrada válida; o clique só avisa que a demonstração vem depois.
  - O rascunho é compartilhado entre as abas e sobrevive à troca de seção.
- **Modos especiais** e **Minhas conversas**: estados vazios explicando o que virá.

## Privacidade

Nenhum arquivo sai do navegador: o preview usa `URL.createObjectURL` e não há chamadas de rede.
O build injeta uma Content-Security-Policy com `connect-src 'none'` e `form-action 'none'`
(ver `vite.config.ts`), então mesmo um envio acidental seria bloqueado pelo navegador.
