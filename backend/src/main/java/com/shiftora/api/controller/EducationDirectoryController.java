package com.shiftora.api.controller;

import com.shiftora.api.dto.AuthDtos.AuthUserDto;
import com.shiftora.api.dto.EducationAssignmentReviewDto;
import com.shiftora.api.dto.EducationBlockDto;
import com.shiftora.api.dto.EducationOverviewDtos.BeoOverviewDto;
import com.shiftora.api.dto.EducationOverviewDtos.DeoOverviewDto;
import com.shiftora.api.dto.EducationStateDto;
import com.shiftora.api.dto.EducationalDistrictDto;
import com.shiftora.api.dto.UdiseAssignmentDto;
import com.shiftora.api.service.EducationDirectoryService;
import com.shiftora.api.service.EducationOverviewService;
import com.shiftora.api.service.KysEducationMasterSyncService;
import com.shiftora.api.service.UnauthorizedException;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/education")
public class EducationDirectoryController {
  private final EducationDirectoryService service;
  private final EducationOverviewService overviewService;
  private final KysEducationMasterSyncService kysSyncService;

  public EducationDirectoryController(
      EducationDirectoryService service,
      EducationOverviewService overviewService,
      KysEducationMasterSyncService kysSyncService) {
    this.service = service;
    this.overviewService = overviewService;
    this.kysSyncService = kysSyncService;
  }

  @GetMapping("/states")
  public List<EducationStateDto> states() {
    return service.states();
  }

  @GetMapping("/districts")
  public List<EducationalDistrictDto> districts(@RequestParam String stateCode) {
    return service.districts(stateCode);
  }

  @GetMapping("/blocks")
  public List<EducationBlockDto> blocks(@RequestParam String districtCode) {
    return service.blocks(districtCode);
  }

  @GetMapping("/udise/decode")
  public UdiseAssignmentDto decode(@RequestParam String code) {
    return service.decode(code);
  }

  @GetMapping("/assignment-reviews")
  public List<EducationAssignmentReviewDto> reviews() {
    return service.openReviews();
  }

  @GetMapping("/overview/beo")
  public BeoOverviewDto beoOverview(
      @RequestParam(required = false) String tenantId,
      HttpServletRequest request) {
    AuthUserDto user = auth(request);
    if (!user.isSuper() && "beo".equals(user.role())) {
      return overviewService.beoForOfficer(user.tenantId(), user.email());
    }
    if (tenantId == null || tenantId.isBlank()) {
      throw new UnauthorizedException("tenantId is required for this education overview.");
    }
    requireEducationAccess(user, tenantId);
    return overviewService.beo(tenantId);
  }

  @GetMapping("/overview/deo")
  public DeoOverviewDto deoOverview(
      @RequestParam(required = false) String tenantId,
      HttpServletRequest request) {
    AuthUserDto user = auth(request);
    if (!user.isSuper() && "deo".equals(user.role())) {
      return overviewService.deoForOfficer(user.tenantId(), user.email());
    }
    if (tenantId == null || tenantId.isBlank()) {
      throw new UnauthorizedException("tenantId is required for this education overview.");
    }
    requireEducationAccess(user, tenantId);
    return overviewService.deo(tenantId);
  }

  @PostMapping("/assignment-reviews")
  @ResponseStatus(HttpStatus.CREATED)
  public EducationAssignmentReviewDto createReview(@RequestBody Map<String, Object> payload) {
    return service.createReview(
        string(payload.get("tenantId")),
        string(payload.get("udiseCode")),
        string(payload.get("reason")),
        payload);
  }

  @PostMapping("/imports/districts")
  public Map<String, Object> importDistricts(@RequestParam MultipartFile file, HttpServletRequest request) throws Exception {
    requirePlatform(auth(request));
    return service.importDistricts(file);
  }

  @PostMapping("/imports/blocks")
  public Map<String, Object> importBlocks(@RequestParam MultipartFile file, HttpServletRequest request) throws Exception {
    requirePlatform(auth(request));
    return service.importBlocks(file);
  }

  @PostMapping("/sync/kys")
  public Map<String, Object> syncFromKys(
      @RequestParam(required = false) String stateCode,
      @RequestParam(defaultValue = "11") int yearId,
      HttpServletRequest request) {
    requirePlatform(auth(request));
    return kysSyncService.sync(stateCode, yearId);
  }

  private String string(Object value) {
    return value == null ? "" : String.valueOf(value);
  }

  private AuthUserDto auth(HttpServletRequest request) {
    Object user = request.getAttribute("authUser");
    if (user instanceof AuthUserDto dto) return dto;
    throw new UnauthorizedException("Authentication required");
  }

  private void requireEducationAccess(AuthUserDto user, String tenantId) {
    if (user.isSuper()) return;
    if (tenantId.equals(user.tenantId())) return;
    throw new UnauthorizedException("You do not have access to this education overview.");
  }

  private void requirePlatform(AuthUserDto user) {
    if (!user.isSuper()) throw new UnauthorizedException("Platform access required");
  }
}
