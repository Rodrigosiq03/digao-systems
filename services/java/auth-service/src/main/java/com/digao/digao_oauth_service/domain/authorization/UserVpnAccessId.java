package com.digao.digao_oauth_service.domain.authorization;

import java.io.Serializable;
import java.util.Objects;

public class UserVpnAccessId implements Serializable {

    private String keycloakUserId;
    private String provider;

    public UserVpnAccessId() {
    }

    public UserVpnAccessId(String keycloakUserId, String provider) {
        this.keycloakUserId = keycloakUserId;
        this.provider = provider;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof UserVpnAccessId that)) {
            return false;
        }
        return Objects.equals(keycloakUserId, that.keycloakUserId)
            && Objects.equals(provider, that.provider);
    }

    @Override
    public int hashCode() {
        return Objects.hash(keycloakUserId, provider);
    }
}
