package com.shiftora.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record SandboxResponseDto(
    @NotBlank String output,
    @NotEmpty List<ScoreDto> scores
) {}
