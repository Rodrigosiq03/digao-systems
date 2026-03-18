package com.digao.digao_oauth_service.domain.authorization.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.digao.digao_oauth_service.domain.authorization.ProfileCapabilityEntity;

public interface ProfileCapabilityRepository extends JpaRepository<ProfileCapabilityEntity, Long> {
}
