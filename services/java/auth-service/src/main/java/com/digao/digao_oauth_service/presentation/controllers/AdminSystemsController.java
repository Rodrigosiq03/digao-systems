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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.digao.digao_oauth_service.application.authorization.SystemAdminService;
import com.digao.digao_oauth_service.application.dto.authorization.CreateSystemRequest;
import com.digao.digao_oauth_service.application.dto.authorization.SystemResponse;
import com.digao.digao_oauth_service.application.dto.authorization.UpdateSystemRequest;
import com.digao.digao_oauth_service.domain.authorization.SystemEntity;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/admin/systems")
@Validated
public class AdminSystemsController {

    private final SystemAdminService systemAdminService;

    public AdminSystemsController(SystemAdminService systemAdminService) {
        this.systemAdminService = systemAdminService;
    }

    @GetMapping
    public List<SystemResponse> list() {
        return systemAdminService.list().stream()
            .map(this::toResponse)
            .toList();
    }

    @PostMapping
    public ResponseEntity<SystemResponse> create(@RequestBody @Valid CreateSystemRequest request, Authentication authentication) {
        SystemEntity entity = systemAdminService.create(request.key(), request.name(), request.entryUrl(), authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(entity));
    }

    @PutMapping("/{systemId}")
    public SystemResponse update(@PathVariable Long systemId, @RequestBody @Valid UpdateSystemRequest request, Authentication authentication) {
        return toResponse(systemAdminService.update(systemId, request.name(), request.entryUrl(), authentication.getName()));
    }

    @PatchMapping("/{systemId}/disable")
    public SystemResponse disable(@PathVariable Long systemId, Authentication authentication) {
        return toResponse(systemAdminService.disable(systemId, authentication.getName()));
    }

    private SystemResponse toResponse(SystemEntity entity) {
        return new SystemResponse(
            entity.getId(),
            entity.getKey(),
            entity.getName(),
            entity.getEntryUrl(),
            entity.isEnabled(),
            entity.getDisabledAt(),
            entity.getDisabledBy()
        );
    }
}
