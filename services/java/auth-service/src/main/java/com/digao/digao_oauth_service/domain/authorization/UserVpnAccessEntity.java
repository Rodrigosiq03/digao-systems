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

    @Column(name = "state", nullable = false)
    private String state;

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

    @Column(name = "provider_role")
    private String providerRole;

    @Column(name = "provider_last_seen_at")
    private OffsetDateTime providerLastSeenAt;

    @Column(name = "provider_observed_at")
    private OffsetDateTime providerObservedAt;

    protected UserVpnAccessEntity() {
    }

    public static UserVpnAccessEntity create(
        String keycloakUserId,
        String provider,
        String state,
        String inviteLink,
        String notes,
        String actor
    ) {
        UserVpnAccessEntity entity = new UserVpnAccessEntity();
        entity.keycloakUserId = keycloakUserId;
        entity.provider = provider;
        entity.createdBy = actor;
        entity.apply(state, inviteLink, notes, actor);
        return entity;
    }

    public void apply(String state, String inviteLink, String notes, String actor) {
        this.state = state;
        this.inviteLink = inviteLink;
        this.notes = notes;
        this.updatedBy = actor;
        this.updatedAt = OffsetDateTime.now();
        syncLifecycleTimestamps(state);
    }

    public UserVpnAccessEntity observe(
        String providerRole,
        OffsetDateTime providerLastSeenAt,
        OffsetDateTime providerObservedAt,
        String actor
    ) {
        this.providerRole = providerRole;
        this.providerLastSeenAt = providerLastSeenAt;
        this.providerObservedAt = providerObservedAt;
        this.updatedBy = actor;
        this.updatedAt = OffsetDateTime.now();
        return this;
    }

    private void syncLifecycleTimestamps(String state) {
        OffsetDateTime now = OffsetDateTime.now();
        if ("invite_pending".equals(state)) {
            if (this.invitedAt == null) {
                this.invitedAt = now;
            }
            this.activatedAt = null;
            this.revokedAt = null;
        } else if ("active".equals(state)) {
            if (this.activatedAt == null) {
                this.activatedAt = now;
            }
            this.revokedAt = null;
        } else if ("revoked".equals(state)) {
            if (this.revokedAt == null) {
                this.revokedAt = now;
            }
        } else if ("none".equals(state)) {
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

    public String getState() {
        return state;
    }

    public String getStatus() {
        return state;
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

    public String getProviderRole() {
        return providerRole;
    }

    public OffsetDateTime getProviderLastSeenAt() {
        return providerLastSeenAt;
    }

    public OffsetDateTime getProviderObservedAt() {
        return providerObservedAt;
    }
}
