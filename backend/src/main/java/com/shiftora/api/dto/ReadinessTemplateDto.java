package com.shiftora.api.dto;

import java.util.List;
import java.util.Map;

public record ReadinessTemplateDto(
    String id,
    String tenantId,
    String name,
    String description,
    String status,
    int sortOrder,
    Map<String, Object> targeting,
    List<ReadinessQuestionDto> questions,
    long updatedAt
) {}
