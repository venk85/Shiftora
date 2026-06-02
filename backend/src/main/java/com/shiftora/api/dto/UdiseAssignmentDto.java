package com.shiftora.api.dto;

public record UdiseAssignmentDto(
    String status,
    String message,
    String udiseCode,
    String stateCode,
    String stateName,
    String udiseDistrictCode,
    String districtName,
    String districtOfficerTitle,
    String districtOfficerOffice,
    String districtOfficerContact,
    String udiseBlockCode,
    String blockName,
    String blockUnitName,
    String blockOfficerTitle,
    String blockOfficerOffice,
    String blockOfficerContact,
    // School-level fields — populated when the UDISE code is found in tn_school_master
    String schoolName,
    String schoolType,
    Integer staffCount,
    String boardName
) {}
