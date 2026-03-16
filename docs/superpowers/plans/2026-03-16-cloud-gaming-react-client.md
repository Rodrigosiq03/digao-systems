# Cloud Gaming React Client Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar o client React do cloud gaming, integrá-lo ao backend atual e publicá-lo no `npm-nonprod` com autenticação obrigatória via `oauth2-proxy + Keycloak`.

**Architecture:** O backend Go continua como API de catálogo/sessão/orquestração. Um novo app React/Vite em `clients/web/cloud-gaming` vira a frente principal do produto. A autenticação fica no perímetro via `oauth2-proxy`, sem `keycloak-js` no frontend.

**Tech Stack:** React, Vite, Tailwind, React Query, Go backend existente, NPM, oauth2-proxy, Keycloak.

---

## Chunk 1: Scaffold do client React

### Task 1: Mapear e reaproveitar a base do portal

**Files:**
- Review: `clients/web/digao-oauth-portal/package.json`
- Review: `clients/web/digao-oauth-portal/vite.config.ts`
- Review: `clients/web/digao-oauth-portal/tailwind.config.ts`
- Review: `clients/web/digao-oauth-portal/src/index.css`

- [ ] **Step 1: Revisar dependências e estrutura do portal**

Run: `sed -n '1,220p' clients/web/digao-oauth-portal/package.json`
Expected: stack React/Vite/Tailwind/React Query visível

- [ ] **Step 2: Definir a estrutura inicial do novo app**

Criar estrutura base:
- `clients/web/cloud-gaming/package.json`
- `clients/web/cloud-gaming/vite.config.ts`
- `clients/web/cloud-gaming/tailwind.config.ts`
- `clients/web/cloud-gaming/postcss.config.cjs`
- `clients/web/cloud-gaming/tsconfig.json`
- `clients/web/cloud-gaming/tsconfig.node.json`
- `clients/web/cloud-gaming/index.html`
- `clients/web/cloud-gaming/src/main.tsx`
- `clients/web/cloud-gaming/src/index.css`

- [ ] **Step 3: Commit**

```bash
git add clients/web/cloud-gaming
git commit -m "feat(cloud-gaming-web): scaffold react client"
```

### Task 2: Montar o shell visual do produto

**Files:**
- Create: `clients/web/cloud-gaming/src/app/App.tsx`
- Create: `clients/web/cloud-gaming/src/presentation/components/*.tsx`
- Create: `clients/web/cloud-gaming/src/components/ui/*.tsx`
- Reuse reference: `clients/web/digao-oauth-portal/src/components/ui/*`

- [ ] **Step 1: Copiar ou adaptar os primitives de UI necessários**

Criar apenas o mínimo para esta tela:
- `button`
- `card`
- `badge`
- `skeleton`
- `separator`

- [ ] **Step 2: Construir o shell da página**

Implementar layout com:
- hero
- status do usuário/sessão
- biblioteca
- área `Como jogar agora`

- [ ] **Step 3: Renderizar dados mockados localmente**

Objetivo: validar a composição visual antes de integrar API.

- [ ] **Step 4: Rodar build local**

Run: `cd clients/web/cloud-gaming && yarn build`
Expected: build concluído sem erro

- [ ] **Step 5: Commit**

```bash
git add clients/web/cloud-gaming
git commit -m "feat(cloud-gaming-web): add product shell"
```

## Chunk 2: Integração com a API atual

### Task 3: Criar a camada de API do client

**Files:**
- Create: `clients/web/cloud-gaming/src/domain/hub.ts`
- Create: `clients/web/cloud-gaming/src/infrastructure/api/client.ts`
- Create: `clients/web/cloud-gaming/src/infrastructure/api/cloudGamingApi.ts`
- Create: `clients/web/cloud-gaming/src/presentation/hooks/useHubData.ts`

- [ ] **Step 1: Definir os tipos do contrato do backend**

Mapear:
- usuário
- auth mode
- stream info
- jogos
- sessão ativa

- [ ] **Step 2: Implementar client HTTP mínimo**

Sem token explícito no frontend.
Tratar:
- `401/403`
- erros genéricos da API

- [ ] **Step 3: Criar hooks com React Query**

Cobrir:
- carregar hub
- iniciar sessão
- parar sessão

- [ ] **Step 4: Commit**

```bash
git add clients/web/cloud-gaming/src
git commit -m "feat(cloud-gaming-web): add api integration"
```

### Task 4: Ligar a UI aos dados reais

**Files:**
- Modify: `clients/web/cloud-gaming/src/app/App.tsx`
- Modify: `clients/web/cloud-gaming/src/presentation/components/*.tsx`

- [ ] **Step 1: Substituir mocks por dados do hook**

Exibir:
- usuário autenticado
- limites
- sessão ativa
- biblioteca
- provider

- [ ] **Step 2: Implementar ações de iniciar/parar sessão**

Conectar os botões aos mutations do React Query.

- [ ] **Step 3: Implementar `Recentes` em localStorage**

Persistência local simples, atualizada ao iniciar sessão.

- [ ] **Step 4: Ajustar estados de loading e erro**

Cobrir:
- carregando hub
- falha de carregamento
- conflito de sessão/capacidade

- [ ] **Step 5: Rodar build local**

Run: `cd clients/web/cloud-gaming && yarn build`
Expected: build concluído sem erro

- [ ] **Step 6: Commit**

```bash
git add clients/web/cloud-gaming/src
git commit -m "feat(cloud-gaming-web): bind ui to hub api"
```

## Chunk 3: Backend contract alignment

### Task 5: Ajustar backend apenas se o client precisar

**Files:**
- Review/Modify if needed: `services/go/cloud-gaming/internal/app/http_handlers.go`
- Review/Modify if needed: `services/go/cloud-gaming/internal/auth/authenticator.go`
- Test: `services/go/cloud-gaming/internal/app/http_handlers_test.go`
- Test: `services/go/cloud-gaming/internal/auth/authenticator_test.go`

- [ ] **Step 1: Escrever ou ajustar testes de contrato antes da mudança**

Cobrir:
- `auth.mode`
- dados de sessão
- ausência de campos sensíveis no catálogo

- [ ] **Step 2: Implementar o ajuste mínimo**

Só se o frontend realmente precisar de algum campo novo ou forma nova de erro.

- [ ] **Step 3: Rodar testes focados**

Run: `go test ./internal/auth ./internal/app`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add services/go/cloud-gaming/internal
git commit -m "feat(cloud-gaming): align api contract for react client"
```

## Chunk 4: Deploy do client e auth no perímetro

### Task 6: Empacotar e publicar o novo client

**Files:**
- Create: `clients/web/cloud-gaming/Dockerfile`
- Create: `clients/web/cloud-gaming/nginx.conf`
- Review reference: `clients/web/digao-oauth-portal/Dockerfile`
- Review reference: `clients/web/digao-oauth-portal/nginx.conf`

- [ ] **Step 1: Criar imagem estática do client**

Build Vite + Nginx simples.

- [ ] **Step 2: Validar build da imagem**

Run: `docker build -t digao-cloud-gaming-web:test clients/web/cloud-gaming`
Expected: imagem construída sem erro

- [ ] **Step 3: Commit**

```bash
git add clients/web/cloud-gaming/Dockerfile clients/web/cloud-gaming/nginx.conf
git commit -m "feat(cloud-gaming-web): add production image"
```

### Task 7: Integrar auth no perímetro via oauth2-proxy

**Files:**
- Modify: `deploy/cloud-gaming/docker-compose.yml`
- Create: `deploy/cloud-gaming/host/oauth2-proxy.env.template`
- Create/Modify script for env generation if needed
- Review reference: `worktrees/pulumi-config-hardening-develop/pulumi/oauth2-proxy/__main__.py`
- Review reference: `worktrees/pulumi-config-hardening-develop/pulumi/oauth2-proxy/bootstrap_keycloak_client.py`

- [ ] **Step 1: Definir o host oficial do cloud gaming dev**

Padronizar domínio no `npm-nonprod`.

- [ ] **Step 2: Subir um `oauth2-proxy` dedicado ao cloud gaming**

Configurar:
- redirect URL
- upstream para o client React
- headers de usuário

- [ ] **Step 3: Atualizar o client Keycloak existente com o novo redirect URI**

Reaproveitar o client compartilhado `admin-ui-dev`, com merge seguro de URIs.

- [ ] **Step 4: Ajustar o backend para operar em `AUTH_MODE=proxy` no ambiente oficial**

Manter fallback técnico local separado da entrada oficial.

- [ ] **Step 5: Commit**

```bash
git add deploy/cloud-gaming
git commit -m "feat(cloud-gaming): add proxy-auth delivery"
```

### Task 8: Publicar no npm-nonprod

**Files:**
- Modify: `.github/workflows/cloud-gaming.yml`
- Modify: `deploy/cloud-gaming/README.md`

- [ ] **Step 1: Ajustar o workflow de deploy**

Garantir que o deploy suba:
- backend
- client React
- oauth2-proxy do cloud gaming

- [ ] **Step 2: Documentar o domínio oficial e o fluxo de auth**

- [ ] **Step 3: Validar YAML e compose**

Run: `docker compose -f deploy/cloud-gaming/docker-compose.yml config`
Expected: configuração válida

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/cloud-gaming.yml deploy/cloud-gaming/README.md
git commit -m "feat(cloud-gaming): deploy react client through nonprod edge"
```

## Chunk 5: Verification and handoff

### Task 9: Validar o fluxo completo

**Files:**
- Review: `clients/web/cloud-gaming/**`
- Review: `deploy/cloud-gaming/**`
- Review: `services/go/cloud-gaming/**`

- [ ] **Step 1: Rodar verificações finais**

Run:
- `cd clients/web/cloud-gaming && yarn build`
- `go test ./internal/auth ./internal/app`
- `docker compose -f deploy/cloud-gaming/docker-compose.yml config`

Expected:
- build PASS
- testes PASS
- compose válido

- [ ] **Step 2: Fazer validação manual no ambiente dev**

Validar:
- acesso só via domínio protegido
- sem sessão do Keycloak não entra
- catálogo aparece
- start session funciona
- stop session funciona
- bloco `Como jogar agora` aparece corretamente

- [ ] **Step 3: Atualizar documentação final**

Se necessário, revisar:
- `services/go/cloud-gaming/README.md`
- `deploy/cloud-gaming/README.md`

- [ ] **Step 4: Commit**

```bash
git add clients/web/cloud-gaming deploy/cloud-gaming services/go/cloud-gaming
git commit -m "docs(cloud-gaming): finalize react client rollout"
```
