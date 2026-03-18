package com.digao.digao_oauth_service.domain.authorization.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.digao.digao_oauth_service.domain.authorization.ProfileEntity;

public interface ProfileRepository extends JpaRepository<ProfileEntity, Long> {
}
