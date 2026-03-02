package com.digao.digao_oauth_service.presentation.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.digao.digao_oauth_service.application.dto.users.PublicPasswordResetRequest;
import com.digao.digao_oauth_service.application.usecases.users.RequestPasswordResetUseCase;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/password-reset")
@Validated
public class PublicPasswordController {
    private final RequestPasswordResetUseCase requestPasswordResetUseCase;

    public PublicPasswordController(RequestPasswordResetUseCase requestPasswordResetUseCase) {
        this.requestPasswordResetUseCase = requestPasswordResetUseCase;
    }

    @PostMapping
    public ResponseEntity<Void> requestReset(@RequestBody @Valid PublicPasswordResetRequest request) {
        requestPasswordResetUseCase.execute(request);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
