package com.shiftora.api.dto;

import java.util.Map;

public record ReadinessSubmitDto(
    String templateId,
    String assignmentId,
    Map<String, Object> answers
) {}
