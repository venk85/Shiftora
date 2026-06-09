package com.shiftora.api.dto;

import java.util.List;
import java.util.Map;

public record LearningModuleDto(
    String id,
    String tenantId,
    String title,
    String description,
    String level,
    String language,
    int estimatedMinutes,
    String status,
    int sortOrder,
    Map<String, Object> targeting,
    int progress,
    boolean locked,
    List<LearningUnitDto> units,
    boolean mandatory,
    boolean isPlatform) {}
