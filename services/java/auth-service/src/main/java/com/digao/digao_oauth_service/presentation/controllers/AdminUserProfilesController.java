package com.digao.digao_oauth_service.presentation.controllers;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.digao.digao_oauth_service.application.authorization.UserProfileAdminService;
import com.digao.digao_oauth_service.application.dto.authorization.AssignUserProfileRequest;
import com.digao.digao_oauth_service.application.dto.authorization.UserProfileResponse;
import com.digao.digao_oauth_service.domain.authorization.UserProfileEntity;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/admin/user-profiles")
@Validated
public class AdminUserProfilesController {

    private final UserProfileAdminService userProfileAdminService;

    public AdminUserProfilesController(UserProfileAdminService userProfileAdminService) {
        this.userProfileAdminService = userProfileAdminService;
    }

    @GetMapping
    public List<UserProfileResponse> list(@RequestParam String keycloakUserId) {
        return userProfileAdminService.listActiveAssignments(keycloakUserId).stream().map(this::toResponse).toList();
    }

    @PostMapping
    public ResponseEntity<UserProfileResponse> create(@RequestBody @Valid AssignUserProfileRequest request, Authentication authentication) {
        UserProfileEntity entity = userProfileAdminService.assign(request.keycloakUserId(), request.profileId(), authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(entity));
    }

    private UserProfileResponse toResponse(UserProfileEntity entity) {
        return new UserProfileResponse(entity.getId(), entity.getKeycloakUserId(), entity.getProfile().getId(), entity.getProfile().getKey());
    }
}
