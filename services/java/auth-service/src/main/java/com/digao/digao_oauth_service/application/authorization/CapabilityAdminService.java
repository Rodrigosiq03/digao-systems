package com.digao.digao_oauth_service.application.authorization;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.digao.digao_oauth_service.domain.authorization.CapabilityEntity;
import com.digao.digao_oauth_service.domain.authorization.SystemEntity;
import com.digao.digao_oauth_service.domain.authorization.repository.CapabilityRepository;
import com.digao.digao_oauth_service.domain.authorization.repository.SystemRepository;

@Service
public class CapabilityAdminService {

    private final CapabilityRepository capabilityRepository;
    private final SystemRepository systemRepository;
    private final AuditLogService auditLogService;

    public CapabilityAdminService(CapabilityRepository capabilityRepository, SystemRepository systemRepository, AuditLogService auditLogService) {
        this.capabilityRepository = capabilityRepository;
        this.systemRepository = systemRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public CapabilityEntity create(Long systemId, String key, String name, String actor) {
        SystemEntity system = systemRepository.findById(systemId).orElseThrow();
        CapabilityEntity entity = capabilityRepository.save(CapabilityEntity.create(system, key, name));
        auditLogService.record(actor, "capability.created", "capability", entity.getId().toString());
        return entity;
    }

    @Transactional(readOnly = true)
    public List<CapabilityEntity> list() {
        return capabilityRepository.findAll();
    }

    @Transactional
    public CapabilityEntity disable(Long capabilityId, String actor) {
        CapabilityEntity entity = capabilityRepository.findById(capabilityId).orElseThrow();
        entity.disable(actor);
        auditLogService.record(actor, "capability.disabled", "capability", entity.getId().toString());
        return entity;
    }
}
