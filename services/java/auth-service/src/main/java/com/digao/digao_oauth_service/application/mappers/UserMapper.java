package com.digao.digao_oauth_service.application.mappers;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import com.digao.digao_oauth_service.application.dto.users.CreateUserRequest;
import com.digao.digao_oauth_service.application.dto.users.UpdateUserRequest;
import com.digao.digao_oauth_service.application.dto.users.UserResponse;
import com.digao.digao_oauth_service.core.domain.entities.User;
import com.digao.digao_oauth_service.core.domain.enums.UserRole;
import com.digao.digao_oauth_service.helpers.errors.controller.WrongTypeParameter;

public final class UserMapper {
    private UserMapper() {
    }

    public static User toDomain(CreateUserRequest request) {
        return new User(
            null,
            request.username(),
            request.email(),
            request.firstName(),
            request.lastName(),
            request.role(),
            request.enabled()
        );
    }

    public static User toDomain(String id, UpdateUserRequest request) {
        return new User(
            parseUuidOrThrow(id),
            request.username(),
            request.email(),
            request.firstName(),
            request.lastName(),
            request.role(),
            request.enabled()
        );
    }

    public static UserResponse toResponse(User user, List<String> roles, List<String> groups) {
        List<String> safeRoles = roles == null ? List.of() : new ArrayList<>(roles);
        List<String> safeGroups = groups == null ? List.of() : new ArrayList<>(groups);

        String primaryRole = user.getRole() != null ? user.getRole().name() : resolvePrimaryRole(safeRoles);
        String fullName = buildFullName(user.getFirstName(), user.getLastName());

        return new UserResponse(
            user.getId() != null ? user.getId().toString() : null,
            user.getUsername(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            fullName,
            primaryRole,
            user.isEnabled(),
            safeRoles,
            safeGroups
        );
    }

    private static String resolvePrimaryRole(List<String> roles) {
        for (String role : roles) {
            if (role == null) {
                continue;
            }
            String normalized = role.toUpperCase(Locale.ROOT);
            for (UserRole userRole : UserRole.values()) {
                if (userRole.name().equals(normalized)) {
                    return userRole.name();
                }
            }
        }
        return null;
    }

    private static String buildFullName(String firstName, String lastName) {
        String first = firstName == null ? "" : firstName.trim();
        String last = lastName == null ? "" : lastName.trim();
        if (first.isEmpty() && last.isEmpty()) {
            return null;
        }
        if (first.isEmpty()) {
            return last;
        }
        if (last.isEmpty()) {
            return first;
        }
        return first + " " + last;
    }

    private static UUID parseUuidOrThrow(String value) {
        if (value == null || value.isBlank()) {
            throw new WrongTypeParameter("id", "UUID", "null");
        }
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException ex) {
            throw new WrongTypeParameter("id", "UUID", value);
        }
    }
}
