package com.shiftora.api.service;

import com.shiftora.api.domain.PlatformSettingEntity;
import com.shiftora.api.dto.PlatformSettingsDto;
import com.shiftora.api.repository.PlatformSettingRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PlatformSettingsService {
  private static final String LANGUAGE_ACCESS = "language_access";
  private static final List<String> VALID_LANGUAGES = List.of("en", "ta", "hi");

  private final PlatformSettingRepository settings;

  public PlatformSettingsService(PlatformSettingRepository settings) {
    this.settings = settings;
  }

  @Transactional
  public PlatformSettingsDto get() {
    return settings.findById(LANGUAGE_ACCESS)
        .map(this::toDto)
        .orElseGet(() -> new PlatformSettingsDto(List.of("en"), "en", 0));
  }

  @Transactional
  public PlatformSettingsDto update(PlatformSettingsDto dto) {
    PlatformSettingEntity entity = entity();
    List<String> enabled = normalize(dto.enabledLanguages());
    String active = enabled.contains(dto.activeLanguage()) ? dto.activeLanguage() : "en";
    Map<String, Object> value = new LinkedHashMap<>();
    value.put("enabledLanguages", enabled);
    value.put("activeLanguage", active);
    entity.setValue(value);
    entity.setUpdatedAt(Instant.now().toEpochMilli());
    return toDto(settings.save(entity));
  }

  private PlatformSettingEntity entity() {
    return settings.findById(LANGUAGE_ACCESS).orElseGet(() -> {
      PlatformSettingEntity next = new PlatformSettingEntity();
      next.setKey(LANGUAGE_ACCESS);
      next.setValue(Map.of("enabledLanguages", List.of("en"), "activeLanguage", "en"));
      next.setUpdatedAt(Instant.now().toEpochMilli());
      return settings.save(next);
    });
  }

  private PlatformSettingsDto toDto(PlatformSettingEntity entity) {
    List<String> enabled = normalize(list(entity.getValue().get("enabledLanguages")));
    Object activeValue = entity.getValue().get("activeLanguage");
    String active = activeValue instanceof String language && enabled.contains(language) ? language : "en";
    return new PlatformSettingsDto(enabled, active, entity.getUpdatedAt());
  }

  private List<String> normalize(List<String> languages) {
    List<String> enabled = new ArrayList<>();
    enabled.add("en");
    if (languages != null) {
      for (String language : languages) {
        if (VALID_LANGUAGES.contains(language) && !enabled.contains(language)) enabled.add(language);
      }
    }
    return VALID_LANGUAGES.stream().filter(enabled::contains).toList();
  }

  private List<String> list(Object value) {
    if (!(value instanceof List<?> raw)) return List.of();
    return raw.stream().filter(String.class::isInstance).map(String.class::cast).toList();
  }
}
