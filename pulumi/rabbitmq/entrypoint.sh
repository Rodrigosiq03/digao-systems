#!/bin/sh
set -eu

mkdir -p /etc/rabbitmq

if [ -n "${RABBITMQ_CONF:-}" ]; then
  printf "%s" "$RABBITMQ_CONF" > /etc/rabbitmq/rabbitmq.conf
fi

if [ -n "${RABBITMQ_DEFINITIONS_JSON:-}" ]; then
  printf "%s" "$RABBITMQ_DEFINITIONS_JSON" > /etc/rabbitmq/definitions.json
fi

exec rabbitmq-server
