# Keycloak (Pulumi)

Keycloak + Postgres per environment, managed as code with Pulumi.

## Start mode
- dev: uses `start-dev`
- homolog/prod: uses `start`

## Required secrets (per stack)
- keycloak:adminPassword
- keycloak:dbPassword

## Optional config
- keycloak:hostname
- keycloak:hostnameStrict
- keycloak:spiJarPath
- keycloak:importPath
- keycloak:importRealm

## Notes
- Themes are mounted from `/data/apps/pulumi/keycloak/themes`.
- Postgres is internal only (no public port).
- Import files live under `/data/apps/pulumi/keycloak/import/<env>`.
