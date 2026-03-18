package com.digao.digao_oauth_service.domain.authorization;

import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_vpn_access")
@IdClass(UserVpnAccessId.class)
public class UserVpnAccessEntity {

    @Id
    @Column(name = "keycloak_user_id", nullable = false)
    private String keycloakUserId;

    @Id
    @Column(nullable = false)
    private String provider;

    @Column(nullable = false)
    private String status;

    @Column(name = "invite_link")
    private String inviteLink;

    @Column
    private String notes;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @Column(name = "updated_by")
    private String updatedBy;

    @Column(name = "invited_at")
    private OffsetDateTime invitedAt;

    @Column(name = "activated_at")
    private OffsetDateTime activatedAt;

    @Column(name = "revoked_at")
    private OffsetDateTime revokedAt;

    protected UserVpnAccessEntity() {
    }

    public static UserVpnAccessEntity create(
        String keycloakUserId,
        String provider,
        String status,
        String inviteLink,
        String notes,
        String actor
    ) {
        UserVpnAccessEntity entity = new UserVpnAccessEntity();
        entity.keycloakUserId = keycloakUserId;
        entity.provider = provider;
        entity.createdBy = actor;
        entity.apply(status, inviteLink, notes, actor);
        return entity;
    }

    public void apply(String status, String inviteLink, String notes, String actor) {
        this.status = status;
        this.inviteLink = inviteLink;
        this.notes = notes;
        this.updatedBy = actor;
        this.updatedAt = OffsetDateTime.now();
        syncLifecycleTimestamps(status);
    }

    private void syncLifecycleTimestamps(String status) {
        OffsetDateTime now = OffsetDateTime.now();
        if ("invite_pending".equals(status)) {
            if (this.invitedAt == null) {
                this.invitedAt = now;
            }
            this.activatedAt = null;
            this.revokedAt = null;
        } else if ("active".equals(status)) {
            if (this.activatedAt == null) {
                this.activatedAt = now;
            }
            if (this.invitedAt == null) {
                this.invitedAt = now;
            }
            this.revokedAt = null;
        } else if ("revoked".equals(status)) {
            if (this.revokedAt == null) {
                this.revokedAt = now;
            }
        } else if ("none".equals(status)) {
            this.invitedAt = null;
            this.activatedAt = null;
            this.revokedAt = null;
        }
    }

    public String getKeycloakUserId() {
        return keycloakUserId;
    }

    public String getProvider() {
        return provider;
    }

    public String getStatus() {
        return status;
    }

    public String getInviteLink() {
        return inviteLink;
    }

    public String getNotes() {
        return notes;
    }

    public OffsetDateTime getInvitedAt() {
        return invitedAt;
    }

    public OffsetDateTime getActivatedAt() {
        return activatedAt;
    }

    public OffsetDateTime getRevokedAt() {
        return revokedAt;
    }
}
