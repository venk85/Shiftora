package com.shiftora.api.dto;

import com.shiftora.api.domain.IndustryKey;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record ScenarioDto(
    @NotBlank String id,
    @NotNull IndustryKey industry,
    @NotBlank String title,
    @NotBlank String desc,
    @NotBlank String icon,
    @Valid List<ScenarioInputDto> inputs,
    @NotBlank String systemPrompt,
    @NotEmpty List<@NotBlank String> scoreLabels,
    List<String> tags,
    int sortOrder
) {}
