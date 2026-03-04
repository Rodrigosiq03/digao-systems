package com.digao.notification.helpers.errors.domain;

import com.digao.notification.helpers.errors.BaseError;

public class EntityError extends BaseError {
    public EntityError(String field) {
        this(field, null);
    }

    public EntityError(String field, String detail) {
        super(buildMessage(field, detail));
    }

    private static String buildMessage(String field, String detail) {
        String base = "Campo " + field + " inválido.";
        if (detail == null || detail.isBlank()) {
            return base;
        }
        String normalized = detail.trim();
        if (!normalized.endsWith(".")) {
            normalized = normalized + ".";
        }
        return base + " " + normalized;
    }
}
