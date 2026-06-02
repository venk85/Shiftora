package com.shiftora.api.dto;

public record EducationalDistrictDto(
    String udiseDistrictCode,
    String stateCode,
    String districtName,
    String deoOfficeName,
    String deoContact
) {}
