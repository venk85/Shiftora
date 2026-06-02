package com.shiftora.api.dto;

import java.util.Map;

public record LearningUnitDto(
    String id,
    String moduleId,
    String title,
    String type,
    int estimatedMinutes,
    int sortOrder,
    Map<String, Object> content,
    String status) {}
