package com.digao.digao_oauth_service.domain.authorization.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.digao.digao_oauth_service.domain.authorization.CapabilityEntity;

public interface CapabilityRepository extends JpaRepository<CapabilityEntity, Long> {
    List<CapabilityEntity> findAllBySystemId(Long systemId);
}
