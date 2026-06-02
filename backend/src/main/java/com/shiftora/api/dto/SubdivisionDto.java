package com.shiftora.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

public record SubdivisionDto(
    @NotBlank String id,
    @NotBlank String name,
    @NotBlank String hod,
    String leadRole,
    String description,
    @Min(0) @Max(100) int maturity,
    @Min(0) @Max(100) int adoption,
    @PositiveOrZero int staff
) {}
