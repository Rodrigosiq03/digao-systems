# Portal VPN Access Design

## Goal
Adicionar ao Digão OAuth Portal um módulo administrativo de `VPN Access` desacoplado do IAM principal, permitindo que `ADMIN_MASTER` registre e atualize o status de acesso VPN de usuários do Keycloak sem automatizar o invite do Tailscale nesta primeira versão.

## Context
Hoje o portal já controla:
- identidade via Keycloak
- roles globais do portal
- autorização de produto via `systems`, `capabilities`, `profiles`, `user_profiles`

O acesso à VPN via Tailscale é uma responsabilidade operacional separada. Como o tailnet usa fluxo baseado em `custom OIDC` com Keycloak, o provisioning automático de usuários/grupos no Tailscale não está disponível como fluxo limpo de IAM unificado. Então o portal precisa modelar esse acesso como um subdomínio próprio e explícito.

## Approach Options

### 1. Persistir status manual de VPN no portal
O portal armazena o status de acesso VPN por usuário e provider, mostra isso nos cards de usuários e oferece ações administrativas para marcar transições de estado.

Vantagens:
- simples
- auditável
- não depende de automação frágil com Tailscale
- separa IAM de acesso à VPN

Desvantagens:
- o invite real continua manual
- exige disciplina operacional até a automação futura

### 2. Chamar scripts locais ou CLI do Tailscale desde o portal
O portal tentaria executar uma integração de host para abrir ou disparar o invite.

Vantagens:
- menos clique manual para o operador

Desvantagens:
- acoplamento cedo demais ao ambiente do host
- superfície de segurança maior
- fluxo operacional ainda pouco estável

### 3. Esperar automação completa antes de modelar VPN no portal
Não adicionar nada agora e só avançar quando a integração com Tailscale estiver pronta.

Vantagens:
- modelo final mais puro

Desvantagens:
- bloqueia valor imediato
- não resolve o problema operacional atual

## Recommendation
Seguir com a opção 1.

O portal passa a tratar `VPN Access` como um recurso administrativo com persistência, auditoria e visualização. A integração automática com Tailscale fica explicitamente fora do escopo desta versão.

## Domain Model
Criar o recurso `user_vpn_access` com uma entrada por usuário do Keycloak por provider.

Campos:
- `keycloak_user_id`
- `provider`
- `status`
- `invite_link`
- `notes`
- `created_at`
- `created_by`
- `updated_at`
- `updated_by`
- `invited_at`
- `activated_at`
- `revoked_at`

Chave primária:
- `(keycloak_user_id, provider)`

Valor inicial de provider:
- `tailscale`

Status permitidos:
- `none`
- `invite_pending`
- `active`
- `revoked`

## Authorization Rules
- `ADMIN_MASTER`
  - leitura e escrita
- `ADMIN`
  - leitura apenas
- `COMMON`
  - sem acesso a esse módulo

Toda alteração nesse recurso deve gerar evento em `audit_logs`.

## API Design
Expor no `auth-service` endpoints administrativos dedicados:
- `GET /admin/users/{userId}/vpn-access`
- `PUT /admin/users/{userId}/vpn-access/{provider}`

Semântica do `PUT`:
- cria o registro se não existir
- atualiza o registro se já existir

Payload do `PUT`:
- `status`
- `inviteLink`
- `notes`

O endpoint não envia invite real. Ele apenas persiste o estado administrativo do acesso VPN.

## Frontend Design
Enriquecer `UsersPage` e `UserCards`.

Para cada usuário:
- mostrar status do usuário
- mostrar status de VPN
- mostrar provider
- mostrar link operacional quando existir

Ações visíveis para `ADMIN_MASTER`:
- marcar `invite_pending`
- marcar `active`
- marcar `revoked`
- editar `notes`
- abrir o link de invite quando existir

Para `ADMIN`:
- visualizar status e metadados
- sem ações de escrita

Para `COMMON`:
- nenhum acesso às áreas administrativas

## UX Behavior
O fluxo administrativo esperado fica:
1. criar usuário no portal
2. usuário recebe email de primeiro acesso
3. operador abre o card do usuário
4. operador marca o estado de VPN conforme o processo manual do Tailscale
5. sistema registra auditoria das alterações

Esse desenho separa claramente:
- identidade e autorização de sistemas
- acesso VPN

## Data Flow
- `UsersPage` continua carregando usuários do módulo admin atual
- uma segunda consulta carrega `vpn_access` por usuário
- o frontend compõe os dados no card do usuário
- mutações de VPN invalidam queries de `vpn-access` e, quando necessário, a listagem de usuários

## Auditability
Cada alteração em `user_vpn_access` gera log com:
- `actor_user_id`
- `actor_email`
- `action`
- `target_type = user_vpn_access`
- `target_id = {keycloak_user_id}:{provider}`
- `before_json`
- `after_json`
- `created_at`

## Out of Scope
Fica explicitamente fora desta versão:
- automação real de invite do Tailscale
- SCIM ou provisioning automático
- sync de estado a partir da API do Tailscale
- múltiplos providers além de `tailscale`

## Success Criteria
A versão estará correta quando:
- existir persistência de `user_vpn_access` no banco do portal
- `ADMIN_MASTER` puder criar/atualizar o estado via portal
- `ADMIN` puder visualizar o estado
- `COMMON` não enxergar esse módulo
- alterações aparecerem em auditoria
- o portal mostrar o estado de VPN dentro da experiência de usuários
