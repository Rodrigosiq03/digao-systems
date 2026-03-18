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
@Table(name = "capabilities")
public class CapabilityEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "system_id", nullable = false)
    private SystemEntity system;

    @Column(name = "\"key\"", nullable = false)
    private String key;

    @Column(nullable = false)
    private String name;

    @Column
    private String description;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @Column(name = "updated_by")
    private String updatedBy;

    protected CapabilityEntity() {
    }

    public static CapabilityEntity create(SystemEntity system, String key, String name) {
        CapabilityEntity entity = new CapabilityEntity();
        entity.system = system;
        entity.key = key;
        entity.name = name;
        return entity;
    }

    public Long getId() {
        return id;
    }

    public SystemEntity getSystem() {
        return system;
    }

    public String getKey() {
        return key;
    }

    public String getName() {
        return name;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void disable(String updatedBy) {
        this.enabled = false;
        this.updatedAt = OffsetDateTime.now();
        this.updatedBy = updatedBy;
    }
}
