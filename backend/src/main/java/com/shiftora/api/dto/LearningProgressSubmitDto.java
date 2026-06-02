package com.shiftora.api.dto;

import jakarta.validation.constraints.NotBlank;

public record LearningProgressSubmitDto(
    @NotBlank String assignmentId,
    @NotBlank String moduleId,
    @NotBlank String unitId,
    String status,
    Integer score,
    Integer timeSpentSeconds) {}
