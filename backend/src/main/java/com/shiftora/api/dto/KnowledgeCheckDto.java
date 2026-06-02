package com.shiftora.api.dto;

import java.util.List;

public record KnowledgeCheckDto(
    String id,
    String title,
    String description,
    int passScore,
    boolean workshopCompleted,
    boolean available,
    String lockedReason,
    AssignmentDto assignment,
    List<AssignmentDto> availableAssignments,
    List<KnowledgeQuestionDto> questions,
    KnowledgeAttemptDto latestAttempt) {}
