# Robô de Date · Web

Frontend inicial do Robô de Date. Vite + React + TypeScript, sem backend.

```bash
cd web
npm install
npm run dev        # http://localhost:5173
npm test           # testes de validação de upload
npm run build      # typecheck + build em dist/
```

## O que existe

Navegação no padrão iOS: tab bar flutuante com três abas principais (ícone ao lado do nome), cada uma lembrando
onde o usuário estava; tocar na aba ativa volta ao início dela.

- **Assistente** (inclui a entrada para Modos especiais), **Robô de Match** e **Fotos de Impacto** são as abas.
- **Minhas conversas** (com as preferências) abre pelo botão no canto do cabeçalho, com contador de conversas salvas
  e "Voltar" para a tela de origem.
- **Onboarding de navegação** no primeiro acesso: boas-vindas (as 3 abas, com aviso de demonstração) e tour de 5
  passos que destaca os elementos reais (abas, Modos especiais e Minhas conversas), com Voltar/Próximo, Pular, Esc e
  foco preso no diálogo. "Rever apresentação" fica em Minhas conversas. Sem login nem armazenamento, "primeiro
  acesso" é a primeira abertura da página na sessão (recarregar mostra de novo); com login, trocar `isFirstVisit`
  (`src/lib/store.ts`) por um campo do usuário. Textos do tour em `src/lib/onboarding.ts`.
- **Confirmação de idade (18+)** nas boas-vindas: sem marcar "Tenho 18 anos ou mais", nem os botões nem o Esc
  fecham a tela; "Tenho menos de 18 anos" bloqueia o app na sessão. É autodeclaração e vale só na sessão
  (`ageConfirmed` no store); com login, guardar a confirmação com data no cadastro. Os modos adultos continuam
  pedindo a confirmação de que as duas pessoas são maiores.
- **Privacidade, Termos de uso e Contato** (`src/components/LegalSheet.tsx`, textos em `src/data/legal.ts`): folha
  aberta pelo rodapé e pelas boas-vindas. São **rascunhos marcados "Versão preliminar, em revisão jurídica"** e
  descrevem só o que esta versão faz (nada enviado, nada guardado). Dados da empresa ficam "a definir" até haver
  o dado real; nunca preencher com valores inventados. Revisar os textos antes de conectar IA, login, pagamento
  ou analytics.

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
    só em memória e alterável a qualquer momento.
  - **Áudio** (terceira forma de entrada): gravar só após clique em "Gravar" ou enviar arquivo (MP3, M4A, OGG,
    OPUS, WAV, WEBM). Timer, parar, cancelar, reproduzir e remover. Limite de 3 minutos de gravação (para sozinho)
    e 10 MB por arquivo. O microfone é liberado ao parar, cancelar, trocar de entrada/seção ou sair da página.
    Microfone negado ou indisponível oferece arquivo ou texto.
  - O áudio nunca é transcrito: aparece "a transcrição será conectada depois". Em Responder conversa, "Usar exemplo"
    no modo Áudio carrega um **exemplo identificado** (transcrição fictícia e editável, sem áudio real), que
    substitui o áudio próprio em vez de ficar ao lado dele.
  - "Ferramentas de teste" (rodapé) simula um erro na próxima geração, para testar o "Tentar novamente". Só
    aparece em desenvolvimento (`npm run dev`) ou com `?ferramentas` na URL; o build de produção não a mostra.
  - O resultado atual de cada área continua ao navegar entre seções; histórico só existe ao salvar.
  - O rascunho é compartilhado entre as abas e sobrevive à troca de seção.
- **Modos especiais** (todos liberados), com formulário curto e os mesmos cards de resultado, cada um com
  exemplos próprios (`src/lib/modes.ts`):
  - **Date Rápido**: contexto e disponibilidade.
  - **Pós-Date**: caminhos Casual, Buscar namoro e Tentar segundo encontro, cada um com seu exemplo.
  - **Protocolo Nudes**: comunicação consensual entre adultos; sem upload de imagens; confirmação de maioridade.
  - **Sexo Express**: interesse em intimidade de forma não gráfica, com espaço explícito para recusa; confirmação de
    maioridade.
- **Fotos de Impacto**: galeria de prompts para criar fotos de perfil no gerador de imagens do usuário (ChatGPT,
  Gemini etc.), com filtro por categoria e botão Copiar. O app não gera nem recebe fotos. Para trocar os prompts,
  edite `src/data/photoPrompts.ts` (campo opcional `image` para ilustrar cada card com um arquivo de `public/`).
- **Robô de Match**: otimização de perfil (app, sobre você, bio atual e até 6 fotos do perfil, que ficam só no
  navegador) com três bios nos mesmos cards de resultado, ajustes, explicações, acompanhamento e salvar/continuar.
  - **Força do perfil (0–100%)**: média ponderada de Fotos (50%), Bio (30%) e Perfil completo (20%), com a nota de
    hoje, o ganho com as sugestões e a revisão foto a foto (Manter / Mover / Trocar). Só aparece para o perfil de
    exemplo (fotos fictícias, descritas em texto); um perfil próprio não recebe nota inventada e vê que a análise
    será conectada depois. Exemplo local em `src/data/matchExample.ts`; cálculo em `src/lib/profile.ts`.
- **Minhas conversas** (histórico temporário, só em memória): "Salvar conversa" no resultado registra nome, modo,
  objetivo, contexto, sugestões (com a versão escolhida em cada card) e acompanhamento, sem arquivos de print ou
  áudio. Salvar de novo atualiza a mesma conversa. Dá para buscar pelo nome, abrir e continuar, renomear e excluir
  (com confirmação). Gerar sem salvar não cria histórico.
- **Preferências** opcionais (em Minhas conversas): tom padrão (Leve, Confiante, Ousado) vem primeiro nos resultados;
  explicação Curta (só o essencial) ou Detalhada (acrescenta o próximo passo). Valem até recarregar.

## Exemplos e integração futura

Os exemplos da demonstração são só dados, em `src/data/` (sem componentes nem lógica):

- `assistantScenarios.ts`: 12 cenários do Assistente (aba × objetivo), com cards, variantes e acompanhamento.
- `modeExamples.ts`: exemplos dos Modos especiais (formulário + resultado).
- `audioExample.ts`: transcrição fictícia do exemplo de áudio identificado.
- `matchExample.ts`: perfil de exemplo e as três bios do Robô de Match.
- `photoPrompts.ts`: prompts da galeria Fotos de Impacto (hoje, exemplos marcados como tal).
- `types.ts`: o formato (`DemoContent`) que qualquer fonte de sugestões deve devolver.

Pontos onde uma integração real entraria (nenhum endpoint existe hoje):

- `toDemoRequest` / `toModeRequest` (`src/lib/demo.ts`, `src/lib/modes.ts`): hoje escolhem um exemplo pela
  aba/objetivo/modo, sem ler a entrada. Uma fonte real geraria `DemoContent` a partir da entrada.
- `useDemoGeneration` (`src/lib/useDemoGeneration.ts`): hoje simula 1,4 s de carregamento; seria a chamada real.
- `answerFor` (`src/lib/followup.ts`): hoje só responde aos atalhos; perguntas livres seriam conectadas aqui.
- Transcrição de áudio, leitura de print e análise das fotos/nota do perfil: hoje não existem (a interface diz que
  serão conectadas depois).

## Estado e privacidade

Todo o estado (navegação, rascunhos, resultados, conversas salvas, preferências e feedback) vive num store em
memória (`src/lib/store.ts`). Não há login, banco, `localStorage`, `sessionStorage`, IndexedDB nem cookies:
recarregar a página apaga tudo.

Nenhum arquivo sai do navegador: o preview usa `URL.createObjectURL` e não há chamadas de rede.
O áudio gravado ou enviado vira um `blob:` local só para reprodução.
O build injeta uma Content-Security-Policy com `connect-src 'none'`, `form-action 'none'` e `media-src 'self' blob:`
(ver `vite.config.ts`), então mesmo um envio acidental seria bloqueado pelo navegador.

O build também gera `dist/_headers` (formato de Netlify e Cloudflare Pages) com os cabeçalhos de segurança de
produção: a mesma CSP mais `frame-ancestors 'none'`, HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options:
DENY`, `Referrer-Policy: no-referrer` e `Permissions-Policy` (microfone só no próprio app; câmera, localização e
pagamento bloqueados). `npm run preview` serve o build com esses cabeçalhos. Em outro host (Vercel, nginx, S3 +
CloudFront), configurar os mesmos valores de `SECURITY_HEADERS` em `vite.config.ts`. Ao conectar uma API de IA,
liberar o domínio dela em `connect-src` (e só ele).
