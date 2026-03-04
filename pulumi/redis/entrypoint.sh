#!/bin/sh
set -eu

CONF_PATH=/usr/local/etc/redis/redis.conf
ACL_PATH=/usr/local/etc/redis/users.acl

mkdir -p /usr/local/etc/redis

if [ -n "${REDIS_CONF:-}" ]; then
  printf "%s" "$REDIS_CONF" > "$CONF_PATH"
fi

if [ -n "${REDIS_ACL:-}" ]; then
  printf "%s" "$REDIS_ACL" > "$ACL_PATH"
fi

if [ -f "$CONF_PATH" ]; then
  exec redis-server "$CONF_PATH"
fi

exec redis-server
