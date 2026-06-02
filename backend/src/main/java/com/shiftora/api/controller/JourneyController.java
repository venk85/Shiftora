package com.shiftora.api.controller;

import com.shiftora.api.dto.AuthDtos.AuthUserDto;
import com.shiftora.api.dto.AppUserDto;
import com.shiftora.api.dto.AssignmentDto;
import com.shiftora.api.dto.JourneyDto;
import com.shiftora.api.dto.ReadinessAttemptDto;
import com.shiftora.api.dto.ReadinessCheckDto;
import com.shiftora.api.dto.ReadinessSubmitDto;
import com.shiftora.api.dto.ReadinessTemplateDto;
import com.shiftora.api.service.JourneyService;
import com.shiftora.api.service.UnauthorizedException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class JourneyController {
  private final JourneyService service;

  public JourneyController(JourneyService service) {
    this.service = service;
  }

  @GetMapping("/users/me/journey")
  public JourneyDto journey(
      @RequestParam String tenantId,
      @RequestParam String email,
      @RequestParam(required = false) String assignmentId,
      HttpServletRequest request) {
    requireSelfOrTenantStaff(auth(request), tenantId, email);
    return service.journey(tenantId, email, assignmentId);
  }

  @GetMapping("/users/me/readiness-check")
  public ReadinessCheckDto readinessCheck(
      @RequestParam String tenantId,
      @RequestParam String email,
      @RequestParam(required = false) String assignmentId,
      HttpServletRequest request) {
    requireSelfOrTenantStaff(auth(request), tenantId, email);
    return service.readinessCheck(tenantId, email, assignmentId);
  }

  @PostMapping("/users/me/readiness-check/attempts")
  public ReadinessAttemptDto submitReadiness(
      @RequestParam String tenantId,
      @RequestParam String email,
      @Valid @RequestBody ReadinessSubmitDto dto,
      HttpServletRequest request) {
    requireSelf(auth(request), tenantId, email);
    return service.submitReadiness(tenantId, email, dto);
  }

  @GetMapping("/admin/users")
  public List<AppUserDto> users(@RequestParam String tenantId, HttpServletRequest request) {
    requireTenantAdmin(auth(request), tenantId);
    return service.users(tenantId);
  }

  @PostMapping("/admin/users")
  public AppUserDto createUser(@Valid @RequestBody AppUserDto dto, HttpServletRequest request) {
    requireTenantAdmin(auth(request), dto.tenantId());
    return service.saveUser(dto);
  }

  @PutMapping("/admin/users/{userId}")
  public AppUserDto updateUser(@PathVariable String userId, @Valid @RequestBody AppUserDto dto, HttpServletRequest request) {
    requireTenantAdmin(auth(request), dto.tenantId());
    return service.saveUser(new AppUserDto(
        userId,
        dto.tenantId(),
        dto.email(),
        dto.name(),
        dto.role(),
        dto.avatar(),
        dto.profile()));
  }

  @GetMapping("/admin/assignments")
  public List<AssignmentDto> assignments(@RequestParam String tenantId, HttpServletRequest request) {
    requireTenantAdmin(auth(request), tenantId);
    return service.assignments(tenantId);
  }

  @PostMapping("/admin/assignments")
  public AssignmentDto createAssignment(@Valid @RequestBody AssignmentDto dto, HttpServletRequest request) {
    requireTenantAdmin(auth(request), dto.tenantId());
    return service.saveAssignment(dto);
  }

  @PutMapping("/admin/assignments/{assignmentId}")
  public AssignmentDto updateAssignment(@PathVariable String assignmentId, @Valid @RequestBody AssignmentDto dto, HttpServletRequest request) {
    requireTenantAdmin(auth(request), dto.tenantId());
    return service.saveAssignment(new AssignmentDto(
        assignmentId,
        dto.userId(),
        dto.tenantId(),
        dto.schoolName(),
        dto.grade(),
        dto.division(),
        dto.subject(),
        dto.responsibility(),
        dto.primaryAssignment(),
        dto.active(),
        dto.metadata()));
  }

  @GetMapping("/admin/readiness-templates")
  public List<ReadinessTemplateDto> templates(@RequestParam String tenantId, HttpServletRequest request) {
    requireTenantAdmin(auth(request), tenantId);
    return service.templates(tenantId);
  }

  @PostMapping("/admin/readiness-templates")
  public ReadinessTemplateDto createTemplate(@Valid @RequestBody ReadinessTemplateDto dto, HttpServletRequest request) {
    requireTenantAdmin(auth(request), dto.tenantId());
    return service.saveTemplate(dto);
  }

  @PutMapping("/admin/readiness-templates")
  public ReadinessTemplateDto updateTemplate(@Valid @RequestBody ReadinessTemplateDto dto, HttpServletRequest request) {
    requireTenantAdmin(auth(request), dto.tenantId());
    return service.saveTemplate(dto);
  }

  private AuthUserDto auth(HttpServletRequest request) {
    Object user = request.getAttribute("authUser");
    if (user instanceof AuthUserDto dto) return dto;
    throw new UnauthorizedException("Authentication required");
  }

  private void requireSelf(AuthUserDto user, String tenantId, String email) {
    if (user.isSuper()) return;
    if (tenantId.equals(user.tenantId()) && email.equalsIgnoreCase(user.email())) return;
    throw new UnauthorizedException("You can only submit your own learner progress.");
  }

  private void requireSelfOrTenantStaff(AuthUserDto user, String tenantId, String email) {
    if (user.isSuper() || isTenantStaff(user, tenantId)) return;
    requireSelf(user, tenantId, email);
  }

  private void requireTenantAdmin(AuthUserDto user, String tenantId) {
    if (user.isSuper() || isTenantStaff(user, tenantId)) return;
    throw new UnauthorizedException("You do not have access to manage this tenant.");
  }

  private boolean isTenantStaff(AuthUserDto user, String tenantId) {
    return tenantId.equals(user.tenantId())
        && List.of("admin", "principal", "hod", "beo", "deo", "diet").contains(user.role());
  }
}
