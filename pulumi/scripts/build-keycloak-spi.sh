#!/usr/bin/env bash
set -euo pipefail

ROOT=/data/apps
PULUMI_KC_DIR="$ROOT/pulumi/keycloak"
LEGACY_KC_DIR="$ROOT/keycloak"

if [[ -d "$PULUMI_KC_DIR/keycloak-email-spi" ]]; then
  SPI_DIR="$PULUMI_KC_DIR/keycloak-email-spi"
elif [[ -d "$LEGACY_KC_DIR/keycloak-email-spi" ]]; then
  SPI_DIR="$LEGACY_KC_DIR/keycloak-email-spi"
else
  echo "Could not find keycloak-email-spi in $PULUMI_KC_DIR or $LEGACY_KC_DIR" >&2
  exit 1
fi

OUT_DIR="$PULUMI_KC_DIR/extensions"
MAVEN_USER_HOME="$ROOT/.m2"

cd "$SPI_DIR"

# Use Java 17 (assumes it is already installed and active)
java -version

MAVEN_USER_HOME="$MAVEN_USER_HOME" ./mvnw -DskipTests package

JAR=$(ls -1 target/*.jar | grep -v "original-" | grep -v "sources" | head -n 1 || true)
if [[ -z "$JAR" ]]; then
  echo "No JAR found in target/. Build may have failed." >&2
  exit 1
fi

mkdir -p "$OUT_DIR"
cp "$JAR" "$OUT_DIR/digao-keycloak-email-spi.jar"

printf "SPI jar copied to %s
" "$OUT_DIR/digao-keycloak-email-spi.jar"
