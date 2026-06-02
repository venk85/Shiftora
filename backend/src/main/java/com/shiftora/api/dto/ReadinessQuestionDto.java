package com.shiftora.api.dto;

import java.util.List;

public record ReadinessQuestionDto(
    String id,
    String type,
    String prompt,
    List<String> options,
    int weight
) {}
