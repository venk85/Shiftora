package com.shiftora.api.dto;

import java.util.Map;

public record KnowledgeAttemptDto(
    String id,
    String knowledgeCheckId,
    String assignmentId,
    Map<String, Object> answers,
    int score,
    boolean passed,
    long createdAt) {}
