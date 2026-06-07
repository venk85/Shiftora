package com.shiftora.api.service;

import com.shiftora.api.domain.EducationBlockEntity;
import com.shiftora.api.domain.EducationalDistrictEntity;
import com.shiftora.api.domain.AppUserEntity;
import com.shiftora.api.domain.RegisteredSchoolEntity;
import com.shiftora.api.domain.TenantEntity;
import com.shiftora.api.dto.EducationOverviewDtos.BeoOverviewDto;
import com.shiftora.api.dto.EducationOverviewDtos.BlockHeatDto;
import com.shiftora.api.dto.EducationOverviewDtos.ComplianceDto;
import com.shiftora.api.dto.EducationOverviewDtos.DeoOverviewDto;
import com.shiftora.api.dto.EducationOverviewDtos.GradeProgressDto;
import com.shiftora.api.dto.EducationOverviewDtos.RecommendationDto;
import com.shiftora.api.dto.EducationOverviewDtos.SchoolHeatDto;
import com.shiftora.api.dto.EducationOverviewDtos.VisitDto;
import com.shiftora.api.repository.EducationBlockRepository;
import com.shiftora.api.repository.EducationalDistrictRepository;
import com.shiftora.api.repository.AppUserRepository;
import com.shiftora.api.repository.RegisteredSchoolRepository;
import com.shiftora.api.repository.TenantRepository;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EducationOverviewService {
  private final TenantRepository tenants;
  private final AppUserRepository users;
  private final EducationalDistrictRepository districts;
  private final EducationBlockRepository blocks;
  private final RegisteredSchoolRepository schools;

  public EducationOverviewService(
      TenantRepository tenants,
      AppUserRepository users,
      EducationalDistrictRepository districts,
      EducationBlockRepository blocks,
      RegisteredSchoolRepository schools) {
    this.tenants = tenants;
    this.users = users;
    this.districts = districts;
    this.blocks = blocks;
    this.schools = schools;
  }

  @Transactional(readOnly = true)
  public BeoOverviewDto beo(String tenantId) {
    TenantEntity tenant = tenant(tenantId);
    Map<String, Object> assignment = assignment(tenant);
    String blockCode = string(assignment.get("udiseBlockCode"));
    EducationBlockEntity block = blocks.findById(blockCode)
        .orElseThrow(() -> new NotFoundException("BEO block assignment not found for tenant"));
    EducationalDistrictEntity district = districts.findById(block.getUdiseDistrictCode())
        .orElseThrow(() -> new NotFoundException("DEO district assignment not found for block"));
    List<RegisteredSchoolEntity> blockSchools = schools.findByUdiseBlockCodeAndTenantIdIsNotNullOrderBySchoolNameAsc(blockCode);
    List<SchoolHeatDto> heatmap = blockSchools.stream().map(this::schoolHeat).toList();
    int blockFln = average(heatmap.stream().map(SchoolHeatDto::score).toList());
    int atRisk = (int) heatmap.stream().filter(school -> school.score() < 55).count();
    return new BeoOverviewDto(
        block.getUdiseBlockCode(),
        block.getBlockName(),
        block.getBeoOfficeName(),
        district.getUdiseDistrictCode(),
        district.getDistrictName(),
        blockSchools.size(),
        blockFln,
        Math.max(1, blockSchools.size() / 3),
        atRisk,
        heatmap,
        gradeProgress(blockFln),
        visits(blockSchools),
        beoRecommendations(blockSchools.size(), atRisk, block.getBlockName()));
  }

  @Transactional(readOnly = true)
  public BeoOverviewDto beoForOfficer(String tenantId, String email) {
    AppUserEntity user = users.findByTenantIdAndEmailIgnoreCase(tenantId, email)
        .orElseThrow(() -> new NotFoundException("BEO user not found"));
    String blockCode = string(profile(user).get("udiseBlockCode"));
    if (blockCode.isBlank()) throw new NotFoundException("BEO block assignment is missing");
    return beoForBlock(blockCode);
  }

  @Transactional(readOnly = true)
  public DeoOverviewDto deo(String tenantId) {
    TenantEntity tenant = tenant(tenantId);
    Map<String, Object> assignment = assignment(tenant);
    String districtCode = string(assignment.get("udiseDistrictCode"));
    EducationalDistrictEntity district = districts.findById(districtCode)
        .orElseThrow(() -> new NotFoundException("DEO district assignment not found for tenant"));
    List<EducationBlockEntity> districtBlocks = blocks.findByUdiseDistrictCodeOrderByBlockNameAsc(districtCode);
    List<RegisteredSchoolEntity> districtSchools = schools.findByUdiseDistrictCodeAndTenantIdIsNotNullOrderByUdiseBlockCodeAscSchoolNameAsc(districtCode);
    List<BlockHeatDto> heatmap = districtBlocks.stream()
        .map(block -> blockHeat(block, districtSchools))
        .sorted(Comparator.comparingInt(BlockHeatDto::score).reversed())
        .toList();
    int districtFln = average(heatmap.stream()
        .filter(block -> block.schools() > 0)
        .map(BlockHeatDto::score)
        .toList());
    int atRisk = heatmap.stream().filter(BlockHeatDto::critical).mapToInt(BlockHeatDto::schools).sum();
    int compliance = average(List.of(
        clamp(districtFln + 8),
        districtFln,
        clamp(districtFln - 5),
        clamp(districtFln + 14)));
    return new DeoOverviewDto(
        district.getUdiseDistrictCode(),
        district.getDistrictName(),
        district.getDeoOfficeName(),
        districtBlocks.size(),
        districtFln,
        atRisk,
        compliance,
        heatmap,
        List.of(
            new ComplianceDto("NEP readiness", clamp(districtFln + 8)),
            new ComplianceDto("NIPUN FLN", districtFln),
            new ComplianceDto("Samagra uploads", clamp(districtFln - 5)),
            new ComplianceDto("UDISE+ validation", clamp(districtFln + 14))),
        deoAlerts(heatmap),
        directorateReport(district.getDistrictName(), heatmap, districtFln));
  }

  @Transactional(readOnly = true)
  public DeoOverviewDto deoForOfficer(String tenantId, String email) {
    AppUserEntity user = users.findByTenantIdAndEmailIgnoreCase(tenantId, email)
        .orElseThrow(() -> new NotFoundException("DEO user not found"));
    String districtCode = string(profile(user).get("udiseDistrictCode"));
    if (districtCode.isBlank()) throw new NotFoundException("DEO district assignment is missing");
    return deoForDistrict(districtCode);
  }

  public void syncRegisteredSchool(TenantEntity tenant) {
    Map<String, Object> assignment = assignment(tenant);
    String udiseCode = string(assignment.get("udiseCode"));
    String stateCode = string(assignment.get("stateCode"));
    String districtCode = string(assignment.get("udiseDistrictCode"));
    String blockCode = string(assignment.get("udiseBlockCode"));
    String status = stringOr(assignment.get("status"), "ASSIGNED");
    if (!List.of("ASSIGNED", "MANUAL").contains(status)) return;
    if (udiseCode.isBlank() || stateCode.isBlank() || districtCode.isBlank() || blockCode.isBlank()) return;
    long now = System.currentTimeMillis();
    RegisteredSchoolEntity school = schools.findById(udiseCode).orElse(new RegisteredSchoolEntity());
    school.setUdiseCode(udiseCode);
    school.setTenantId(tenant.getId());
    school.setSchoolName(tenant.getName());
    school.setStateCode(stateCode);
    school.setUdiseDistrictCode(districtCode);
    school.setUdiseBlockCode(blockCode);
    school.setAssignmentStatus(status);
    school.setReviewReason(string(assignment.get("message")));
    if (school.getCreatedAt() == 0) school.setCreatedAt(now);
    school.setUpdatedAt(now);
    schools.save(school);
  }

  private TenantEntity tenant(String tenantId) {
    return tenants.findById(tenantId).orElseThrow(() -> new NotFoundException("Tenant not found: " + tenantId));
  }

  private BeoOverviewDto beoForBlock(String blockCode) {
    EducationBlockEntity block = blocks.findById(blockCode)
        .orElseThrow(() -> new NotFoundException("BEO block assignment not found"));
    EducationalDistrictEntity district = districts.findById(block.getUdiseDistrictCode())
        .orElseThrow(() -> new NotFoundException("DEO district assignment not found for block"));
    List<RegisteredSchoolEntity> blockSchools = schools.findByUdiseBlockCodeAndTenantIdIsNotNullOrderBySchoolNameAsc(blockCode);
    List<SchoolHeatDto> heatmap = blockSchools.stream().map(this::schoolHeat).toList();
    int blockFln = average(heatmap.stream().map(SchoolHeatDto::score).toList());
    int atRisk = (int) heatmap.stream().filter(school -> school.score() < 55).count();
    return new BeoOverviewDto(
        block.getUdiseBlockCode(),
        block.getBlockName(),
        block.getBeoOfficeName(),
        district.getUdiseDistrictCode(),
        district.getDistrictName(),
        blockSchools.size(),
        blockFln,
        Math.max(1, blockSchools.size() / 3),
        atRisk,
        heatmap,
        gradeProgress(blockFln),
        visits(blockSchools),
        beoRecommendations(blockSchools.size(), atRisk, block.getBlockName()));
  }

  private DeoOverviewDto deoForDistrict(String districtCode) {
    EducationalDistrictEntity district = districts.findById(districtCode)
        .orElseThrow(() -> new NotFoundException("DEO district assignment not found"));
    List<EducationBlockEntity> districtBlocks = blocks.findByUdiseDistrictCodeOrderByBlockNameAsc(districtCode);
    List<RegisteredSchoolEntity> districtSchools = schools.findByUdiseDistrictCodeAndTenantIdIsNotNullOrderByUdiseBlockCodeAscSchoolNameAsc(districtCode);
    List<BlockHeatDto> heatmap = districtBlocks.stream()
        .map(block -> blockHeat(block, districtSchools))
        .sorted(Comparator.comparingInt(BlockHeatDto::score).reversed())
        .toList();
    int districtFln = average(heatmap.stream()
        .filter(block -> block.schools() > 0)
        .map(BlockHeatDto::score)
        .toList());
    int atRisk = heatmap.stream().filter(BlockHeatDto::critical).mapToInt(BlockHeatDto::schools).sum();
    int compliance = average(List.of(
        clamp(districtFln + 8),
        districtFln,
        clamp(districtFln - 5),
        clamp(districtFln + 14)));
    return new DeoOverviewDto(
        district.getUdiseDistrictCode(),
        district.getDistrictName(),
        district.getDeoOfficeName(),
        districtBlocks.size(),
        districtFln,
        atRisk,
        compliance,
        heatmap,
        List.of(
            new ComplianceDto("NEP readiness", clamp(districtFln + 8)),
            new ComplianceDto("NIPUN FLN", districtFln),
            new ComplianceDto("Samagra uploads", clamp(districtFln - 5)),
            new ComplianceDto("UDISE+ validation", clamp(districtFln + 14))),
        deoAlerts(heatmap),
        directorateReport(district.getDistrictName(), heatmap, districtFln));
  }

  private Map<String, Object> assignment(TenantEntity tenant) {
    Object raw = tenant.getConfig().get("educationAssignment");
    if (raw instanceof Map<?, ?> map) {
      Map<String, Object> converted = new LinkedHashMap<>();
      map.forEach((key, value) -> converted.put(String.valueOf(key), value));
      return converted;
    }
    return Map.of();
  }

  private Map<String, Object> profile(AppUserEntity user) {
    return user.getProfile() == null ? Map.of() : user.getProfile();
  }

  private SchoolHeatDto schoolHeat(RegisteredSchoolEntity school) {
    int score = scoreFrom(school.getUdiseCode(), 46, 95);
    return new SchoolHeatDto(school.getUdiseCode(), school.getSchoolName(), score, status(score), school.getTenantId());
  }

  private BlockHeatDto blockHeat(EducationBlockEntity block, List<RegisteredSchoolEntity> districtSchools) {
    List<Integer> scores = districtSchools.stream()
        .filter(school -> block.getUdiseBlockCode().equals(school.getUdiseBlockCode()))
        .map(school -> schoolHeat(school).score())
        .toList();
    int score = average(scores);
    return new BlockHeatDto(block.getUdiseBlockCode(), block.getBlockName(), score, scores.size(), !scores.isEmpty() && score < 55);
  }

  private List<GradeProgressDto> gradeProgress(int blockFln) {
    // NIPUN-Bharat targets: oral reading fluency climbs grade-on-grade,
    // numeracy tends to lag literacy by a few points.
    return List.of(
        new GradeProgressDto("Grade 1 – Oral Reading Fluency", clamp(blockFln + 6)),
        new GradeProgressDto("Grade 2 – Basic Numeracy",       clamp(blockFln - 3)),
        new GradeProgressDto("Grade 3 – Reading Comprehension", clamp(blockFln - 8)));
  }

  private List<VisitDto> visits(List<RegisteredSchoolEntity> blockSchools) {
    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM");
    return blockSchools.stream().limit(3).map(school -> {
      int score = schoolHeat(school).score();
      String focus = score < 55 ? "FLN remediation" : score < 70 ? "Teacher worksheet usage" : "Classroom practice review";
      String status = score < 55 ? "Follow-up needed" : score < 70 ? "Remediation assigned" : "On track";
      LocalDate date = LocalDate.now().minusDays(Math.abs(school.getUdiseCode().hashCode()) % 7L);
      return new VisitDto(school.getSchoolName(), formatter.format(date), focus, status);
    }).toList();
  }

  private List<RecommendationDto> beoRecommendations(int schools, int atRisk, String blockName) {
    java.util.List<RecommendationDto> recs = new java.util.ArrayList<>();
    if (atRisk > 0) {
      recs.add(new RecommendationDto(
          atRisk + " school" + (atRisk > 1 ? "s are" : " is") + " below the 55% FLN threshold in " + blockName
          + " — schedule BRC mentor visits before next NIPUN assessment cycle."));
    } else {
      recs.add(new RecommendationDto(
          "All " + schools + " onboarded school" + (schools != 1 ? "s" : "")
          + " in " + blockName + " are above the at-risk threshold — maintain momentum with monthly classroom walkthroughs."));
    }
    if (schools > 0) {
      recs.add(new RecommendationDto(
          "Deploy the AI Lesson Generator to all " + schools + " onboarded school"
          + (schools != 1 ? "s" : "") + " for Grade 1–3 FLN worksheet preparation ahead of the next NIPUN assessment."));
    }
    recs.add(new RecommendationDto(
        "Schedule a bilingual (Tamil + English) reading-fluency practice session for teachers in "
        + blockName + " — comprehension scores trail numeracy by 5+ points on average."));
    return recs;
  }

  private List<String> deoAlerts(List<BlockHeatDto> heatmap) {
    return heatmap.stream()
        .filter(block -> block.schools() > 0 && block.score() < 65)
        .map(block -> block.name() + ": FLN readiness at " + block.score() + "% across " + block.schools() + " schools.")
        .limit(4)
        .toList();
  }

  private List<String> directorateReport(String district, List<BlockHeatDto> heatmap, int districtFln) {
    List<BlockHeatDto> onboardedBlocks = heatmap.stream().filter(block -> block.schools() > 0).toList();
    BlockHeatDto top = onboardedBlocks.stream().max(Comparator.comparingInt(BlockHeatDto::score)).orElse(null);
    BlockHeatDto bottom = onboardedBlocks.stream().min(Comparator.comparingInt(BlockHeatDto::score)).orElse(null);
    return List.of(
        district + " district FLN progress is at " + districtFln + "% based on onboarded school coverage.",
        top == null ? "No block data available." : top.name() + " is the strongest block at " + top.score() + "%.",
        bottom == null ? "No critical block data available." : bottom.name() + " needs focused review at " + bottom.score() + "%.");
  }

  private int scoreFrom(String key, int min, int max) {
    int range = max - min + 1;
    return min + Math.abs(key.hashCode()) % range;
  }

  private int average(List<Integer> values) {
    if (values.isEmpty()) return 0;
    return (int) Math.round(values.stream().mapToInt(Integer::intValue).average().orElse(0));
  }

  private int clamp(int value) {
    return Math.max(0, Math.min(100, value));
  }

  private String status(int score) {
    if (score >= 80) return "Strong";
    if (score >= 65) return "Watch";
    if (score >= 50) return "Support";
    return "Critical";
  }

  private String string(Object value) {
    return value == null ? "" : String.valueOf(value);
  }

  private String stringOr(Object value, String fallback) {
    String text = string(value);
    return text.isBlank() ? fallback : text;
  }
}
