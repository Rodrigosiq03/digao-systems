package com.digao.digao_oauth_service.presentation.controllers;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.digao.digao_oauth_service.application.authorization.UserVpnAccessAdminService;
import com.digao.digao_oauth_service.application.dto.authorization.PutUserVpnAccessRequest;
import com.digao.digao_oauth_service.application.dto.authorization.UserVpnAccessResponse;
import com.digao.digao_oauth_service.domain.authorization.UserVpnAccessEntity;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/admin/users/{userId}/vpn-access")
@Validated
public class AdminUserVpnAccessController {

    private final UserVpnAccessAdminService userVpnAccessAdminService;

    public AdminUserVpnAccessController(UserVpnAccessAdminService userVpnAccessAdminService) {
        this.userVpnAccessAdminService = userVpnAccessAdminService;
    }

    @GetMapping
    public List<UserVpnAccessResponse> list(@PathVariable String userId) {
        return userVpnAccessAdminService.listByUser(userId).stream().map(this::toResponse).toList();
    }

    @PutMapping("/{provider}")
    public UserVpnAccessResponse upsert(
        @PathVariable String userId,
        @PathVariable String provider,
        @RequestBody @Valid PutUserVpnAccessRequest request,
        Authentication authentication
    ) {
        return toResponse(userVpnAccessAdminService.upsert(
            userId,
            provider,
            request.status(),
            request.inviteLink(),
            request.notes(),
            authentication.getName()
        ));
    }

    private UserVpnAccessResponse toResponse(UserVpnAccessEntity entity) {
        return new UserVpnAccessResponse(
            entity.getKeycloakUserId(),
            entity.getProvider(),
            entity.getStatus(),
            entity.getInviteLink(),
            entity.getNotes(),
            entity.getInvitedAt(),
            entity.getActivatedAt(),
            entity.getRevokedAt()
        );
    }
}
