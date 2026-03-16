# Cloud Gaming React Client Design

## Goal
Criar um client React dedicado para o produto de cloud gaming em `clients/web/cloud-gaming`, substituindo a UI estática embutida no backend Go como interface principal do `dev v1`.

## Context
O backend Go atual já entrega o contrato mínimo do hub (`/api/hub`, `/api/sessions/start`, `/api/sessions/stop`) e orquestra catálogo, sessão única e provider `sunshine`. A UI atual servida pelo backend foi útil para validar rapidamente o `dev v1`, mas não é uma base boa de produto: ela acopla frontend e backend, dificulta evolução visual e não conversa bem com a linguagem do portal já existente.

Também está decidido que a autenticação final do produto fica no perímetro, via `oauth2-proxy + Keycloak`, publicada apenas no `npm-nonprod`. O client não vai implementar login próprio com `keycloak-js`; ele consumirá a API já protegida pelo proxy. Sem sessão válida no Keycloak, o usuário não entra.

## Recommended Approach
Criar um app React/Vite separado, reaproveitando o stack técnico e a base visual do `digao-oauth-portal`, mas com identidade própria de gaming. O backend Go permanece como API pura de catálogo/sessão/orquestração. A UI estática atual do backend fica congelada temporariamente como fallback técnico, mas deixa de ser a frente principal.

Essa abordagem entrega uma base de produto melhor sem inventar backend novo agora. Ela também prepara o caminho para fases futuras, como browser play, sem obrigar reescrever a camada de sessão.

## Alternatives Considered

### 1. Continuar evoluindo a UI estática do Go
Mais rápido no curtíssimo prazo, mas tecnicamente pior para produto. Mantém o acoplamento, trava a evolução da UX e dificulta alinhar visualmente com o ecossistema atual.

### 2. Incorporar o cloud gaming como uma área do portal existente
Melhora consistência visual, mas mistura dois produtos com objetivos diferentes cedo demais. O cloud gaming precisa de uma identidade própria, mesmo mantendo a linguagem dos Sistemas do Digao.

## Architecture

### Frontend
Criar `clients/web/cloud-gaming` com:
- React
- Vite
- Tailwind
- React Query

O app vai consumir:
- `GET /api/hub`
- `POST /api/sessions/start`
- `POST /api/sessions/stop`

Sem `keycloak-js` no client. O frontend assume que a autenticação já foi resolvida pelo perímetro.

### Backend
O backend Go continua responsável por:
- catálogo
- sessão ativa
- limite de concorrência
- launcher/orquestração
- provider de stream

Mudanças no backend devem ser mínimas e restritas ao que o novo frontend realmente precisar. O contrato atual já é suficiente para a primeira versão do client React.

### Delivery topology
A entrada oficial do produto passa a ser o domínio do `cloud gaming` no `npm-nonprod`, com:
- `NPM`
- `oauth2-proxy`
- `Keycloak`
- `cloud-gaming-web`
- backend Go interno

A porta crua `:8090` deixa de ser a entrada principal. Pode existir como fallback técnico interno durante transição, mas não como UX oficial.

## Product UX
O client React deve manter a paleta e a sensação de “Sistema do Digao”, mas com direção mais gaming.

### Visual language
- mesma família cromática do portal
- mesma disciplina visual base
- layout mais orientado a biblioteca e sessão
- cards maiores
- destaque para jogo ativo
- hero com status do host/sessão

### Sections in v1
- hero principal com estado da sessão atual
- biblioteca de jogos
- cards com:
  - nome
  - descrição
  - plataforma
  - provider
  - ação principal
- área de status com:
  - usuário autenticado
  - capacidade disponível
  - sessão ativa
- seções leves de produto:
  - `Biblioteca`
  - `Recentes` (somente local no client)
  - `Disponíveis agora`

### Explicit non-goals in this iteration
- browser play
- favoritos persistidos
- feed/social
- catálogo automático novo
- login no próprio client

## Streaming UX
O client deve deixar explícito que o jogo não roda no navegador nesta fase.

Quando a sessão estiver ativa, a UI deve mostrar:
- jogo ativo
- provider `Sunshine`
- host pronto
- bloco `Como jogar agora`

Esse bloco deve orientar o usuário a:
1. iniciar a sessão no hub
2. abrir o Moonlight no dispositivo cliente
3. conectar ao host Sunshine

Isso torna o produto honesto e funcional, sem prometer browser play antes da hora.

## Data Flow

### Initial load
- frontend chama `/api/hub`
- se autenticado, renderiza catálogo, usuário, limites e sessão
- se `401/403`, considera sessão inválida/expirada e depende do fluxo do proxy

### Start session
- `POST /api/sessions/start`
- atualiza estado local
- hero passa a destacar a sessão ativa
- recentes são atualizados no `localStorage`

### Stop session
- `POST /api/sessions/stop`
- limpa estado local da sessão
- mantém recentes locais

### Recentes
Sem backend novo nesta fase. Ficam no `localStorage` do client.

## Security
- acesso principal apenas por `npm-nonprod`
- autenticação obrigatória via `oauth2-proxy + Keycloak`
- sem sessão válida, sem acesso ao client e sem uso oficial da API
- o client React não armazena token OIDC nem implementa fluxo de login próprio

## Testing Strategy
- build do client React
- testes mínimos de render/estado para hub e sessão
- verificação de consumo do contrato atual do backend
- validação manual do fluxo protegido no domínio do dev
- validação manual de start/stop de sessão com o backend atual

## Rollout
1. Criar `clients/web/cloud-gaming`
2. Fazer o app consumir a API atual
3. Subir o client no `npm-nonprod`
4. Proteger a rota com `oauth2-proxy`
5. Validar o fluxo completo de sessão autenticada
6. Só depois aposentar a UI estática do Go como frente principal
