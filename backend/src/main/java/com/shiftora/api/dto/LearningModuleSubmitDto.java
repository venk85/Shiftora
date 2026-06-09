package com.shiftora.api.dto;

import java.util.Map;

public record LearningModuleSubmitDto(
    String title,
    String description,
    String level,
    String language,
    int estimatedMinutes,
    String status,
    boolean mandatory,
    int sortOrder,
    Map<String, Object> targeting) {}
