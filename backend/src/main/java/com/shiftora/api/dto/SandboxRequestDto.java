package com.shiftora.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;

public record SandboxRequestDto(
    @NotBlank @Size(max = 80) String aiName,
    @NotBlank @Size(max = 200) String scenarioTitle,
    @NotBlank @Size(max = 4000) String systemPrompt,
    @Size(max = 2000) String tenantInstruction,
    @NotEmpty @Size(max = 5) List<@NotBlank @Size(max = 80) String> scoreLabels,
    Map<String, @Size(max = 5000) String> inputs
) {}
