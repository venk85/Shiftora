package com.shiftora.api.dto;

public record JourneyMetricsDto(
    int readiness,
    int practiceRuns,
    String confidence,
    int completedSteps
) {}
