package com.shiftora.api.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiftora.api.domain.TenantEntity;
import com.shiftora.api.dto.PersonaDto;
import com.shiftora.api.dto.SubdivisionDto;
import com.shiftora.api.dto.TenantDto;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class TenantMapper {
  private final ObjectMapper objectMapper;

  public TenantMapper(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  public TenantDto toDto(TenantEntity entity) {
    Map<String, Object> config = entity.getConfig();
    return new TenantDto(
        entity.getId(),
        entity.getName(),
        entity.getAbbr(),
        entity.getType(),
        entity.getSize(),
        entity.getIndustry(),
        read(config, "board", String.class, ""),
        read(config, "location", new TypeReference<>() {}, Map.of()),
        read(config, "udiseCode", String.class, ""),
        read(config, "educationAssignment", new TypeReference<>() {}, Map.of()),
        read(config, "schoolPhotoDataUrl", String.class, ""),
        read(config, "aiName", String.class, "AI Assistant"),
        read(config, "subdivisionNoun", String.class, "Teams"),
        readList(config.get("subdivisions"), new TypeReference<>() {}),
        readList(config.get("roleLabels"), new TypeReference<>() {}),
        read(config, "personas", new TypeReference<>() {}, Map.of()),
        read(config, "brandColor", String.class, "#4069F0"),
        entity.getMaturity(),
        entity.getAdoption(),
        read(config, "aiInstruction", String.class, ""),
        entity.getCreatedAt());
  }

  public TenantEntity toEntity(TenantDto dto) {
    TenantEntity entity = new TenantEntity();
    entity.setId(dto.id() == null || dto.id().isBlank() ? "tn-" + UUID.randomUUID() : dto.id());
    updateEntity(entity, dto);
    entity.setCreatedAt(dto.createdAt() > 0 ? dto.createdAt() : Instant.now().toEpochMilli());
    return entity;
  }

  public void updateEntity(TenantEntity entity, TenantDto dto) {
    entity.setName(dto.name());
    entity.setAbbr(dto.abbr());
    entity.setType(dto.type());
    entity.setSize(dto.size());
    entity.setIndustry(dto.industry());
    entity.setMaturity(dto.maturity());
    entity.setAdoption(dto.adoption());

    Map<String, Object> config = new LinkedHashMap<>();
    config.put("aiName", dto.aiName());
    config.put("board", dto.board() == null ? "" : dto.board());
    config.put("location", dto.location() == null ? Map.of() : dto.location());
    config.put("udiseCode", dto.udiseCode() == null ? "" : dto.udiseCode());
    config.put("educationAssignment", dto.educationAssignment() == null ? Map.of() : dto.educationAssignment());
    config.put("schoolPhotoDataUrl", dto.schoolPhotoDataUrl() == null ? "" : dto.schoolPhotoDataUrl());
    config.put("subdivisionNoun", dto.subdivisionNoun());
    config.put("subdivisions", dto.subdivisions());
    config.put("roleLabels", dto.roleLabels());
    config.put("personas", dto.personas());
    config.put("brandColor", dto.brandColor());
    config.put("aiInstruction", dto.aiInstruction() == null ? "" : dto.aiInstruction());
    entity.setConfig(config);
  }

  private <T> T read(Map<String, Object> map, String key, Class<T> type, T fallback) {
    Object value = map.get(key);
    return value == null ? fallback : objectMapper.convertValue(value, type);
  }

  private <T> T read(Map<String, Object> map, String key, TypeReference<T> type, T fallback) {
    Object value = map.get(key);
    return value == null ? fallback : objectMapper.convertValue(value, type);
  }

  private <T> List<T> readList(Object value, TypeReference<List<T>> type) {
    return value == null ? List.of() : objectMapper.convertValue(value, type);
  }
}
