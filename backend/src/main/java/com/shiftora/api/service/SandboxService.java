package com.shiftora.api.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiftora.api.dto.SandboxRequestDto;
import com.shiftora.api.dto.SandboxResponseDto;
import com.shiftora.api.dto.ScoreDto;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class SandboxService {
  private final ObjectMapper objectMapper;
  private final HttpClient httpClient;
  private final String apiKey;
  private final String model;

  @Autowired
  public SandboxService(
      ObjectMapper objectMapper,
      @Value("${anthropic.api-key:${ANTHROPIC_API_KEY:${CLAUDE_API_KEY:}}}") String apiKey,
      @Value("${anthropic.model:${ANTHROPIC_MODEL:claude-sonnet-4-5}}") String model) {
    this(objectMapper, HttpClient.newHttpClient(), apiKey, model);
  }

  SandboxService(ObjectMapper objectMapper, HttpClient httpClient, String apiKey, String model) {
    this.objectMapper = objectMapper;
    this.httpClient = httpClient;
    this.apiKey = cleanConfigValue(apiKey);
    var cleanedModel = cleanConfigValue(model);
    this.model = cleanedModel.isBlank() ? "claude-sonnet-4-5" : cleanedModel;
  }

  private String cleanConfigValue(String value) {
    if (value == null) return "";
    var cleaned = value.trim();
    if (cleaned.length() >= 2
        && ((cleaned.startsWith("\"") && cleaned.endsWith("\""))
            || (cleaned.startsWith("'") && cleaned.endsWith("'")))) {
      return cleaned.substring(1, cleaned.length() - 1).trim();
    }
    return cleaned;
  }

  public SandboxResponseDto run(SandboxRequestDto request) {
    if (apiKey.isBlank()) {
      throw new IllegalStateException(
          "ANTHROPIC_API_KEY is not configured. Add your Claude API key to the backend environment.");
    }
    if (!apiKey.startsWith("sk-ant-")) {
      throw new IllegalStateException(
          "ANTHROPIC_API_KEY does not look like an Anthropic Console key. It should start with sk-ant-.");
    }

    var labels = request.scoreLabels();
    var system = buildSystemPrompt(request, labels);
    var userMessage = buildUserMessage(request);
    var body = Map.of(
        "model", model,
        "max_tokens", 2400,
        "system", system,
        "messages", List.of(Map.of("role", "user", "content", userMessage)),
        "tools", List.of(deliverResponseTool(labels)),
        "tool_choice", Map.of("type", "tool", "name", "deliver_response"));

    try {
      var httpRequest = HttpRequest.newBuilder(URI.create("https://api.anthropic.com/v1/messages"))
          .header("x-api-key", apiKey)
          .header("anthropic-version", "2023-06-01")
          .header("Content-Type", "application/json")
          .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
          .build();
      var response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
      return parseResponse(response.statusCode(), response.body(), labels);
    } catch (IOException ex) {
      throw new IllegalStateException("Claude API request failed. Please try again.", ex);
    } catch (InterruptedException ex) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException("Claude API request was interrupted. Please try again.", ex);
    }
  }

  private String buildSystemPrompt(SandboxRequestDto request, List<String> labels) {
    var tenantInstruction = request.tenantInstruction() == null ? "" : request.tenantInstruction();
    return request.systemPrompt()
        + "\n\n"
        + tenantInstruction
        + "\n\nAlways respond by calling the deliver_response tool. The output field must be helpful, well-structured markdown. The scores field must contain exactly one entry per requested label ("
        + String.join(", ", labels)
        + "), each with an integer value 75-98 reflecting the quality of THIS response on that dimension.";
  }

  private String buildUserMessage(SandboxRequestDto request) {
    var lines = new ArrayList<String>();
    var inputs = request.inputs() == null ? Map.<String, String>of() : request.inputs();
    inputs.forEach((key, value) -> lines.add("**" + key + "**: " + (value == null || value.isBlank() ? "(not provided)" : value)));
    return "Scenario: " + request.scenarioTitle() + "\n\nInputs:\n" + String.join("\n", lines)
        + "\n\nGenerate the response now using the deliver_response tool.";
  }

  private Map<String, Object> deliverResponseTool(List<String> labels) {
    return Map.of(
        "name", "deliver_response",
        "description", "Deliver the final AI response with quality self-scores.",
        "input_schema", Map.of(
            "type", "object",
            "properties", Map.of(
                "output", Map.of("type", "string", "description", "Markdown-formatted response."),
                "scores", Map.of(
                    "type", "array",
                    "items", Map.of(
                        "type", "object",
                        "properties", Map.of(
                            "label", Map.of("type", "string", "enum", labels),
                            "value", Map.of("type", "integer", "minimum", 0, "maximum", 100)),
                        "required", List.of("label", "value"),
                        "additionalProperties", false))),
            "required", List.of("output", "scores"),
            "additionalProperties", false));
  }

  private SandboxResponseDto parseResponse(int status, String body, List<String> labels) throws IOException {
    if (status == 429) {
      throw new IllegalStateException("Rate limit reached. Please wait a moment and try again.");
    }
    if (status == 402) {
      throw new IllegalStateException("Claude API credits exhausted. Add funds in Anthropic Console Usage to keep generating.");
    }
    if (status == 401 || status == 403) {
      throw new IllegalStateException("Claude API authentication failed. Check ANTHROPIC_API_KEY.");
    }
    if (status < 200 || status >= 300) {
      throw new IllegalStateException("Claude API error (" + status + "). Please try again.");
    }

    var root = objectMapper.readTree(body);
    SandboxResponseDto parsed = parseToolUse(root);
    if (parsed == null || parsed.output().isBlank()) {
      parsed = new SandboxResponseDto(parseTextContent(root), defaultScores(labels));
    }
    return new SandboxResponseDto(parsed.output(), normalizeScores(parsed.scores(), labels));
  }

  private SandboxResponseDto parseToolUse(JsonNode root) {
    var content = root.path("content");
    if (!content.isArray()) return null;
    for (JsonNode block : content) {
      if ("tool_use".equals(block.path("type").asText())
          && "deliver_response".equals(block.path("name").asText())) {
        var input = block.path("input");
        if (!input.isObject() || !input.path("output").isTextual()) return null;
        var scores = objectMapper.convertValue(input.path("scores"), new TypeReference<List<ScoreDto>>() {});
        return new SandboxResponseDto(input.path("output").asText(), scores == null ? List.of() : scores);
      }
    }
    return null;
  }

  private String parseTextContent(JsonNode root) {
    var content = root.path("content");
    if (!content.isArray()) return "The AI did not return a response. Please try again.";
    var lines = new ArrayList<String>();
    for (JsonNode block : content) {
      if ("text".equals(block.path("type").asText()) && block.path("text").isTextual()) {
        lines.add(block.path("text").asText());
      }
    }
    return lines.isEmpty() ? "The AI did not return a response. Please try again." : String.join("\n\n", lines);
  }

  private List<ScoreDto> normalizeScores(List<ScoreDto> scores, List<String> labels) {
    var normalized = new ArrayList<ScoreDto>();
    for (String label : labels) {
      var value = scores.stream()
          .filter(score -> label.equals(score.label()))
          .map(ScoreDto::value)
          .findFirst()
          .orElse(85);
      normalized.add(new ScoreDto(label, Math.max(0, Math.min(100, value))));
    }
    return normalized;
  }

  private List<ScoreDto> defaultScores(List<String> labels) {
    return labels.stream().map(label -> new ScoreDto(label, 85)).toList();
  }
}
