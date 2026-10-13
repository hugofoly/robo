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
  - "Gerar sugestões" fica desabilitado sem entrada válida.
  - **Demonstração local** (`src/lib/demo.ts`): 12 cenários fictícios escritos à mão, um por aba × objetivo.
    "Usar exemplo" preenche o cenário; ao gerar, há um carregamento simulado e depois a leitura do cenário,
    três mensagens (Leve, Confiante, Ousada), uma recomendada com o motivo e Copiar em cada card.
  - Entrada própria (print ou texto editado) nunca recebe leitura: o resultado avisa que ela não foi analisada
    e mostra o cenário de exemplo.
  - Copiar usa o texto visível do card; se a área de transferência falhar, o texto fica selecionado para cópia manual.
  - "Ferramentas de teste" (rodapé) simula um erro na próxima geração, para testar o "Tentar novamente".
  - Gerar não cria histórico: o resultado some ao sair do Assistente e nada vai para o storage.
  - O rascunho é compartilhado entre as abas e sobrevive à troca de seção.
- **Modos especiais** e **Minhas conversas**: estados vazios explicando o que virá.

## Privacidade

Nenhum arquivo sai do navegador: o preview usa `URL.createObjectURL` e não há chamadas de rede.
O build injeta uma Content-Security-Policy com `connect-src 'none'` e `form-action 'none'`
(ver `vite.config.ts`), então mesmo um envio acidental seria bloqueado pelo navegador.
