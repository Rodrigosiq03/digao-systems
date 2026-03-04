package com.digao.keycloak.email;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.TimeoutException;

import org.jboss.logging.Logger;

import com.rabbitmq.client.AMQP;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;

class RabbitPublisher {
    private static final Logger LOG = Logger.getLogger(RabbitPublisher.class);

    private final ConnectionFactory connectionFactory;
    private final String exchange;
    private final String routingKey;

    private volatile Connection connection;
    private volatile Channel channel;

    RabbitPublisher(ConnectionFactory connectionFactory, String exchange, String routingKey) {
        this.connectionFactory = connectionFactory;
        this.exchange = exchange;
        this.routingKey = routingKey;
    }

    void publishJson(String payload) throws IOException, TimeoutException {
        Channel activeChannel = ensureChannel();
        AMQP.BasicProperties props = new AMQP.BasicProperties.Builder()
            .contentType("application/json")
            .contentEncoding("utf-8")
            .build();

        activeChannel.basicPublish(exchange, routingKey, props, payload.getBytes(StandardCharsets.UTF_8));
    }

    void close() {
        try {
            if (channel != null) {
                channel.close();
            }
        } catch (Exception ex) {
            LOG.debug("Failed to close RabbitMQ channel", ex);
        }

        try {
            if (connection != null) {
                connection.close();
            }
        } catch (Exception ex) {
            LOG.debug("Failed to close RabbitMQ connection", ex);
        }
    }

    private synchronized Channel ensureChannel() throws IOException, TimeoutException {
        if (connection == null || !connection.isOpen()) {
            connection = connectionFactory.newConnection();
        }

        if (channel == null || !channel.isOpen()) {
            channel = connection.createChannel();
        }

        return channel;
    }
}
