package com.digao.keycloak.email;

import org.keycloak.Config;

class RabbitConfig {
    final String host;
    final int port;
    final String username;
    final String password;
    final String virtualHost;
    final boolean useSsl;
    final String exchange;
    final String routingKey;
    final int connectionTimeoutMs;

    private RabbitConfig(String host, int port, String username, String password, String virtualHost,
                         boolean useSsl, String exchange, String routingKey, int connectionTimeoutMs) {
        this.host = host;
        this.port = port;
        this.username = username;
        this.password = password;
        this.virtualHost = virtualHost;
        this.useSsl = useSsl;
        this.exchange = exchange;
        this.routingKey = routingKey;
        this.connectionTimeoutMs = connectionTimeoutMs;
    }

    static RabbitConfig from(Config.Scope config) {
        String host = get(config, "rabbit-host", "localhost");
        int port = getInt(config, "rabbit-port", 5672);
        String username = get(config, "rabbit-username", "guest");
        String password = get(config, "rabbit-password", "guest");
        String virtualHost = get(config, "rabbit-virtual-host", "/");
        boolean useSsl = getBool(config, "rabbit-ssl", false);
        String exchange = get(config, "rabbit-exchange", "notification.email");
        String routingKey = get(config, "rabbit-routing-key", "auth.reset-password");
        int connectionTimeoutMs = getInt(config, "rabbit-connection-timeout-ms", 10000);

        return new RabbitConfig(host, port, username, password, virtualHost, useSsl, exchange, routingKey,
            connectionTimeoutMs);
    }

    private static String get(Config.Scope config, String key, String defaultValue) {
        String value = config.get(key);
        return value == null || value.isBlank() ? defaultValue : value.trim();
    }

    private static int getInt(Config.Scope config, String key, int defaultValue) {
        String value = config.get(key);
        if (value == null || value.isBlank()) {
            return defaultValue;
        }
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException ex) {
            return defaultValue;
        }
    }

    private static boolean getBool(Config.Scope config, String key, boolean defaultValue) {
        String value = config.get(key);
        if (value == null || value.isBlank()) {
            return defaultValue;
        }
        return Boolean.parseBoolean(value.trim());
    }
}
