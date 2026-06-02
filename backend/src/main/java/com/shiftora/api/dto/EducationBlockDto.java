package com.shiftora.api.dto;

public record EducationBlockDto(
    String udiseBlockCode,
    String udiseDistrictCode,
    String stateCode,
    String blockName,
    String beoOfficeName,
    String beoContact
) {}
