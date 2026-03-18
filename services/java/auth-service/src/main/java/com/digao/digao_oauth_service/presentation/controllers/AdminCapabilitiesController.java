package com.digao.digao_oauth_service.presentation.controllers;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.digao.digao_oauth_service.application.authorization.CapabilityAdminService;
import com.digao.digao_oauth_service.application.dto.authorization.CapabilityResponse;
import com.digao.digao_oauth_service.application.dto.authorization.CreateCapabilityRequest;
import com.digao.digao_oauth_service.domain.authorization.CapabilityEntity;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/admin/capabilities")
@Validated
public class AdminCapabilitiesController {

    private final CapabilityAdminService capabilityAdminService;

    public AdminCapabilitiesController(CapabilityAdminService capabilityAdminService) {
        this.capabilityAdminService = capabilityAdminService;
    }

    @GetMapping
    public List<CapabilityResponse> list() {
        return capabilityAdminService.list().stream().map(this::toResponse).toList();
    }

    @PostMapping
    public ResponseEntity<CapabilityResponse> create(@RequestBody @Valid CreateCapabilityRequest request, Authentication authentication) {
        CapabilityEntity entity = capabilityAdminService.create(
            request.systemId(),
            request.key(),
            request.name(),
            authentication.getName()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(entity));
    }

    @PatchMapping("/{capabilityId}/disable")
    public CapabilityResponse disable(@PathVariable Long capabilityId, Authentication authentication) {
        return toResponse(capabilityAdminService.disable(capabilityId, authentication.getName()));
    }

    private CapabilityResponse toResponse(CapabilityEntity entity) {
        return new CapabilityResponse(entity.getId(), entity.getSystem().getId(), entity.getKey(), entity.getName(), entity.isEnabled());
    }
}
