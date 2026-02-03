package com.digao.digao_oauth_service.presentation.controllers;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.digao.digao_oauth_service.application.dto.users.CreateUserRequest;
import com.digao.digao_oauth_service.application.dto.users.AdminPasswordResetRequest;
import com.digao.digao_oauth_service.application.dto.users.UpdateUserRequest;
import com.digao.digao_oauth_service.application.dto.users.UserResponse;
import com.digao.digao_oauth_service.application.usecases.users.CreateUserUseCase;
import com.digao.digao_oauth_service.application.usecases.users.GetUserUseCase;
import com.digao.digao_oauth_service.application.usecases.users.ListUsersUseCase;
import com.digao.digao_oauth_service.application.usecases.users.ResetUserPasswordUseCase;
import com.digao.digao_oauth_service.application.usecases.users.UpdateUserUseCase;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@RestController
@RequestMapping("/admin/users")
@Validated
public class AdminUsersController {
    private final ListUsersUseCase listUsersUseCase;
    private final GetUserUseCase getUserUseCase;
    private final CreateUserUseCase createUserUseCase;
    private final UpdateUserUseCase updateUserUseCase;
    private final ResetUserPasswordUseCase resetUserPasswordUseCase;

    public AdminUsersController(
        ListUsersUseCase listUsersUseCase,
        GetUserUseCase getUserUseCase,
        CreateUserUseCase createUserUseCase,
        UpdateUserUseCase updateUserUseCase,
        ResetUserPasswordUseCase resetUserPasswordUseCase
    ) {
        this.listUsersUseCase = listUsersUseCase;
        this.getUserUseCase = getUserUseCase;
        this.createUserUseCase = createUserUseCase;
        this.updateUserUseCase = updateUserUseCase;
        this.resetUserPasswordUseCase = resetUserPasswordUseCase;
    }

    @GetMapping
    public List<UserResponse> list(
        @RequestParam @NotNull @Min(0) Integer page,
        @RequestParam @NotNull @Min(1) Integer limit
    ) {
        return listUsersUseCase.execute(page, limit);
    }

    @GetMapping("/{id}")
    public UserResponse get(@PathVariable String id) {
        return getUserUseCase.execute(id);
    }

    @PostMapping
    public ResponseEntity<UserResponse> create(@RequestBody @Valid CreateUserRequest request) {
        UserResponse response = createUserUseCase.execute(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public UserResponse update(
        @PathVariable String id,
        @RequestBody @Valid UpdateUserRequest request
    ) {
        return updateUserUseCase.execute(id, request);
    }

    @PostMapping("/{id}/password-reset")
    public ResponseEntity<Void> resetPassword(
        @PathVariable String id,
        @RequestBody @Valid AdminPasswordResetRequest request
    ) {
        resetUserPasswordUseCase.execute(id, request);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
