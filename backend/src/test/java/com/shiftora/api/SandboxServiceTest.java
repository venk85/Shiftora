package com.shiftora.api;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiftora.api.dto.SandboxRequestDto;
import com.shiftora.api.service.SandboxService;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class SandboxServiceTest {
  @Test
  void requiresClaudeApiKeyInBackendEnvironment() {
    var service = new SandboxService(new ObjectMapper(), "", "claude-sonnet-4-5");
    var request = new SandboxRequestDto(
        "Shiksha AI",
        "Lesson Plan Lab",
        "Create a lesson plan.",
        "Use classroom-ready language.",
        List.of("Curriculum alignment"),
        Map.of("topic", "Fractions"));

    assertThatThrownBy(() -> service.run(request))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("ANTHROPIC_API_KEY is not configured");
  }

  @Test
  void rejectsValuesThatDoNotLookLikeAnthropicKeys() {
    var service = new SandboxService(new ObjectMapper(), "not-an-anthropic-key", "claude-sonnet-4-5");
    var request = new SandboxRequestDto(
        "Shiksha AI",
        "Lesson Plan Lab",
        "Create a lesson plan.",
        "Use classroom-ready language.",
        List.of("Curriculum alignment"),
        Map.of("topic", "Fractions"));

    assertThatThrownBy(() -> service.run(request))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("should start with sk-ant-");
  }
}
