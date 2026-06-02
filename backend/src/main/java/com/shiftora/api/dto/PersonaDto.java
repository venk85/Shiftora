package com.shiftora.api.dto;

import jakarta.validation.constraints.NotBlank;

public record PersonaDto(@NotBlank String name, @NotBlank String title, @NotBlank String avatar) {}
