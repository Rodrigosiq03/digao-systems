package com.digao.notification.infra.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableRabbit
public class RabbitMQConfig {
    @Value("${digao.rabbitmq.queue}")
    private String queueName;

    @Value("${digao.rabbitmq.exchange}")
    private String exchangeName;

    @Value("${digao.rabbitmq.routingkey}")
    private String routingKey;

    private String dlqName = "email.dlq";
    private String dlqExchangeName = "notification.dlq.exchange";
    private String dlqRoutingKey = "email.dlq.routing";

    @Bean
    public Queue dlq() {
        return QueueBuilder.durable(dlqName).build();
    }

    @Bean
    public DirectExchange dlqExchange() {
        return new DirectExchange(dlqExchangeName);
    }

    @Bean
    public Binding dlqBinding() {
        return BindingBuilder.bind(dlq()).to(dlqExchange()).with(dlqRoutingKey);
    }

    @Bean
    public Queue queue() {
        return QueueBuilder.durable(queueName)
                // Se der erro/rejeição, manda pra essa Exchange de DLQ
                .withArgument("x-dead-letter-exchange", dlqExchangeName)
                // Com essa routing key
                .withArgument("x-dead-letter-routing-key", dlqRoutingKey)
                // (Opcional) TTL: Tempo de vida se ninguém ler
                // .withArgument("x-message-ttl", 60000) 
                .build();
    }

    @Bean
    public TopicExchange exchange() {
        return new TopicExchange(exchangeName);
    }

    @Bean
    public Binding binding() {
        return BindingBuilder.bind(queue()).to(exchange()).with(routingKey);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new JacksonJsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        final RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(jsonMessageConverter());
        return rabbitTemplate;
    }

    @Bean
    public RabbitAdmin rabbitAdmin(ConnectionFactory connectionFactory) {
        return new RabbitAdmin(connectionFactory);
    }
}
