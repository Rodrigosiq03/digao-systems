package com.digao.digao_oauth_service.domain.authorization;

import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "audit_logs")
public class AuditLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "actor_user_id")
    private String actorUserId;

    @Column(name = "actor_email")
    private String actorEmail;

    @Column(nullable = false)
    private String action;

    @Column(name = "target_type", nullable = false)
    private String targetType;

    @Column(name = "target_id")
    private String targetId;

    @Column(name = "before_json")
    private String beforeJson;

    @Column(name = "after_json")
    private String afterJson;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    protected AuditLogEntity() {
    }

    public static AuditLogEntity create(String actorUserId, String actorEmail, String action, String targetType, String targetId) {
        AuditLogEntity entity = new AuditLogEntity();
        entity.actorUserId = actorUserId;
        entity.actorEmail = actorEmail;
        entity.action = action;
        entity.targetType = targetType;
        entity.targetId = targetId;
        return entity;
    }

    public String getAction() {
        return action;
    }

    public Long getId() {
        return id;
    }

    public String getTargetType() {
        return targetType;
    }

    public String getTargetId() {
        return targetId;
    }

    public String getActorEmail() {
        return actorEmail;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}
