package com.shiftora.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.Map;

public record PracticeEntryDto(
    String id,
    @NotBlank String scenarioId,
    @NotBlank String scenarioTitle,
    @NotBlank String tenantId,
    Map<String, String> inputs,
    String output,
    @Valid List<ScoreDto> scores,
    long createdAt
) {}
