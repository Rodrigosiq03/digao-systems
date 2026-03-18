package com.digao.digao_oauth_service.domain.authorization.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.digao.digao_oauth_service.domain.authorization.UserProfileEntity;

public interface UserProfileRepository extends JpaRepository<UserProfileEntity, Long> {
    List<UserProfileEntity> findAllByKeycloakUserIdAndRevokedAtIsNull(String keycloakUserId);
}
