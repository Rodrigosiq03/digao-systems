package com.digao.digao_oauth_service.helpers.errors.controller;

import com.digao.digao_oauth_service.helpers.errors.BaseError;

public class MissingParameters extends BaseError {
    public MissingParameters(String field) {
        this(field, null);
    }

    public MissingParameters(String field, String detail) {
        super(buildMessage(field, detail));
    }

    private static String buildMessage(String field, String detail) {
        String base = "Parâmetro " + field + " ausente.";
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
