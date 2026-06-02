package com.shiftora.api.dto;

import java.util.List;

public record PlatformSettingsDto(
    List<String> enabledLanguages,
    String activeLanguage,
    long updatedAt
) {}
