package com.digao.digao_oauth_service.helpers.errors.usecase;

import com.digao.digao_oauth_service.helpers.errors.BaseError;

public class ForbiddenActionError extends BaseError {
    public ForbiddenActionError(String actionName) {
        super(buildMessage(actionName));
    }

    private static String buildMessage(String actionName) {
        if (actionName == null || actionName.isBlank()) {
            return "Ação não permitida.";
        }
        return "Ação não permitida: " + actionName + ".";
    }
}
