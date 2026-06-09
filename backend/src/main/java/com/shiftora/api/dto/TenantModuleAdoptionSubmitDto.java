package com.shiftora.api.dto;

import java.util.Map;

public record TenantModuleAdoptionSubmitDto(
    String moduleId,
    boolean mandatory,
    int sortOrder,
    Map<String, Object> targeting) {}
