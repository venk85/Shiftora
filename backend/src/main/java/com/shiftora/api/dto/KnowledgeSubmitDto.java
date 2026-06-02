package com.shiftora.api.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.Map;

public record KnowledgeSubmitDto(
    @NotBlank String knowledgeCheckId,
    String assignmentId,
    Map<String, Object> answers) {}
