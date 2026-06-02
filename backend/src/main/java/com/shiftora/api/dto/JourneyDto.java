package com.shiftora.api.dto;

import java.util.List;

public record JourneyDto(
    AppUserDto user,
    AssignmentDto activeAssignment,
    List<AssignmentDto> assignments,
    List<JourneyStepDto> steps,
    List<JourneyModuleDto> modules,
    JourneyMetricsDto metrics,
    JourneyActionDto nextAction
) {}
