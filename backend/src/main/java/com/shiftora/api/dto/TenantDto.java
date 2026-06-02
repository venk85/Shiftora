package com.shiftora.api.dto;

import com.shiftora.api.domain.IndustryKey;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;

public record TenantDto(
    String id,
    @NotBlank String name,
    @NotBlank String abbr,
    @NotBlank String type,
    @PositiveOrZero int size,
    @NotNull IndustryKey industry,
    String board,
    Map<String, String> location,
    String udiseCode,
    Map<String, Object> educationAssignment,
    String schoolPhotoDataUrl,
    @NotBlank String aiName,
    @NotBlank String subdivisionNoun,
    @Valid List<SubdivisionDto> subdivisions,
    @Size(min = 5, max = 5) List<@NotBlank String> roleLabels,
    @Valid Map<String, PersonaDto> personas,
    @NotBlank String brandColor,
    @Min(0) @Max(100) int maturity,
    @Min(0) @Max(100) int adoption,
    String aiInstruction,
    long createdAt
) {}
