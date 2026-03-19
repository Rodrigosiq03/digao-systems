package com.digao.digao_oauth_service.application.authorization;

import java.util.List;

import org.springframework.stereotype.Service;

import com.digao.digao_oauth_service.domain.authorization.AuditLogEntity;
import com.digao.digao_oauth_service.domain.authorization.repository.AuditLogRepository;
import com.digao.digao_oauth_service.application.metrics.AuthServiceMetrics;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final AuthServiceMetrics metrics;

    public AuditLogService(AuditLogRepository auditLogRepository, AuthServiceMetrics metrics) {
        this.auditLogRepository = auditLogRepository;
        this.metrics = metrics;
    }

    public AuditLogEntity record(String actor, String action, String targetType, String targetId) {
        AuditLogEntity entity = auditLogRepository.save(AuditLogEntity.create(actor, actor, action, targetType, targetId));
        metrics.recordAuditEvent(action, targetType);
        return entity;
    }

    public List<AuditLogEntity> list() {
        return auditLogRepository.findAllByOrderByCreatedAtDescIdDesc();
    }
}
