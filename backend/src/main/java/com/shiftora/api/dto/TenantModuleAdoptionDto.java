package com.shiftora.api.dto;

import java.util.Map;

public record TenantModuleAdoptionDto(
    String id,
    String tenantId,
    String moduleId,
    boolean mandatory,
    int sortOrder,
    Map<String, Object> targeting,
    long adoptedAt) {}
