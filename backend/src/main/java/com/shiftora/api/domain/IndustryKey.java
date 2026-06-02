package com.shiftora.api.domain;

public enum IndustryKey {
  edu,
  bfsi,
  gcc,
  health;

  public static IndustryKey fromRequestValue(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }
    return switch (value.trim().toLowerCase()) {
      case "education" -> edu;
      case "healthcare" -> health;
      default -> IndustryKey.valueOf(value.trim().toLowerCase());
    };
  }
}
