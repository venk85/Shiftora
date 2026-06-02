package com.shiftora.api.service;

import com.shiftora.api.domain.EducationAssignmentReviewEntity;
import com.shiftora.api.domain.EducationBlockEntity;
import com.shiftora.api.domain.EducationStateEntity;
import com.shiftora.api.domain.EducationalDistrictEntity;
import com.shiftora.api.domain.TnSchoolMasterEntity;
import com.shiftora.api.dto.EducationAssignmentReviewDto;
import com.shiftora.api.dto.EducationBlockDto;
import com.shiftora.api.dto.EducationStateDto;
import com.shiftora.api.dto.EducationalDistrictDto;
import com.shiftora.api.dto.UdiseAssignmentDto;
import com.shiftora.api.repository.EducationAssignmentReviewRepository;
import com.shiftora.api.repository.EducationBlockRepository;
import com.shiftora.api.repository.EducationStateRepository;
import com.shiftora.api.repository.EducationalDistrictRepository;
import com.shiftora.api.repository.TnSchoolMasterRepository;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.time.Instant;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class EducationDirectoryService {
  private static final String STATE_CODE_PATTERN = "\\d{2}";
  private static final String DISTRICT_CODE_PATTERN = "\\d{4}";
  private static final String BLOCK_CODE_PATTERN = "\\d{6}";
  private static final String UDISE_PATTERN = "\\d{11}";

  private final EducationStateRepository states;
  private final EducationalDistrictRepository districts;
  private final EducationBlockRepository blocks;
  private final EducationAssignmentReviewRepository reviews;
  private final TnSchoolMasterRepository schoolMaster;

  public EducationDirectoryService(
      EducationStateRepository states,
      EducationalDistrictRepository districts,
      EducationBlockRepository blocks,
      EducationAssignmentReviewRepository reviews,
      TnSchoolMasterRepository schoolMaster) {
    this.states = states;
    this.districts = districts;
    this.blocks = blocks;
    this.reviews = reviews;
    this.schoolMaster = schoolMaster;
  }

  public List<EducationStateDto> states() {
    return states.findAllByOrderByStateNameAsc().stream().map(this::toDto).toList();
  }

  public List<EducationalDistrictDto> districts(String stateCode) {
    return districts.findByStateCodeOrderByDistrictNameAsc(stateCode).stream().map(this::toDto).toList();
  }

  public List<EducationBlockDto> blocks(String districtCode) {
    return blocks.findByUdiseDistrictCodeOrderByBlockNameAsc(districtCode).stream().map(this::toDto).toList();
  }

  public UdiseAssignmentDto decode(String udiseCode) {
    if (udiseCode == null || !udiseCode.matches(UDISE_PATTERN)) {
      return error("UDISE code must be exactly 11 digits: state(2) + district(2) + block(2) + school(5)", udiseCode, "", "", "");
    }
    String stateCode = udiseCode.substring(0, 2);
    EducationStateEntity state = states.findById(stateCode).orElse(null);
    if (state == null) return error("Unknown state code: " + stateCode, udiseCode, stateCode, "", "");

    String districtCode = udiseCode.substring(0, 4);
    EducationalDistrictEntity district = districts.findById(districtCode).orElse(null);
    int blockEnd = Math.min(4 + state.getUdiseBlockDigits(), udiseCode.length());
    String blockCode = udiseCode.substring(0, blockEnd);
    EducationBlockEntity block = blocks.findById(blockCode).orElse(null);
    if (district == null) {
      return review("District not found. Select manually and report to admin.", udiseCode, state, districtCode, blockCode);
    }
    if (block == null) {
      return review("Block not found in our records. Please select manually and notify your admin.", udiseCode, state, districtCode, blockCode);
    }
    TnSchoolMasterEntity school = schoolMaster.findById(udiseCode).orElse(null);
    String schoolName = school != null ? school.getSchoolName() : null;
    String schoolType = school != null ? school.getSchoolType() : null;
    Integer staffCount = school != null ? school.getTeachingStaff() : null;
    String boardName = school != null ? inferBoard(school.getSchoolName(), state.getStateCode()) : null;
    String message = school != null ? "School details loaded from UDISE master" : "UDISE decoded successfully";
    return new UdiseAssignmentDto(
        "ASSIGNED",
        message,
        udiseCode,
        state.getStateCode(),
        state.getStateName(),
        district.getUdiseDistrictCode(),
        district.getDistrictName(),
        state.getDistrictOfficerTitle(),
        district.getDeoOfficeName(),
        district.getDeoContact(),
        block.getUdiseBlockCode(),
        block.getBlockName(),
        state.getBlockUnitName(),
        state.getBlockOfficerTitle(),
        block.getBeoOfficeName(),
        block.getBeoContact(),
        schoolName,
        schoolType,
        staffCount,
        boardName);
  }

  private String inferBoard(String schoolName, String stateCode) {
    if (!"33".equals(stateCode)) return null;
    if (schoolName != null && schoolName.toUpperCase().contains("MODEL SCHOOL")) return "CBSE";
    return "Tamil Nadu State Board";
  }

  @Transactional
  public EducationAssignmentReviewDto createReview(String tenantId, String udiseCode, String reason, Map<String, Object> payload) {
    EducationAssignmentReviewEntity entity = new EducationAssignmentReviewEntity();
    entity.setId("ear-" + UUID.randomUUID().toString().substring(0, 8));
    entity.setTenantId(tenantId);
    entity.setUdiseCode(udiseCode);
    entity.setStatus("OPEN");
    entity.setReason(reason == null || reason.isBlank() ? "Assignment requires review" : reason);
    entity.setPayload(payload == null ? Map.of() : payload);
    entity.setCreatedAt(Instant.now().toEpochMilli());
    return toDto(reviews.save(entity));
  }

  public List<EducationAssignmentReviewDto> openReviews() {
    return reviews.findByStatusOrderByCreatedAtDesc("OPEN").stream().map(this::toDto).toList();
  }

  @Transactional
  public Map<String, Object> importDistricts(MultipartFile file) throws IOException {
    int count = 0;
    for (Map<String, String> row : csvRows(file)) {
      String code = requirePattern(row, "udise_district_code", DISTRICT_CODE_PATTERN, "4-digit UDISE district code");
      String stateCode = requirePattern(row, "state_code", STATE_CODE_PATTERN, "2-digit UDISE state/UT code");
      if (!code.startsWith(stateCode)) {
        throw new IllegalArgumentException("UDISE district code " + code + " must start with state code " + stateCode);
      }
      EducationStateEntity state = states.findById(stateCode)
          .orElseThrow(() -> new IllegalArgumentException("Unknown state/UT code in district import: " + stateCode));
      EducationalDistrictEntity entity = districts.findById(code).orElse(new EducationalDistrictEntity());
      entity.setUdiseDistrictCode(code);
      entity.setStateCode(state.getStateCode());
      entity.setDistrictName(required(row, "district_name"));
      entity.setDeoOfficeName(optional(row, "deo_office_name", entity.getDistrictName() + " District Office"));
      entity.setDeoContact(row.getOrDefault("deo_contact", ""));
      districts.save(entity);
      count++;
    }
    return Map.of("imported", count, "type", "educational_districts");
  }

  @Transactional
  public Map<String, Object> importBlocks(MultipartFile file) throws IOException {
    int count = 0;
    for (Map<String, String> row : csvRows(file)) {
      String code = requirePattern(row, "udise_block_code", BLOCK_CODE_PATTERN, "6-digit UDISE block code");
      String districtCode = requirePattern(row, "udise_district_code", DISTRICT_CODE_PATTERN, "4-digit UDISE district code");
      String stateCode = requirePattern(row, "state_code", STATE_CODE_PATTERN, "2-digit UDISE state/UT code");
      if (!districtCode.startsWith(stateCode)) {
        throw new IllegalArgumentException("UDISE district code " + districtCode + " must start with state code " + stateCode);
      }
      if (!code.startsWith(districtCode)) {
        throw new IllegalArgumentException("UDISE block code " + code + " must start with district code " + districtCode);
      }
      states.findById(stateCode)
          .orElseThrow(() -> new IllegalArgumentException("Unknown state/UT code in block import: " + stateCode));
      districts.findById(districtCode)
          .orElseThrow(() -> new IllegalArgumentException("Unknown educational district code in block import: " + districtCode));
      EducationBlockEntity entity = blocks.findById(code).orElse(new EducationBlockEntity());
      entity.setUdiseBlockCode(code);
      entity.setUdiseDistrictCode(districtCode);
      entity.setStateCode(stateCode);
      entity.setBlockName(required(row, "block_name"));
      entity.setBeoOfficeName(optional(row, "beo_office_name", entity.getBlockName() + " Block Office"));
      entity.setBeoContact(row.getOrDefault("beo_contact", ""));
      blocks.save(entity);
      count++;
    }
    return Map.of("imported", count, "type", "blocks");
  }

  private UdiseAssignmentDto review(String message, String udiseCode, EducationStateEntity state, String districtCode, String blockCode) {
    return new UdiseAssignmentDto(
        "NEEDS_REVIEW",
        message,
        udiseCode,
        state.getStateCode(),
        state.getStateName(),
        districtCode,
        "",
        state.getDistrictOfficerTitle(),
        "",
        null,
        blockCode,
        "",
        state.getBlockUnitName(),
        state.getBlockOfficerTitle(),
        "",
        null,
        null,
        null,
        null,
        null);
  }

  private UdiseAssignmentDto error(String message, String udiseCode, String stateCode, String districtCode, String blockCode) {
    return new UdiseAssignmentDto("ERROR", message, udiseCode, stateCode, "", districtCode, "", "", "", null, blockCode, "", "", "", "", null, null, null, null, null);
  }

  private EducationStateDto toDto(EducationStateEntity e) {
    return new EducationStateDto(e.getStateCode(), e.getStateName(), e.getBlockOfficerTitle(), e.getDistrictOfficerTitle(), e.getBlockUnitName(), e.getUdiseBlockDigits());
  }

  private EducationalDistrictDto toDto(EducationalDistrictEntity e) {
    return new EducationalDistrictDto(e.getUdiseDistrictCode(), e.getStateCode(), e.getDistrictName(), e.getDeoOfficeName(), e.getDeoContact());
  }

  private EducationBlockDto toDto(EducationBlockEntity e) {
    return new EducationBlockDto(e.getUdiseBlockCode(), e.getUdiseDistrictCode(), e.getStateCode(), e.getBlockName(), e.getBeoOfficeName(), e.getBeoContact());
  }

  private EducationAssignmentReviewDto toDto(EducationAssignmentReviewEntity e) {
    return new EducationAssignmentReviewDto(e.getId(), e.getTenantId(), e.getUdiseCode(), e.getStatus(), e.getReason(), new LinkedHashMap<>(e.getPayload()), e.getCreatedAt());
  }

  private List<Map<String, String>> csvRows(MultipartFile file) throws IOException {
    try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
      String headerLine = reader.readLine();
      if (headerLine == null || headerLine.isBlank()) return List.of();
      String[] headers = splitCsv(headerLine);
      return reader.lines()
          .filter(line -> !line.isBlank())
          .map(line -> {
            String[] values = splitCsv(line);
            Map<String, String> row = new LinkedHashMap<>();
            for (int i = 0; i < headers.length; i++) {
              row.put(headers[i].trim(), i < values.length ? values[i].trim() : "");
            }
            return row;
          })
          .toList();
    }
  }

  private String[] splitCsv(String line) {
    return line.split(",", -1);
  }

  private String required(Map<String, String> row, String key) {
    String value = row.get(key);
    if (value == null || value.isBlank()) throw new IllegalArgumentException("CSV missing required column/value: " + key);
    return value.trim();
  }

  private String requirePattern(Map<String, String> row, String key, String pattern, String description) {
    String value = required(row, key);
    if (!value.matches(pattern)) {
      throw new IllegalArgumentException("CSV column " + key + " must be a " + description + ": " + value);
    }
    return value;
  }

  private String optional(Map<String, String> row, String key, String fallback) {
    String value = row.get(key);
    return value == null || value.isBlank() ? fallback : value.trim();
  }
}
