package com.digao.digao_oauth_service.domain.authorization.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.digao.digao_oauth_service.domain.authorization.UserVpnAccessEntity;
import com.digao.digao_oauth_service.domain.authorization.UserVpnAccessId;
import com.digao.digao_oauth_service.domain.authorization.UserVpnAccessStateTotal;

public interface UserVpnAccessRepository extends JpaRepository<UserVpnAccessEntity, UserVpnAccessId> {
    Optional<UserVpnAccessEntity> findByKeycloakUserIdAndProvider(String keycloakUserId, String provider);
    List<UserVpnAccessEntity> findAllByKeycloakUserIdOrderByProviderAsc(String keycloakUserId);

    @Query("""
        select new com.digao.digao_oauth_service.domain.authorization.UserVpnAccessStateTotal(
            entity.provider,
            entity.state,
            count(entity)
        )
        from UserVpnAccessEntity entity
        group by entity.provider, entity.state
        """)
    List<UserVpnAccessStateTotal> summarizeTotalsByProviderAndState();
}
