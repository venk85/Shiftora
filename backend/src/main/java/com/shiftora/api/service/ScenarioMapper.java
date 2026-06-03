package com.shiftora.api.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiftora.api.domain.ScenarioEntity;
import com.shiftora.api.dto.ScenarioDto;
import com.shiftora.api.dto.ScenarioInputDto;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class ScenarioMapper {
  private final ObjectMapper objectMapper;

  public ScenarioMapper(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  public ScenarioDto toDto(ScenarioEntity entity) {
    Map<String, Object> config = entity.getConfig();
    return new ScenarioDto(
        entity.getId(),
        entity.getIndustry(),
        entity.getTitle(),
        entity.getDescription(),
        entity.getIcon(),
        read(config.get("inputs"), new TypeReference<>() {}),
        read(config.get("systemPrompt"), String.class, ""),
        read(config.get("scoreLabels"), new TypeReference<>() {}),
        read(config.get("tags"), new TypeReference<>() {}),
        entity.getSortOrder());
  }

  public ScenarioEntity toEntity(ScenarioDto dto) {
    ScenarioEntity entity = new ScenarioEntity();
    entity.setId(dto.id());
    entity.setIndustry(dto.industry());
    entity.setTitle(dto.title());
    entity.setDescription(dto.desc());
    entity.setIcon(dto.icon());
    entity.setSortOrder(dto.sortOrder());
    Map<String, Object> config = new LinkedHashMap<>();
    config.put("inputs", dto.inputs());
    config.put("systemPrompt", dto.systemPrompt());
    config.put("scoreLabels", dto.scoreLabels());
    config.put("tags", dto.tags());
    entity.setConfig(config);
    return entity;
  }

  private <T> T read(Object value, Class<T> type, T fallback) {
    return value == null ? fallback : objectMapper.convertValue(value, type);
  }

  private <T> List<T> read(Object value, TypeReference<List<T>> type) {
    return value == null ? List.of() : objectMapper.convertValue(value, type);
  }
}
