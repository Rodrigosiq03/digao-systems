package com.digao.notification.helpers.errors.usecase;

import com.digao.notification.helpers.errors.BaseError;

public class DuplicatedItemError extends BaseError {
    public DuplicatedItemError(String resourceName) {
        super(buildMessage(resourceName));
    }

    private static String buildMessage(String resourceName) {
        if (resourceName == null || resourceName.isBlank()) {
            return "Item duplicado.";
        }
        return "Item duplicado para " + resourceName + ".";
    }
}
