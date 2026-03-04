# Dev Readiness - Digao OAuth

Fluxo minimo para validar se o ambiente `dev` esta funcional antes de promover para homolog.

## 1) Ordem recomendada de deploy (dev)

1. `pulumi-nginx-proxy-manager` (`stack=dev`)
2. `pulumi-rabbitmq` (`stack=dev`)
3. `pulumi-redis` (`stack=dev`)
4. `pulumi-keycloak` (`stack=dev`)
5. `pulumi-services` (`service=all`, `stack=dev`)
6. `pulumi-digao-oauth-portal` (`stack=dev`)

## 2) Ajuste essencial do frontend em dev

O portal dev atualmente usa `localhost` nas variaveis de build.
Para validar de outro dispositivo, configure URLs reais do ambiente dev:

```bash
pulumi -C pulumi/digao-oauth-portal config set digao-oauth-portal:viteKcUrl "https://kc-dev.seudominio.com" --stack dev
pulumi -C pulumi/digao-oauth-portal config set digao-oauth-portal:viteApiUrl "https://api-dev.seudominio.com" --stack dev
```

Sem isso, login/API podem quebrar fora do servidor.

## 3) Smoke test tecnico

```bash
cd /data/apps
bash deploy/network/scripts/check-dev-stack.sh
```

## 4) Validacao funcional (manual)

1. Abrir portal dev
2. Fazer login no Keycloak dev
3. Listar usuarios/sistemas
4. Acionar reset de senha
5. Confirmar consumo/publicacao no RabbitMQ

Se todos os passos passarem, o ambiente dev esta pronto para promover para homolog.
