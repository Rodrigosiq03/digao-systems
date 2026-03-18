package com.digao.digao_oauth_service.presentation.controllers;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.digao.digao_oauth_service.application.authorization.AccessResolutionService;
import com.digao.digao_oauth_service.application.dto.authorization.MyAccessResponse;

@RestController
@RequestMapping("/me")
public class MeAccessController {

    private final AccessResolutionService accessResolutionService;

    public MeAccessController(AccessResolutionService accessResolutionService) {
        this.accessResolutionService = accessResolutionService;
    }

    @GetMapping("/access")
    public MyAccessResponse access(Authentication authentication) {
        List<String> portalRoles = authentication.getAuthorities().stream()
            .map(grantedAuthority -> grantedAuthority.getAuthority())
            .filter(authority -> authority.startsWith("ROLE_"))
            .map(authority -> authority.substring("ROLE_".length()))
            .distinct()
            .toList();
        return accessResolutionService.resolve(authentication.getName(), portalRoles);
    }
}
