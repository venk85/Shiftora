package com.shiftora.api.dto;

import java.util.Map;

public record LearningUnitSubmitDto(
    String title,
    String type,
    int estimatedMinutes,
    int sortOrder,
    Map<String, Object> content) {}
