package com.digao.digao_oauth_service.helpers.errors.domain;

public class EntityParameterTypeError extends EntityError {
    public EntityParameterTypeError(String field, String expectedType, String receivedType) {
        super(field, "Tipo incorreto, esperado '" + expectedType + "' e recebido '" + receivedType + "'");
    }

    public EntityParameterTypeError(String field, String detail) {
        super(field, detail);
    }
}
