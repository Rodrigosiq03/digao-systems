package com.digao.keycloak.email;

import org.keycloak.Config;
import org.keycloak.email.EmailTemplateProvider;
import org.keycloak.email.EmailTemplateProviderFactory;
import org.keycloak.models.KeycloakSession;

import com.rabbitmq.client.ConnectionFactory;

public class RabbitEmailTemplateProviderFactory implements EmailTemplateProviderFactory {
    public static final String PROVIDER_ID = "rabbitmq";

    private RabbitPublisher publisher;

    @Override
    public EmailTemplateProvider create(KeycloakSession session) {
        return new RabbitEmailTemplateProvider(session, publisher);
    }

    @Override
    public void init(Config.Scope config) {
        RabbitConfig rabbitConfig = RabbitConfig.from(config);
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost(rabbitConfig.host);
        factory.setPort(rabbitConfig.port);
        factory.setUsername(rabbitConfig.username);
        factory.setPassword(rabbitConfig.password);
        factory.setVirtualHost(rabbitConfig.virtualHost);
        factory.setConnectionTimeout(rabbitConfig.connectionTimeoutMs);

        if (rabbitConfig.useSsl) {
            try {
                factory.useSslProtocol();
            } catch (Exception ex) {
                throw new IllegalStateException("Failed to configure RabbitMQ SSL", ex);
            }
        }

        this.publisher = new RabbitPublisher(factory, rabbitConfig.exchange, rabbitConfig.routingKey);
    }

    @Override
    public void postInit(org.keycloak.models.KeycloakSessionFactory factory) {
        // no-op
    }

    @Override
    public void close() {
        if (publisher != null) {
            publisher.close();
        }
    }

    @Override
    public String getId() {
        return PROVIDER_ID;
    }
}
