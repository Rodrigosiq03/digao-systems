package com.digao.notification.helpers.errors.controller;

import com.digao.notification.helpers.errors.BaseError;

public class WrongTypeParameter extends BaseError {
    public WrongTypeParameter(String fieldName, String fieldTypeExpected, String fieldTypeReceived) {
        super(buildMessage(fieldName, "Tipo incorreto, esperado '" + fieldTypeExpected + "' e recebido '" + fieldTypeReceived + "'"));
    }

    public WrongTypeParameter(String fieldName, String detail) {
        super(buildMessage(fieldName, detail));
    }

    private static String buildMessage(String fieldName, String detail) {
        String base = "Parâmetro " + fieldName + " inválido.";
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
