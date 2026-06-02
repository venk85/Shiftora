package com.shiftora.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record ScoreDto(@NotBlank String label, @Min(0) @Max(100) int value) {}
