package com.digao.digao_oauth_service.helpers.errors;

public class BaseError extends RuntimeException {
    private final String message;

    public BaseError(String message) {
        super(message);
        this.message = message;
    }

    @Override
    public String getMessage() {
        return message;
    }
}
