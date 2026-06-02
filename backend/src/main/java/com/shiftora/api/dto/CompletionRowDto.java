package com.shiftora.api.dto;

public record CompletionRowDto(
    AppUserDto user,
    AssignmentDto assignment,
    int readinessScore,
    int learningProgress,
    boolean workshopCompleted,
    Integer knowledgeScore,
    boolean knowledgePassed,
    boolean certificateEligible,
    String certificateStatus,
    String certificateNumber,
    String emailedTo) {}
