package com.digao.digao_oauth_service.application.authorization;

import java.util.List;

import org.springframework.stereotype.Service;

import com.digao.digao_oauth_service.domain.authorization.AuditLogEntity;
import com.digao.digao_oauth_service.domain.authorization.repository.AuditLogRepository;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public AuditLogEntity record(String actor, String action, String targetType, String targetId) {
        return auditLogRepository.save(AuditLogEntity.create(actor, actor, action, targetType, targetId));
    }

    public List<AuditLogEntity> list() {
        return auditLogRepository.findAllByOrderByCreatedAtDescIdDesc();
    }
}
