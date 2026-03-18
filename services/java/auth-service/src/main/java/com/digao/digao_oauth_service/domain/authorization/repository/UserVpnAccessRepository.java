package com.digao.digao_oauth_service.domain.authorization.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.digao.digao_oauth_service.domain.authorization.UserVpnAccessEntity;
import com.digao.digao_oauth_service.domain.authorization.UserVpnAccessId;

public interface UserVpnAccessRepository extends JpaRepository<UserVpnAccessEntity, UserVpnAccessId> {
    Optional<UserVpnAccessEntity> findByKeycloakUserIdAndProvider(String keycloakUserId, String provider);
    List<UserVpnAccessEntity> findAllByKeycloakUserIdOrderByProviderAsc(String keycloakUserId);
}
