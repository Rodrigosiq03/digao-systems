# Portal VPN Provider Sync Design

## Goal
Adicionar ao `auth-service` um mecanismo de sincronização periódica do estado de acesso VPN a partir do provider externo, reconciliando usuários por email e atualizando `user_vpn_access` sem misturar responsabilidades de autenticação web com integração operacional.

## Context
Hoje o portal já possui o módulo manual de `VPN Access`, com persistência em `user_vpn_access`. Esse módulo resolve o workflow administrativo, mas não representa automaticamente a verdade observada no provider. Isso gera inconsistência prática, como um usuário `ADMIN_MASTER` que já é `Owner` no Tailscale aparecer como `sem acesso` porque ninguém marcou manualmente o status.

A necessidade agora é complementar o fluxo manual com observação externa periódica, sem transformar o provider em fonte invasiva de regras de negócio e sem acoplar o schema inteiro ao formato do Tailscale.

## Approach Options

### 1. Scheduler interno no `auth-service`
Criar um scheduler em Spring dentro do `auth-service`, com client do provider, service de reconciliação e feature flag para ativação.

Vantagens:
- mantém auth, acesso e VPN dentro do mesmo domínio de governança
- reaproveita config, logging, banco e auditoria do serviço atual
- reduz overhead operacional

Desvantagens:
- adiciona responsabilidade nova ao `auth-service`
- exige disciplina de boundaries internas

### 2. Job Java batch separado + timer externo
Criar um comando Java dedicado e executar com timer externo (`systemd timer` ou cron).

Vantagens:
- integração ainda no ecossistema Java
- isolamento operacional mais explícito

Desvantagens:
- mais plumbing e mais pontos de configuração
- menos integrado ao lifecycle do serviço

### 3. Serviço Python separado
Criar um mini projeto externo para sincronização.

Vantagens:
- isolamento total
- simples para scripts batch

Desvantagens:
- fragmenta a stack sem necessidade agora
- duplica infraestrutura operacional

## Recommendation
Seguir com a opção 1.

A sincronização passa a morar no `auth-service`, mas com fronteiras internas claras:
- scheduler só agenda
- provider client só conversa com API externa
- reconciliação aplica regra de domínio
- persistência continua em `user_vpn_access`

## Data Model
A tabela `user_vpn_access` deve evoluir para o modelo final enxuto:
- `keycloak_user_id`
- `provider`
- `state`
- `invite_link`
- `notes`
- `invited_at`
- `activated_at`
- `revoked_at`
- `provider_role`
- `provider_last_seen_at`
- `provider_observed_at`
- `created_at`
- `created_by`
- `updated_at`
- `updated_by`

Chave primária:
- `(keycloak_user_id, provider)`

`state` permanece o estado único efetivo mostrado pelo portal:
- `none`
- `invite_pending`
- `active`
- `revoked`

`provider_role` é observação do provider, com valores iniciais como:
- `owner`
- `admin`
- `member`
- `unknown`

## Matching Strategy
O matching entre usuário do portal e usuário observado no provider é sempre por email.

Fonte do email interno:
- usuário do Keycloak / portal

Fonte do email externo:
- login/email reportado pelo provider

Não usar `keycloak_user_id` no matching com o provider.

## Sync Flow
1. scheduler dispara
2. checa `digao.vpn-sync.enabled`
3. client busca usuários observados no provider
4. serviço carrega usuários internos com email
5. reconcilia por email
6. atualiza `user_vpn_access`

## Reconciliation Rules
Quando um usuário for encontrado no provider e estiver ativo:
- atualizar `provider_role`
- atualizar `provider_last_seen_at`
- atualizar `provider_observed_at`
- promover `state` para `active` se necessário
- preencher `activated_at` se estiver nulo

Quando um usuário não for encontrado:
- não revogar automaticamente
- não rebaixar automaticamente para `none`
- evitar regressão de estado por falha temporária de sync ou atraso do provider

Quando houver invite manual e depois confirmação externa:
- o sync promove o `state` de `invite_pending` para `active`

## Internal Architecture
### Config
`VpnSyncProperties`
- `enabled`
- `cron`
- `provider`
- `apiToken`
- `tailnet`

### Provider adapter
- `VpnProviderClient`
- `TailscaleVpnProviderClient`

Retorno neutro do provider:
- `VpnObservedUser`
  - `email`
  - `role`
  - `lastSeenAt`
  - `active`

### Application services
- `UserVpnAccessSyncService`
- `UserVpnAccessReconciliationService`

### Scheduler
- `VpnAccessSyncScheduler`

## Feature Flags
Usar feature flag desde o início:
- `digao.vpn-sync.enabled`
- `digao.vpn-sync.cron`

Razões:
- deployar o código antes de ativar
- ativar só em `dev`
- desligar rápido se a integração falhar
- evitar chamadas externas quando o provider/token ainda não estiver pronto

## Observability
O sync deve registrar por execução:
- provider
- total observado
- total reconciliado
- total atualizado
- total com erro
- duração da execução

Isso é suficiente para v1 usando logs estruturados.

## Out of Scope
Fica fora desta rodada:
- automação de invite no provider
- revogação automática baseada só no provider
- múltiplos providers reais além do primeiro provider suportado
- painel visual de status de execução
- webhooks/event-driven

## Success Criteria
A versão estará correta quando:
- o `auth-service` tiver sync periódico protegido por feature flag
- o matching por email funcionar
- `user_vpn_access` refletir `provider_role` e observação temporal
- usuários já ativos no provider possam ser promovidos para `active` sem ação manual
- o owner inicial deixe de aparecer como `sem acesso` quando o sync o encontrar
