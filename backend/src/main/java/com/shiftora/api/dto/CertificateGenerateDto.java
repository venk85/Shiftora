package com.shiftora.api.dto;

import jakarta.validation.constraints.NotBlank;

public record CertificateGenerateDto(
    @NotBlank String userId,
    String assignmentId,
    @NotBlank String generatedBy) {}
