package com.digao.digao_oauth_service.infra.identity.keycloak;

import java.util.List;
import java.util.Optional;

import java.util.function.Supplier;

import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.GroupResource;
import org.keycloak.representations.idm.GroupRepresentation;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.digao.digao_oauth_service.core.domain.entities.Group;
import com.digao.digao_oauth_service.core.ports.GroupProviderPort;

import jakarta.ws.rs.NotAuthorizedException;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.core.Response;

@Component
public class KeycloakGroupProviderAdapter implements GroupProviderPort {
    private static final Logger logger = LoggerFactory.getLogger(KeycloakGroupProviderAdapter.class);
    private final Keycloak keycloak;
    private final KeycloakAdminProperties properties;

    public KeycloakGroupProviderAdapter(Keycloak keycloak, KeycloakAdminProperties properties) {
        this.keycloak = keycloak;
        this.properties = properties;
    }

    @Override
    public String createGroup(Group group) {
        return withAdminAuth("createGroup", () -> {
            GroupRepresentation rep = new GroupRepresentation();
            rep.setName(group.getName());
            rep.setAttributes(group.getAttributes());

            Response response = keycloak.realm(properties.realm()).groups().add(rep);
            if (response.getStatus() != 201) {
                throw new IllegalStateException("Erro ao criar grupo no Keycloak: " + response.getStatus());
            }
            return response.getLocation().getPath().replaceAll(".*/", "");
        });
    }

    @Override
    public Optional<Group> getGroupById(String id) {
        try {
            return withAdminAuth("getGroupById", () -> {
                GroupRepresentation rep = keycloak.realm(properties.realm()).groups().group(id).toRepresentation();
                return Optional.ofNullable(rep).map(this::toDomain);
            });
        } catch (NotFoundException ex) {
            return Optional.empty();
        }
    }

    @Override
    public List<Group> getAllGroups() {
        return withAdminAuth("getAllGroups", () ->
            keycloak.realm(properties.realm()).groups().groups().stream()
                .map(this::toDomain)
                .toList()
        );
    }

    @Override
    public void updateGroup(Group group) {
        withAdminAuth("updateGroup", () -> {
            GroupResource resource = keycloak.realm(properties.realm()).groups().group(group.getId());
            GroupRepresentation rep = resource.toRepresentation();
            rep.setName(group.getName());
            rep.setAttributes(group.getAttributes());
            resource.update(rep);
            return null;
        });
    }

    private Group toDomain(GroupRepresentation rep) {
        return new Group(rep.getId(), rep.getName(), rep.getPath(), rep.getAttributes());
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
