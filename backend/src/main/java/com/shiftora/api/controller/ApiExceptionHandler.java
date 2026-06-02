package com.shiftora.api.controller;

import com.shiftora.api.service.NotFoundException;
import com.shiftora.api.service.UnauthorizedException;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {
  @ExceptionHandler(NotFoundException.class)
  ResponseEntity<Map<String, String>> notFound(NotFoundException ex) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", ex.getMessage()));
  }

  @ExceptionHandler(UnauthorizedException.class)
  ResponseEntity<Map<String, String>> unauthorized(UnauthorizedException ex) {
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ex.getMessage()));
  }

  @ExceptionHandler(IllegalArgumentException.class)
  ResponseEntity<Map<String, String>> badRequest(IllegalArgumentException ex) {
    return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
  }

  @ExceptionHandler(IllegalStateException.class)
  ResponseEntity<Map<String, String>> failedDependency(IllegalStateException ex) {
    return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("message", ex.getMessage()));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<Map<String, Object>> validation(MethodArgumentNotValidException ex) {
    Map<String, String> fields = new LinkedHashMap<>();
    ex.getBindingResult().getFieldErrors()
        .forEach(err -> fields.putIfAbsent(err.getField(), err.getDefaultMessage()));
    String summary = fields.isEmpty() ? "Validation failed" : "Validation failed: " + String.join(", ", fields.values());
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("message", summary);
    body.put("fields", fields);
    return ResponseEntity.badRequest().body(body);
  }
}
