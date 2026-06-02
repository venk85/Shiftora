package com.shiftora.api.dto;

import jakarta.validation.constraints.NotBlank;

public record WorkshopCompleteDto(
    @NotBlank String userId,
    String assignmentId,
    @NotBlank String completedBy,
    String notes) {}
