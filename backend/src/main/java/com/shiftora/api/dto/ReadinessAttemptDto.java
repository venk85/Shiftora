package com.shiftora.api.dto;

import java.util.List;
import java.util.Map;

public record ReadinessAttemptDto(
    String id,
    String templateId,
    String assignmentId,
    Map<String, Object> answers,
    int score,
    String level,
    List<String> recommendedModules,
    long createdAt
) {}
