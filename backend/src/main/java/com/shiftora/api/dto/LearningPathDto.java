package com.shiftora.api.dto;

import java.util.List;

public record LearningPathDto(
    AppUserDto user,
    AssignmentDto activeAssignment,
    List<AssignmentDto> assignments,
    int readinessScore,
    int completedModules,
    int totalModules,
    int totalMinutes,
    List<LearningModuleDto> modules) {}
