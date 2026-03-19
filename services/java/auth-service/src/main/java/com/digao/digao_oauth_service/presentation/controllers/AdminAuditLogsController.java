package com.digao.digao_oauth_service.presentation.controllers;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.digao.digao_oauth_service.application.authorization.AuditLogService;
import com.digao.digao_oauth_service.application.dto.authorization.AuditLogResponse;

@RestController
@RequestMapping("/admin/audit-logs")
public class AdminAuditLogsController {

    private final AuditLogService auditLogService;

    public AdminAuditLogsController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public List<AuditLogResponse> list() {
        return auditLogService.list().stream()
            .map(entity -> new AuditLogResponse(
                entity.getId(),
                entity.getAction(),
                entity.getTargetType(),
                entity.getTargetId(),
                entity.getActorEmail(),
                entity.getCreatedAt()
            ))
            .toList();
    }
}
