package com.shiftora.api.dto;

public record EducationStateDto(
    String stateCode,
    String stateName,
    String blockOfficerTitle,
    String districtOfficerTitle,
    String blockUnitName,
    int udiseBlockDigits
) {}
