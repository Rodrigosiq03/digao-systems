# Digao OAuth - Minimos para colocar prod online

## Escopo minimo

1. Infra core em prod:
   - RabbitMQ
   - Redis
   - Keycloak
   - Nginx Proxy Manager
2. Aplicacao em prod:
   - auth-service
   - notification-service
   - digao-oauth-portal (frontend)
3. Rede e dominio:
   - ACL Tailscale por ambiente
   - firewall local liberando apenas `tailscale0`
   - DNS no Cloudflare + TLS no NPM

## Gap atual

Sem frontend (`digao-oauth-portal`) publicado e roteado no proxy, a jornada de usuarios/sistemas nao fecha em producao.

## Sequencia recomendada (minima)

1. Validar segredos de prod para todos os stacks Pulumi.
2. Publicar `digao-oauth-portal` em `prod` (workflow `pulumi-digao-oauth-portal.yml`).
3. Publicar `auth-service` e `notification-service` em `prod` (workflow `pulumi-services.yml` com `stack=prod`).
4. Garantir no NPM:
   - host do portal frontend
   - host do auth-service
   - certificados TLS validos
5. Aplicar baseline de rede:
   - `deploy/network/tailscale/policy.multi-env.sample.json`
   - `deploy/network/firewall/iptables-multi-env.sh`
6. Teste fim a fim:
   - login no portal
   - fluxo de usuarios e sistemas
   - reset de senha/notificacao

## Criterio de pronto (MVP prod)

- portal acessivel no dominio de producao
- login e refresh token funcionando
- endpoints de usuarios/sistemas operacionais
- notificacoes entregues
- acesso restrito ao Tailnet conforme ACL
