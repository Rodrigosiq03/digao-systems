# Cloud Gaming Dev V1 Design

## Goal

Entregar uma versao dev fechada do Digao Cloud Gaming em que o usuario entra no hub web autenticado, ve um catalogo manual de jogos, inicia uma sessao por vez no host e usa o Sunshine como provider de streaming. Nesta fase nao existe browser play; o hub fica responsavel por auth, catalogo, sessao e launch orchestration.

## Current Context

O produto ja tem uma base Go funcional para hub, auth, catalogo e sessao:
- `services/go/cloud-gaming/internal/hub/catalog.go` suporta catalogo manual via config.
- `services/go/cloud-gaming/internal/hub/session_manager.go` ja faz reserva de sessao, limite de concorrencia e launch exec no host.
- `services/go/cloud-gaming/internal/app/http_handlers.go` ja expoe o hub web e os endpoints de start/stop.
- `services/go/cloud-gaming/web/static/app.js` ja entrega a UI basica do hub.

O problema esta no caminho de streaming/input proprio:
- o backend WebRTC e o motor C++ ainda nao formam uma base estavel para produto browser-first.
- input real no backend Go nao esta implementado; hoje a camada de input so recebe/loga eventos.
- o motor atual ja mostrou fragilidade com captura de desktop/gamescope.

Por isso, o dev v1 deve reaproveitar o hub/orquestracao e trocar apenas o provider de stream.

## Approaches Considered

### 1. Reaproveitar o hub Go e usar Sunshine como provider

O hub continua sendo o produto principal. Ele autentica, apresenta catalogo, controla sessao e lanca o jogo; o streaming fica a cargo do Sunshine. Esse caminho entrega valor rapido e reduz o risco tecnico porque corta o motor mais instavel sem jogar fora a orquestracao que ja existe.

### 2. Criar apps Sunshine separados por jogo

Melhora a UX dentro do cliente Moonlight, mas quase nao muda a arquitetura real do produto. Continua sendo um unico host grafico, um unico provider e uma unica sessao de fato. Gera mais manutencao agora e pouco ganho estrutural.

### 3. Insistir no motor proprio e concluir browser play agora

Seria o melhor encaixe com a visao final de produto, mas a base atual ainda nao sustenta isso com estabilidade. O risco de continuar preso em debugging de streaming e input e alto demais para esta fase.

### Recommendation

Seguir com a abordagem 1. O dev v1 deve usar o hub Go como produto e o Sunshine como provider temporario de stream. Isso preserva o investimento valido em auth, catalogo e sessao, e deixa a migracao futura para browser play como troca de provider/client, nao como reescrita do produto inteiro.

## Product Boundary

O dev v1 inclui:
- hub web autenticado
- catalogo manual fechado
- uma sessao ativa por vez no host
- launch/stop de jogo via scripts host-side
- estado de sessao no hub
- provider de stream Sunshine

O dev v1 nao inclui:
- browser play
- input via browser
- multiplayer/multi-source simultaneo
- descoberta automatica de ROMs
- Ryujinx funcional no host

## Catalog Model

O catalogo manual do dev v1 deve ter tres grupos logicos:

### Steam

Origem apenas em `/data`. O catalogo inicial fechado deve conter:
- `weed-shop-3`
- `schedule-i`

Esses itens continuam sendo lancados por comandos Steam no host, sem depender do SSD externo.

### RPCS3

Origem em `/lexar/games`. Os jogos de PS3 ja estao organizados em diretorios dedicados diretamente sob `/lexar/games`, com estrutura `PS3_GAME`/`PS3_UPDATE`. O catalogo dev deve mapear manualmente apenas os titulos escolhidos para teste.

### Ryujinx

Origem futura em `/lexar/games/switch_games`. Nesta fase o provider de catalogo deve prever suporte a jogos de Switch, mas o grupo permanece desabilitado ou oculto ate o Ryujinx existir no host com launcher funcional.

Itens explicitamente fora de escopo:
- `wii_games`
- DLCs/updates separados como itens do catalogo

## Architecture

### Hub and Auth

O binario Go continua sendo o backend principal. Ele segue protegido por `oauth2-proxy + Keycloak`, no mesmo padrao que ja foi validado no restante da stack. O frontend atual do hub continua sendo a UI principal da fase dev.

### Session Orchestration

A `SessionManager` continua sendo a origem de verdade da sessao. A sessao representa o direito de uso do host e mantem o limite de uma sessao concorrente. O start de sessao deixa de significar “subir o motor WebRTC” e passa a significar “reservar o host e lancar o jogo no provider Sunshine”.

### Launch Resolver

O catalogo deixa de carregar apenas `start_command` cru. O desenho recomendado para o dev v1 eh introduzir um resolvedor de launchers por provider/plataforma:
- Steam item -> comando Steam conhecido
- RPCS3 item -> launcher wrapper que aponta para o diretorio do jogo em `/lexar/games`
- Ryujinx item -> placeholder desabilitado ate instalacao real

A responsabilidade de path, quoting e detalhes de launch fica em wrappers host-side, nao espalhada na config do catalogo.

### Stream Provider

O provider de stream do dev v1 eh o Sunshine. O hub nao tenta mais servir video no browser nesta fase. Em vez disso, ele precisa expor o estado da sessao e metadados suficientes para que a UX futura saiba qual provider esta ativo.

Isso exige separar conceitualmente duas camadas:
- `session/orchestration`
- `stream provider`

Essa separacao eh importante para que um cliente web futuro possa substituir o cliente atual sem reescrever o hub.

## Data Flow

1. Usuario autentica no hub.
2. Hub retorna catalogo manual filtrado para itens habilitados.
3. Usuario inicia um jogo.
4. Backend valida autenticacao, capacidade e disponibilidade do item.
5. `SessionManager` reserva a sessao.
6. Backend resolve o launcher do jogo.
7. Script host-side lanca o jogo no ambiente grafico existente e garante que o provider Sunshine esteja apto a transmitir a sessao.
8. Hub passa a refletir que existe uma sessao ativa com provider `sunshine`.
9. Usuario encerra a sessao; o backend executa cleanup/stop e libera a capacidade.

## Host-side Responsibilities

Os scripts host-side precisam deixar de assumir que o pipeline de stream principal e o motor proprio. O desenho dev v1 pede:
- wrappers explicitos para Steam
- wrappers explicitos para RPCS3
- placeholder controlado para Ryujinx
- cleanup consistente de processo ao encerrar sessao
- nenhuma dependencia do motor C++ para considerar a sessao saudavel

## UX Expectations

A UI do hub, nesta fase, nao promete jogar no browser. Ela precisa deixar isso claro:
- mostrar catalogo
- mostrar sessao atual
- mostrar qual provider de stream esta sendo usado
- deixar claro que o stream do dev v1 usa Sunshine

Nao deve haver botao “Conectar stream” no sentido antigo de WebRTC do backend se o provider ativo for Sunshine.

## Error Handling

Erros devem ser tratados por classe:
- autenticacao invalida -> `401`
- item inexistente/desabilitado -> `404` ou `409`
- capacidade esgotada -> `409`
- launcher nao configurado -> erro explicito de catalogo/provider
- Sunshine indisponivel -> erro explicito de provider
- processo do jogo encerrou sozinho -> sessao deve terminar automaticamente e refletir isso no hub

## Testing Strategy

O dev v1 precisa de testes em tres niveis:

### Unit
- parser/catalog builder para itens Steam/RPCS3/Ryujinx
- resolvedor de launcher por tipo de jogo
- sessao e gating de capacidade

### Integration
- start/stop de sessao com catalogo manual
- resolucao correta de comandos host-side
- metadados do hub refletindo provider `sunshine`

### Manual Host Validation
- start de `Weed Shop 3`
- start de `Schedule I`
- start de um jogo RPCS3 a partir de `/lexar/games`
- encerramento da sessao limpando processo/estado
- Ryujinx permanecendo fora/disabled ate instalacao real

## Migration Implications

Este desenho evita retrabalho grande desde que a implementacao mantenha limites claros:
- catalogo nao conhece detalhes do cliente de stream
- sessao nao depende do motor WebRTC atual
- provider de stream eh intercambiavel
- launchers por plataforma ficam isolados em wrappers host-side

Com isso, uma futura versao browser-first pode trocar o provider/client de stream sem reescrever auth, catalogo, sessao ou launch orchestration.
