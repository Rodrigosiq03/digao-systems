package com.digao.digao_oauth_service.infra.identity.keycloak;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import java.util.function.Supplier;

import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.GroupRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.digao.digao_oauth_service.core.domain.entities.User;
import com.digao.digao_oauth_service.core.domain.enums.UserRole;
import com.digao.digao_oauth_service.core.ports.IdentityProviderPort;

import jakarta.ws.rs.NotAuthorizedException;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.core.Response;

@Component
public class KeycloakIdentityProviderAdapter implements IdentityProviderPort {
    private static final Logger logger = LoggerFactory.getLogger(KeycloakIdentityProviderAdapter.class);
    private final Keycloak keycloak;
    private final KeycloakAdminProperties properties;

    public KeycloakIdentityProviderAdapter(Keycloak keycloak, KeycloakAdminProperties properties) {
        this.keycloak = keycloak;
        this.properties = properties;
    }

    @Override
    public String createUser(User user, String tempPassword) {
        return withAdminAuth("createUser", () -> {
            UserRepresentation rep = new UserRepresentation();
            rep.setUsername(user.getUsername());
            rep.setEmail(user.getEmail());
            rep.setFirstName(user.getFirstName());
            rep.setLastName(user.getLastName());
            rep.setEnabled(user.isEnabled());

            Response response = keycloak.realm(properties.realm()).users().create(rep);
            if (response.getStatus() != 201) {
                throw new IllegalStateException("Erro ao criar usuário no Keycloak: " + response.getStatus());
            }
            String userId = response.getLocation().getPath().replaceAll(".*/", "");

            if (tempPassword != null && !tempPassword.isBlank()) {
                updatePassword(userId, tempPassword, true);
            }

            if (user.getRole() != null) {
                assignRealmRole(userId, user.getRole());
            }

            return userId;
        });
    }

    @Override
    public Optional<User> getUserById(String id) {
        try {
            return withAdminAuth("getUserById", () -> {
                UserRepresentation rep = keycloak.realm(properties.realm()).users().get(id).toRepresentation();
                return Optional.ofNullable(rep).map(this::toDomain);
            });
        } catch (NotFoundException ex) {
            return Optional.empty();
        }
    }

    @Override
    public Optional<User> getUserByEmail(String email) {
        return withAdminAuth("getUserByEmail", () ->
            keycloak.realm(properties.realm()).users().searchByEmail(email, true)
                .stream().findFirst().map(this::toDomain)
        );
    }

    @Override
    public List<User> getAllUsers(int page, int limit) {
        int first = Math.max(page, 0) * Math.max(limit, 1);
        return withAdminAuth("getAllUsers", () ->
            keycloak.realm(properties.realm()).users().list(first, limit)
                .stream().map(this::toDomain).toList()
        );
    }

    @Override
    public List<String> getUserRoles(String id) {
        return withAdminAuth("getUserRoles", () ->
            keycloak.realm(properties.realm()).users().get(id).roles().realmLevel().listAll()
                .stream().map(RoleRepresentation::getName).toList()
        );
    }

    @Override
    public List<String> getUserGroups(String id) {
        return withAdminAuth("getUserGroups", () ->
            keycloak.realm(properties.realm()).users().get(id).groups()
                .stream().map(GroupRepresentation::getName).toList()
        );
    }

    @Override
    public void updateUser(User user) {
        withAdminAuth("updateUser", () -> {
            UserResource resource = keycloak.realm(properties.realm()).users().get(user.getId().toString());
            UserRepresentation rep = resource.toRepresentation();
            rep.setUsername(user.getUsername());
            rep.setEmail(user.getEmail());
            rep.setFirstName(user.getFirstName());
            rep.setLastName(user.getLastName());
            rep.setEnabled(user.isEnabled());
            resource.update(rep);

            if (user.getRole() != null) {
                replaceRealmRole(user.getId().toString(), user.getRole());
            }
            return null;
        });
    }

    @Override
    public void updatePassword(String userId, String newPassword, boolean temporary) {
        withAdminAuth("updatePassword", () -> {
            CredentialRepresentation cred = new CredentialRepresentation();
            cred.setType(CredentialRepresentation.PASSWORD);
            cred.setValue(newPassword);
            cred.setTemporary(temporary);

            keycloak.realm(properties.realm()).users().get(userId).resetPassword(cred);
            return null;
        });
    }

    @Override
    public void triggerResetPasswordAction(String id) {
        withAdminAuth("triggerResetPasswordAction", () -> {
            keycloak.realm(properties.realm()).users().get(id).executeActionsEmail(List.of("UPDATE_PASSWORD"));
            return null;
        });
    }

    private void assignRealmRole(String userId, UserRole role) {
        RoleRepresentation roleRep = keycloak.realm(properties.realm()).roles().get(role.name()).toRepresentation();
        if (roleRep != null) {
            keycloak.realm(properties.realm()).users().get(userId).roles().realmLevel().add(List.of(roleRep));
        }
    }

    private void replaceRealmRole(String userId, UserRole role) {
        withAdminAuth("replaceRealmRole", () -> {
            var realmRoles = keycloak.realm(properties.realm()).users().get(userId).roles().realmLevel();
            List<RoleRepresentation> existing = realmRoles.listAll();
            List<RoleRepresentation> toRemove = existing.stream()
                .filter(r -> isAppRole(r.getName()))
                .toList();
            if (!toRemove.isEmpty()) {
                realmRoles.remove(toRemove);
            }
            assignRealmRole(userId, role);
            return null;
        });
    }

    private boolean isAppRole(String roleName) {
        for (UserRole role : UserRole.values()) {
            if (role.name().equalsIgnoreCase(roleName)) {
                return true;
            }
        }
        return false;
    }

    private User toDomain(UserRepresentation rep) {
        return new User(
            UUID.fromString(rep.getId()),
            rep.getUsername(),
            rep.getEmail(),
            rep.getFirstName(),
            rep.getLastName(),
            null,
            rep.isEnabled() != null && rep.isEnabled()
        );
    }

    private <T> T withAdminAuth(String action, Supplier<T> supplier) {
        try {
            return supplier.get();
        } catch (NotAuthorizedException ex) {
            logger.error(
                "Keycloak admin client unauthorized while executing {}. Check client secret and service account roles for clientId='{}'.",
                action,
                properties.clientId()
            );
            throw ex;
        }
    }
}
