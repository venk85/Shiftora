package com.shiftora.api.dto;

import java.util.Map;

public record AppUserDto(
    String id,
    String tenantId,
    String email,
    String name,
    String role,
    String avatar,
    Map<String, Object> profile
) {}
