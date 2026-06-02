package com.shiftora.api.dto;

import java.util.List;

public record KnowledgeQuestionDto(
    String id,
    String prompt,
    List<String> options,
    int answerIndex,
    int weight) {}
