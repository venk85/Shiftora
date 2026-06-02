package com.shiftora.api.dto;

public record JourneyStepDto(
    String key,
    String label,
    String path,
    String status,
    int progress,
    Integer score
) {}
