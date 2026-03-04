package com.digao.digao_oauth_service.presentation.handlers;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.digao.digao_oauth_service.helpers.errors.BaseError;
import com.digao.digao_oauth_service.helpers.errors.controller.MissingParameters;
import com.digao.digao_oauth_service.helpers.errors.controller.WrongTypeParameter;
import com.digao.digao_oauth_service.helpers.errors.domain.EntityError;
import com.digao.digao_oauth_service.helpers.errors.usecase.DuplicatedItemError;
import com.digao.digao_oauth_service.helpers.errors.usecase.ForbiddenActionError;
import com.digao.digao_oauth_service.helpers.errors.usecase.NoItemsFoundError;

import jakarta.validation.ConstraintViolationException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        List<FieldErrorResponse> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
            .map(this::toFieldError)
            .toList();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse("Dados inválidos.", fieldErrors));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(ConstraintViolationException ex) {
        List<FieldErrorResponse> fieldErrors = ex.getConstraintViolations().stream()
            .map(violation -> new FieldErrorResponse(
                violation.getPropertyPath().toString(),
                violation.getMessage()
            ))
            .toList();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse("Dados inválidos.", fieldErrors));
    }

    @ExceptionHandler(NoItemsFoundError.class)
    public ResponseEntity<ErrorResponse> handleNotFound(NoItemsFoundError ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse(ex.getMessage(), List.of()));
    }

    @ExceptionHandler(DuplicatedItemError.class)
    public ResponseEntity<ErrorResponse> handleDuplicate(DuplicatedItemError ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(new ErrorResponse(ex.getMessage(), List.of()));
    }

    @ExceptionHandler(ForbiddenActionError.class)
    public ResponseEntity<ErrorResponse> handleForbidden(ForbiddenActionError ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(new ErrorResponse(ex.getMessage(), List.of()));
    }

    @ExceptionHandler({MissingParameters.class, WrongTypeParameter.class, EntityError.class})
    public ResponseEntity<ErrorResponse> handleBadRequest(BaseError ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse(ex.getMessage(), List.of()));
    }

    private FieldErrorResponse toFieldError(FieldError error) {
        return new FieldErrorResponse(error.getField(), error.getDefaultMessage());
    }

    public record ErrorResponse(String message, List<FieldErrorResponse> fieldErrors) {
    }

    public record FieldErrorResponse(String field, String message) {
    }
}
