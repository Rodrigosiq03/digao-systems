package com.digao.digao_oauth_service.application.authorization;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.digao.digao_oauth_service.domain.authorization.SystemEntity;
import com.digao.digao_oauth_service.domain.authorization.repository.SystemRepository;

@Service
public class SystemAdminService {

    private final SystemRepository systemRepository;
    private final AuditLogService auditLogService;

    public SystemAdminService(SystemRepository systemRepository, AuditLogService auditLogService) {
        this.systemRepository = systemRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public SystemEntity create(String key, String name, String actor) {
        SystemEntity entity = systemRepository.save(SystemEntity.create(key, name));
        auditLogService.record(actor, "system.created", "system", entity.getId().toString());
        return entity;
    }

    @Transactional
    public SystemEntity disable(Long systemId, String actor) {
        SystemEntity entity = systemRepository.findById(systemId).orElseThrow();
        entity.disable(actor);
        auditLogService.record(actor, "system.disabled", "system", entity.getId().toString());
        return systemRepository.save(entity);
    }

    @Transactional(readOnly = true)
    public List<SystemEntity> list() {
        return systemRepository.findAll();
    }
}
