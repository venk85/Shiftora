package com.shiftora.api.dto;

import java.util.Map;

public record EducationAssignmentReviewDto(
    String id,
    String tenantId,
    String udiseCode,
    String status,
    String reason,
    Map<String, Object> payload,
    long createdAt
) {}
