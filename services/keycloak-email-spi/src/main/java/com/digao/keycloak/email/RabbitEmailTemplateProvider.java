package com.digao.keycloak.email;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.TimeoutException;

import org.jboss.logging.Logger;
import org.keycloak.email.EmailException;
import org.keycloak.email.EmailTemplateProvider;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.OrganizationModel;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.sessions.AuthenticationSessionModel;
import org.keycloak.util.JsonSerialization;

public class RabbitEmailTemplateProvider implements EmailTemplateProvider {
    private static final Logger LOG = Logger.getLogger(RabbitEmailTemplateProvider.class);

    private final KeycloakSession session;
    private final RabbitPublisher publisher;

    private RealmModel realm;
    private UserModel user;
    private AuthenticationSessionModel authSession;
    private final Map<String, Object> attributes = new HashMap<>();

    RabbitEmailTemplateProvider(KeycloakSession session, RabbitPublisher publisher) {
        this.session = session;
        this.publisher = publisher;
    }

    @Override
    public EmailTemplateProvider setRealm(RealmModel realm) {
        this.realm = realm;
        return this;
    }

    @Override
    public EmailTemplateProvider setUser(UserModel user) {
        this.user = user;
        return this;
    }

    @Override
    public EmailTemplateProvider setAuthenticationSession(AuthenticationSessionModel authSession) {
        this.authSession = authSession;
        return this;
    }

    @Override
    public EmailTemplateProvider setAttribute(String name, Object value) {
        if (name != null) {
            attributes.put(name, value);
        }
        return this;
    }

    @Override
    public void sendPasswordReset(String link, long expirationInMinutes) throws EmailException {
        sendActionEmail("RESET_PASSWORD", link, expirationInMinutes);
    }

    @Override
    public void sendExecuteActions(String link, long expirationInMinutes) throws EmailException {
        sendActionEmail("EXECUTE_ACTIONS", link, expirationInMinutes);
    }

    @Override
    public void sendVerifyEmail(String link, long expirationInMinutes) throws EmailException {
        sendActionEmail("VERIFY_EMAIL", link, expirationInMinutes);
    }

    @Override
    public void sendConfirmIdentityBrokerLink(String link, long expirationInMinutes) throws EmailException {
        sendActionEmail("CONFIRM_IDENTITY_BROKER_LINK", link, expirationInMinutes);
    }

    @Override
    public void sendEmailUpdateConfirmation(String link, long expirationInMinutes, String newEmail) throws EmailException {
        sendActionEmail("EMAIL_UPDATE_CONFIRMATION", link, expirationInMinutes, newEmail);
    }

    @Override
    public void sendOrgInviteEmail(OrganizationModel organization, String link, long expirationInMinutes)
            throws EmailException {
        sendActionEmail("ORG_INVITE_EMAIL", link, expirationInMinutes);
    }

    @Override
    public void sendSmtpTestEmail(Map<String, String> config, UserModel user) throws EmailException {
        throw new EmailException("SMTP test email is not supported by RabbitMQ provider");
    }

    @Override
    public void sendEvent(org.keycloak.events.Event event) throws EmailException {
        // Not used for reset password flow.
        LOG.debugf("Ignoring Keycloak event email: %s", event != null ? event.getType() : "null");
    }

    @Override
    public void send(String subject, String textBody, Map<String, Object> attributes) throws EmailException {
        sendGenericEmail(subject, textBody, attributes);
    }

    @Override
    public void send(String subject, List<Object> subjectParams, String textBody, Map<String, Object> attributes)
        throws EmailException {
        sendGenericEmail(subject, textBody, attributes);
    }

    @Override
    public void close() {
        // No per-request resources to close.
    }

    private void sendActionEmail(String type, String link, long expirationInMinutes) throws EmailException {
        sendActionEmail(type, link, expirationInMinutes, null);
    }

    private void sendActionEmail(String type, String link, long expirationInMinutes, String newEmail) throws EmailException {
        String traceId = resolveTraceId();
        EmailPayload payload = EmailPayload.from(type, user, realm, link, expirationInMinutes, newEmail, attributes, traceId);
        publish(payload);
    }

    private void sendGenericEmail(String subject, String textBody, Map<String, Object> attributes) throws EmailException {
        String traceId = resolveTraceId();
        EmailPayload payload = EmailPayload.generic(user, realm, subject, textBody, attributes, traceId);
        publish(payload);
    }

    private void publish(EmailPayload payload) throws EmailException {
        if (publisher == null) {
            throw new EmailException("RabbitMQ publisher is not configured");
        }

        try {
            String json = JsonSerialization.writeValueAsString(payload);
            publisher.publishJson(json);
        } catch (IOException | TimeoutException ex) {
            LOG.error("Failed to publish email payload to RabbitMQ", ex);
            throw new EmailException("Failed to publish email payload to RabbitMQ", ex);
        }
    }

    static record EmailPayload(
        String traceId,
        String type,
        String to,
        String fullName,
        String resetLink,
        String expiresIn,
        String subject,
        String body,
        String userId,
        String username,
        String firstName,
        String lastName,
        String realm,
        String link,
        Long expiresInMinutes,
        String newEmail,
        Map<String, Object> attributes
    ) {
        static EmailPayload from(String type, UserModel user, RealmModel realm, String link, long expiresInMinutes,
                                 String newEmail, Map<String, Object> attributes, String traceId) throws EmailException {
            UserSnapshot snapshot = UserSnapshot.from(user);
            String expiresIn = Long.toString(expiresInMinutes);

            return new EmailPayload(
                traceId,
                type,
                snapshot.email,
                snapshot.fullName,
                link,
                expiresIn,
                null,
                null,
                snapshot.userId,
                snapshot.username,
                snapshot.firstName,
                snapshot.lastName,
                realm != null ? realm.getName() : "",
                link,
                expiresInMinutes,
                newEmail,
                attributes == null ? Map.of() : attributes
            );
        }

        static EmailPayload generic(UserModel user, RealmModel realm, String subject, String textBody,
                                    Map<String, Object> attributes, String traceId) throws EmailException {
            UserSnapshot snapshot = UserSnapshot.from(user);

            return new EmailPayload(
                traceId,
                "GENERIC",
                snapshot.email,
                snapshot.fullName,
                null,
                null,
                subject,
                textBody,
                snapshot.userId,
                snapshot.username,
                snapshot.firstName,
                snapshot.lastName,
                realm != null ? realm.getName() : "",
                null,
                0L,
                null,
                attributes == null ? Map.of() : attributes
            );
        }

    }

    private static final class UserSnapshot {
        final String userId;
        final String username;
        final String email;
        final String firstName;
        final String lastName;
        final String fullName;

        private UserSnapshot(String userId, String username, String email, String firstName, String lastName,
                             String fullName) {
            this.userId = userId;
            this.username = username;
            this.email = email;
            this.firstName = firstName;
            this.lastName = lastName;
            this.fullName = fullName;
        }

        static UserSnapshot from(UserModel user) throws EmailException {
            if (user == null) {
                throw new EmailException("Missing user in email provider context");
            }
            if (user.getEmail() == null || user.getEmail().isBlank()) {
                throw new EmailException("User does not have an email address");
            }

            String firstName = safe(user.getFirstName());
            String lastName = safe(user.getLastName());
            String fullName = buildFullName(firstName, lastName, user.getUsername());

            return new UserSnapshot(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                firstName,
                lastName,
                fullName
            );
        }
    }

    private static String buildFullName(String firstName, String lastName, String fallback) {
        String combined = (firstName + " " + lastName).trim();
        if (!combined.isBlank()) {
            return combined;
        }
        return Objects.requireNonNullElse(fallback, "");
    }

    private static String safe(String value) {
        return value == null ? "" : value;
    }

    private String resolveTraceId() {
        if (authSession != null && authSession.getParentSession() != null) {
            String id = authSession.getParentSession().getId();
            if (id != null && !id.isBlank()) {
                return id;
            }
        }
        return java.util.UUID.randomUUID().toString();
    }
}
