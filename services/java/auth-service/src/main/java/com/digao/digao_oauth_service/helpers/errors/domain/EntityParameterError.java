package com.digao.digao_oauth_service.helpers.errors.domain;

public class EntityParameterError extends EntityError {
    public EntityParameterError(String field) {
        super(field, "Não pode ser nulo");
    }

    public EntityParameterError(String field, String detail) {
        super(field, detail);
    }
}
