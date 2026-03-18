package com.digao.digao_oauth_service.presentation.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.digao.digao_oauth_service.application.authorization.ProfileAdminService;
import com.digao.digao_oauth_service.application.dto.authorization.GrantProfileCapabilityRequest;
import com.digao.digao_oauth_service.application.dto.authorization.ProfileCapabilityResponse;
import com.digao.digao_oauth_service.domain.authorization.ProfileCapabilityEntity;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/admin/profile-capabilities")
@Validated
public class AdminProfileCapabilitiesController {

    private final ProfileAdminService profileAdminService;

    public AdminProfileCapabilitiesController(ProfileAdminService profileAdminService) {
        this.profileAdminService = profileAdminService;
    }

    @PostMapping
    public ResponseEntity<ProfileCapabilityResponse> create(@RequestBody @Valid GrantProfileCapabilityRequest request, Authentication authentication) {
        ProfileCapabilityEntity entity = profileAdminService.grantCapability(
            request.profileId(),
            request.capabilityId(),
            authentication.getName()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(
            new ProfileCapabilityResponse(
                entity.getId(),
                entity.getProfile().getId(),
                entity.getProfile().getKey(),
                entity.getCapability().getId(),
                entity.getCapability().getKey()
            )
        );
    }
}
