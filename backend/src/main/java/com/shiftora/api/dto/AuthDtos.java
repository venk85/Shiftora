package com.shiftora.api.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public final class AuthDtos {
  private AuthDtos() {}

  public record LoginRequest(@NotBlank String email, @NotBlank String password) {}

  public record AuthUserDto(
      String email,
      String name,
      String avatar,
      String role,
      String tenantId,
      boolean isSuper,
      List<String> allowedRoles) {}

  public record LoginResponse(String token, long expiresAt, AuthUserDto user) {}
}
