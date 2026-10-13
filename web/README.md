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
  - Cada card tem **Ajustar** (Mais curto, Mais natural, Mais provocativo, Menos ousado, Outra opção), com
    variantes escritas à mão. O ajuste muda só aquele card, e Copiar usa a versão exibida.
  - **Por que usar esta?** mostra a intenção da mensagem e o próximo passo, específicos do cenário.
  - **Pergunte ou conte o que aconteceu**: os atalhos (Por que essa resposta?, O que faço depois?, Ela respondeu isso.)
    têm respostas preparadas por cenário. Qualquer outro texto recebe "a resposta real será conectada depois", sem
    interpretação (`src/lib/followup.ts` só reconhece o texto exato dos atalhos).
  - Feedback **Usaria / Não usaria** com motivos (Genérica, Exagerada, Não parece comigo), por card e por versão,
    guardado só no `sessionStorage` da aba e alterável a qualquer momento.
  - **Áudio** (terceira forma de entrada): gravar só após clique em "Gravar" ou enviar arquivo (MP3, M4A, OGG,
    OPUS, WAV, WEBM). Timer, parar, cancelar, reproduzir e remover. Limite de 3 minutos de gravação (para sozinho)
    e 10 MB por arquivo. O microfone é liberado ao parar, cancelar, trocar de entrada/seção ou sair da página.
    Microfone negado ou indisponível oferece arquivo ou texto.
  - O áudio nunca é transcrito: aparece "a transcrição será conectada depois". Em Responder conversa, "Usar exemplo"
    no modo Áudio carrega um **exemplo identificado** (transcrição fictícia e editável, sem áudio real), que
    substitui o áudio próprio em vez de ficar ao lado dele.
  - "Ferramentas de teste" (rodapé) simula um erro na próxima geração, para testar o "Tentar novamente".
  - Gerar não cria histórico: o resultado e a conversa somem ao sair do Assistente ou gerar de novo.
  - O rascunho é compartilhado entre as abas e sobrevive à troca de seção.
- **Modos especiais** (todos liberados no Beta), com formulário curto e os mesmos cards de resultado, cada um com
  exemplos próprios (`src/lib/modes.ts`):
  - **Date Rápido**: contexto e disponibilidade.
  - **Pós-Date**: caminhos Casual, Buscar namoro e Tentar segundo encontro, cada um com seu exemplo.
  - **Protocolo Nudes**: comunicação consensual entre adultos; sem upload de imagens; confirmação de maioridade.
  - **Sexo Express**: interesse em intimidade de forma não gráfica, com espaço explícito para recusa; confirmação de
    maioridade.
- **Minhas conversas**: estado vazio explicando o que virá.

## Privacidade

Nenhum arquivo sai do navegador: o preview usa `URL.createObjectURL` e não há chamadas de rede.
O áudio gravado ou enviado vira um `blob:` local só para reprodução.
O build injeta uma Content-Security-Policy com `connect-src 'none'`, `form-action 'none'` e `media-src 'self' blob:`
(ver `vite.config.ts`), então mesmo um envio acidental seria bloqueado pelo navegador.
