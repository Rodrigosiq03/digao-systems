package com.digao.notification.infra.adapters;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import com.digao.notification.core.domain.Email;
import com.digao.notification.core.ports.EmailRepository;

import jakarta.mail.internet.MimeMessage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class SmtpEmailRepository implements EmailRepository {
    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Override
    public void sendEmail(Email email) {
        log.info("Iniciando envio SMTP para: {}", email.to());
        try {

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            Context context = new Context();
            context.setVariable("title", email.subject());
            context.setVariable("messageBody", email.body());
            context.setVariable("emailType", email.type().name());
            context.setVariable("fullName", email.fullName());
            context.setVariable("username", email.username());
            context.setVariable("temporaryPassword", email.temporaryPassword());
            context.setVariable("resetLink", email.resetLink());
            context.setVariable("expiresIn", email.expiresIn());
            context.setVariable("loginUrl", email.loginUrl());

            String htmlContent = templateEngine.process("no-reply-mail-template", context);
           
            helper.setFrom(fromEmail);
            helper.setTo(email.to());
            helper.setSubject(email.subject());
            helper.setText(htmlContent, true);

            ClassPathResource logoResource = new ClassPathResource("images/logo.png");
            if (!logoResource.exists()) {
                log.warn("Logo image not found in classpath at images/logo.png");
            }
            helper.addInline("logoImage", logoResource);

            mailSender.send(message);

            log.info("E-mail enviado com sucesso para: {}", email.to());
        } catch (Exception e) {
            log.error("Failed to send email", e);
            throw new RuntimeException("Failed to send email", e);
        }

    }
}
