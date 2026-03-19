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

import com.digao.digao_oauth_service.application.authorization.ProfileAdminService;
import com.digao.digao_oauth_service.application.dto.authorization.CreateProfileRequest;
import com.digao.digao_oauth_service.application.dto.authorization.ProfileResponse;
import com.digao.digao_oauth_service.domain.authorization.ProfileEntity;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/admin/profiles")
@Validated
public class AdminProfilesController {

    private final ProfileAdminService profileAdminService;

    public AdminProfilesController(ProfileAdminService profileAdminService) {
        this.profileAdminService = profileAdminService;
    }

    @GetMapping
    public List<ProfileResponse> list() {
        return profileAdminService.list().stream().map(this::toResponse).toList();
    }

    @PostMapping
    public ResponseEntity<ProfileResponse> create(@RequestBody @Valid CreateProfileRequest request, Authentication authentication) {
        ProfileEntity entity = profileAdminService.create(request.key(), request.name(), authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(entity));
    }

    @PatchMapping("/{profileId}/disable")
    public ProfileResponse disable(@PathVariable Long profileId, Authentication authentication) {
        return toResponse(profileAdminService.disable(profileId, authentication.getName()));
    }

    private ProfileResponse toResponse(ProfileEntity entity) {
        return new ProfileResponse(
            entity.getId(),
            entity.getKey(),
            entity.getName(),
            entity.isEnabled(),
            entity.getDisabledAt(),
            entity.getDisabledBy()
        );
    }
}
