package com.shiftora.api.dto;

import com.shiftora.api.domain.InputType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record ScenarioInputDto(
    @NotBlank String key,
    @NotBlank String label,
    @NotNull InputType type,
    List<String> options,
    String placeholder,
    String accept
) {}
