package com.digao.notification.infra.consumers;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

import com.digao.notification.core.ports.TraceRepository;
import com.digao.notification.core.services.EmailService;
import com.digao.notification.infra.dtos.EmailDto;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class RabbitEmailConsumer {
    private final EmailService emailService;
    private final TraceRepository traceRepository;

    @RabbitListener(queues = "${digao.rabbitmq.queue}")
    public void consume(@Payload EmailDto payload) {
        log.info("📧 Mensagem recebida. TraceID: [{}] | Destino: [{}] | Tipo: [{}]", payload.traceId(), payload.to(), payload.type());
        boolean isNew = traceRepository.save(payload.traceId());

        if (!isNew) {
            log.warn("⚠️ Mensagem duplicada detectada. TraceID: [{}]. Ignorando envio de email.", payload.traceId());
            return;
        }

        try {
            emailService.sendEmail(
                    payload.type(),
                    payload.to(),
                    payload.fullName(),
                    payload.username(),
                    payload.temporaryPassword(),
                    payload.resetLink(),
                    payload.expiresIn(),
                    payload.subject(),
                    payload.body(),
                    payload.loginUrl()
            );
            log.info("✅ Email enviado com sucesso. TraceID: [{}] | Destino: [{}] | Tipo: [{}]", payload.traceId(), payload.to(), payload.type());
        } catch (Exception e) {
            log.error("❌ Falha ao enviar email. TraceID: [{}] | Destino: [{}] | Erro: {}", payload.traceId(), payload.to(), e.getMessage());
            throw new RuntimeException(e);
        }

    }
}
