package com.shiftora.api.dto;

import java.util.Map;

public record AssignmentDto(
    String id,
    String userId,
    String tenantId,
    String schoolName,
    String grade,
    String division,
    String subject,
    String responsibility,
    boolean primaryAssignment,
    boolean active,
    Map<String, Object> metadata
) {}
