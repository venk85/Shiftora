package com.shiftora.api.dto;

import java.util.List;

public record ReadinessCheckDto(
    String templateId,
    String title,
    String description,
    AssignmentDto assignment,
    List<AssignmentDto> availableAssignments,
    List<ReadinessQuestionDto> questions,
    ReadinessAttemptDto latestAttempt
) {}
