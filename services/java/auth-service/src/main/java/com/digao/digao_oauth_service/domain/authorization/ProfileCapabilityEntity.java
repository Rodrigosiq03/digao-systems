package com.digao.digao_oauth_service.domain.authorization;

import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "profile_capabilities")
public class ProfileCapabilityEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "profile_id", nullable = false)
    private ProfileEntity profile;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "capability_id", nullable = false)
    private CapabilityEntity capability;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "revoked_at")
    private OffsetDateTime revokedAt;

    @Column(name = "revoked_by")
    private String revokedBy;

    protected ProfileCapabilityEntity() {
    }

    public static ProfileCapabilityEntity create(ProfileEntity profile, CapabilityEntity capability, String createdBy) {
        ProfileCapabilityEntity entity = new ProfileCapabilityEntity();
        entity.profile = profile;
        entity.capability = capability;
        entity.createdBy = createdBy;
        return entity;
    }

    public Long getId() {
        return id;
    }
}
