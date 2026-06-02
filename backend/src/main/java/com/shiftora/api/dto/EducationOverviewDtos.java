package com.shiftora.api.dto;

import java.util.List;

public final class EducationOverviewDtos {
  private EducationOverviewDtos() {}

  public record SchoolHeatDto(String udiseCode, String name, int score, String status, String tenantId) {}

  public record GradeProgressDto(String grade, int progress) {}

  public record VisitDto(String school, String date, String focus, String status) {}

  public record RecommendationDto(String text) {}

  public record ComplianceDto(String name, int value) {}

  public record BlockHeatDto(String blockCode, String name, int score, int schools, boolean critical) {}

  public record BeoOverviewDto(
      String blockCode,
      String blockName,
      String blockOfficerOffice,
      String districtCode,
      String districtName,
      int schoolsTracked,
      int blockFln,
      int visitsLogged,
      int atRiskSchools,
      List<SchoolHeatDto> schools,
      List<GradeProgressDto> gradeProgress,
      List<VisitDto> visits,
      List<RecommendationDto> recommendations
  ) {}

  public record DeoOverviewDto(
      String districtCode,
      String districtName,
      String districtOfficerOffice,
      int blocks,
      int districtFln,
      int atRiskAlerts,
      int compliance,
      List<BlockHeatDto> blockHeatmap,
      List<ComplianceDto> complianceBars,
      List<String> alerts,
      List<String> directorateReport
  ) {}
}
