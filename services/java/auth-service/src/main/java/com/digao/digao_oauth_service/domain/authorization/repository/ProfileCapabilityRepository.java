package com.digao.digao_oauth_service.domain.authorization.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.digao.digao_oauth_service.domain.authorization.ProfileCapabilityEntity;

public interface ProfileCapabilityRepository extends JpaRepository<ProfileCapabilityEntity, Long> {
    List<ProfileCapabilityEntity> findAllByProfileIdIn(Collection<Long> profileIds);
}
