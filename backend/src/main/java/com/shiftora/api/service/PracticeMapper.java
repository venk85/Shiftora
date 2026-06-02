package com.shiftora.api.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiftora.api.domain.PracticeEntryEntity;
import com.shiftora.api.dto.PracticeEntryDto;
import com.shiftora.api.dto.ScoreDto;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class PracticeMapper {
  private final ObjectMapper objectMapper;

  public PracticeMapper(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  public PracticeEntryDto toDto(PracticeEntryEntity entity) {
    Map<String, Object> payload = entity.getPayload();
    return new PracticeEntryDto(
        entity.getId(),
        entity.getScenarioId(),
        entity.getScenarioTitle(),
        entity.getTenantId(),
        convert(payload.get("inputs"), new TypeReference<>() {}, Map.of()),
        convert(payload.get("output"), String.class, ""),
        convert(payload.get("scores"), new TypeReference<>() {}, List.of()),
        entity.getCreatedAt());
  }

  public PracticeEntryEntity toEntity(PracticeEntryDto dto) {
    PracticeEntryEntity entity = new PracticeEntryEntity();
    entity.setId(dto.id() == null || dto.id().isBlank() ? "pe-" + UUID.randomUUID() : dto.id());
    entity.setTenantId(dto.tenantId());
    entity.setScenarioId(dto.scenarioId());
    entity.setScenarioTitle(dto.scenarioTitle());
    entity.setCreatedAt(dto.createdAt() > 0 ? dto.createdAt() : Instant.now().toEpochMilli());

    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("inputs", dto.inputs() == null ? Map.of() : dto.inputs());
    payload.put("output", dto.output() == null ? "" : dto.output());
    payload.put("scores", dto.scores() == null ? List.of() : dto.scores());
    entity.setPayload(payload);
    return entity;
  }

  private <T> T convert(Object value, Class<T> type, T fallback) {
    return value == null ? fallback : objectMapper.convertValue(value, type);
  }

  private <T> T convert(Object value, TypeReference<T> type, T fallback) {
    return value == null ? fallback : objectMapper.convertValue(value, type);
  }
}
