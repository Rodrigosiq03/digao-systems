package com.digao.digao_oauth_service.helpers.errors.usecase;

import com.digao.digao_oauth_service.helpers.errors.BaseError;

public class NoItemsFoundError extends BaseError {
    public NoItemsFoundError(String resourceName) {
        super(buildMessage(resourceName));
    }

    private static String buildMessage(String resourceName) {
        if (resourceName == null || resourceName.isBlank()) {
            return "Nenhum item encontrado.";
        }
        return "Nenhum item encontrado para " + resourceName + ".";
    }
}
