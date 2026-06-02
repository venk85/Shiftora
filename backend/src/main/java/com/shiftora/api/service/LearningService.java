package com.shiftora.api.service;

import com.shiftora.api.domain.AppUserEntity;
import com.shiftora.api.domain.JourneyProgressEntity;
import com.shiftora.api.domain.LearningModuleEntity;
import com.shiftora.api.domain.LearningProgressEntity;
import com.shiftora.api.domain.LearningUnitEntity;
import com.shiftora.api.domain.ReadinessAttemptEntity;
import com.shiftora.api.domain.UserAssignmentEntity;
import com.shiftora.api.dto.AppUserDto;
import com.shiftora.api.dto.AssignmentDto;
import com.shiftora.api.dto.LearningModuleDto;
import com.shiftora.api.dto.LearningPathDto;
import com.shiftora.api.dto.LearningProgressSubmitDto;
import com.shiftora.api.dto.LearningUnitDto;
import com.shiftora.api.repository.AppUserRepository;
import com.shiftora.api.repository.JourneyProgressRepository;
import com.shiftora.api.repository.LearningModuleRepository;
import com.shiftora.api.repository.LearningProgressRepository;
import com.shiftora.api.repository.LearningUnitRepository;
import com.shiftora.api.repository.ReadinessAttemptRepository;
import com.shiftora.api.repository.UserAssignmentRepository;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LearningService {
  private final AppUserRepository users;
  private final UserAssignmentRepository assignments;
  private final ReadinessAttemptRepository attempts;
  private final LearningModuleRepository modules;
  private final LearningUnitRepository units;
  private final LearningProgressRepository progress;
  private final JourneyProgressRepository journeyProgress;

  public LearningService(
      AppUserRepository users,
      UserAssignmentRepository assignments,
      ReadinessAttemptRepository attempts,
      LearningModuleRepository modules,
      LearningUnitRepository units,
      LearningProgressRepository progress,
      JourneyProgressRepository journeyProgress) {
    this.users = users;
    this.assignments = assignments;
    this.attempts = attempts;
    this.modules = modules;
    this.units = units;
    this.progress = progress;
    this.journeyProgress = journeyProgress;
  }

  public LearningPathDto learningPath(String tenantId, String email, String assignmentId) {
    AppUserEntity user = user(tenantId, email);
    List<UserAssignmentEntity> userAssignments =
        assignments.findByUserIdAndActiveTrueOrderByPrimaryAssignmentDescGradeAscDivisionAscSubjectAsc(user.getId());
    UserAssignmentEntity active = activeAssignment(userAssignments, assignmentId);
    int readiness = attempts.findFirstByUserIdAndTenantIdAndAssignmentIdIsNullOrderByCreatedAtDesc(user.getId(), tenantId)
        .map(ReadinessAttemptEntity::getScore)
        .orElse(0);
    Map<String, List<LearningUnitEntity>> unitMap = new LinkedHashMap<>();
    List<LearningModuleEntity> matchedModules = modules.findByTenantIdAndStatusOrderBySortOrderAsc(tenantId, "published")
        .stream()
        .filter(module -> matches(module.getTargeting(), active, readiness))
        .toList();
    List<String> moduleIds = matchedModules.stream().map(LearningModuleEntity::getId).toList();
    if (!moduleIds.isEmpty()) {
      units.findByModuleIdInOrderByModuleIdAscSortOrderAsc(moduleIds)
          .forEach(unit -> unitMap.computeIfAbsent(unit.getModuleId(), key -> new java.util.ArrayList<>()).add(unit));
    }
    List<LearningProgressEntity> savedProgress =
        progress.findByUserIdAndTenantIdAndAssignmentId(user.getId(), tenantId, active.getId());
    List<LearningModuleDto> moduleDtos = matchedModules.stream()
        .map(module -> toModuleDto(module, unitMap.getOrDefault(module.getId(), List.of()), savedProgress))
        .toList();
    int completed = (int) moduleDtos.stream().filter(module -> module.progress() == 100).count();
    int minutes = moduleDtos.stream().mapToInt(LearningModuleDto::estimatedMinutes).sum();
    return new LearningPathDto(
        toDto(user),
        toDto(active),
        userAssignments.stream().map(this::toDto).toList(),
        readiness,
        completed,
        moduleDtos.size(),
        minutes,
        moduleDtos);
  }

  public List<LearningModuleDto> adminModules(String tenantId) {
    return modules.findByTenantIdOrderBySortOrderAsc(tenantId).stream()
        .map(module -> new LearningModuleDto(
            module.getId(),
            module.getTenantId(),
            module.getTitle(),
            module.getDescription(),
            module.getLevel(),
            module.getLanguage(),
            module.getEstimatedMinutes(),
            module.getStatus(),
            module.getSortOrder(),
            module.getTargeting(),
            0,
            false,
            List.of()))
        .toList();
  }

  @Transactional
  public LearningPathDto saveProgress(String tenantId, String email, LearningProgressSubmitDto dto) {
    AppUserEntity user = user(tenantId, email);
    UserAssignmentEntity assignment = assignments.findByIdAndUserId(dto.assignmentId(), user.getId())
        .orElseThrow(() -> new NotFoundException("Assignment not found"));
    LearningModuleEntity module = modules.findById(dto.moduleId())
        .orElseThrow(() -> new NotFoundException("Learning module not found"));
    LearningUnitEntity unit = units.findById(dto.unitId())
        .orElseThrow(() -> new NotFoundException("Learning unit not found"));
    long now = Instant.now().toEpochMilli();
    LearningProgressEntity item = progress
        .findByUserIdAndAssignmentIdAndModuleIdAndUnitId(user.getId(), assignment.getId(), module.getId(), unit.getId())
        .orElseGet(LearningProgressEntity::new);
    if (item.getId() == null) item.setId("lp-" + UUID.randomUUID().toString().substring(0, 8));
    item.setUserId(user.getId());
    item.setTenantId(tenantId);
    item.setAssignmentId(assignment.getId());
    item.setModuleId(module.getId());
    item.setUnitId(unit.getId());
    item.setStatus(dto.status() == null || dto.status().isBlank() ? "completed" : dto.status());
    item.setProgressPercent("completed".equals(item.getStatus()) ? 100 : 50);
    item.setScore(dto.score());
    item.setTimeSpentSeconds(Math.max(0, dto.timeSpentSeconds() == null ? 0 : dto.timeSpentSeconds()));
    item.setCompletedAt("completed".equals(item.getStatus()) ? now : null);
    item.setUpdatedAt(now);
    progress.save(item);
    updateJourneyLearningProgress(user, tenantId, assignment.getId(), now);
    return learningPath(tenantId, email, assignment.getId());
  }

  private void updateJourneyLearningProgress(AppUserEntity user, String tenantId, String assignmentId, long now) {
    LearningPathDto path = learningPath(tenantId, user.getEmail(), assignmentId);
    int value = path.totalModules() == 0 ? 0 : Math.round((path.completedModules() * 100f) / path.totalModules());
    JourneyProgressEntity item = journeyProgress
        .findByUserIdAndTenantIdAndAssignmentIdAndStepKey(user.getId(), tenantId, assignmentId, "learning")
        .orElseGet(JourneyProgressEntity::new);
    if (item.getId() == null) item.setId("jp-" + UUID.randomUUID().toString().substring(0, 8));
    item.setUserId(user.getId());
    item.setTenantId(tenantId);
    item.setAssignmentId(assignmentId);
    item.setStepKey("learning");
    item.setStatus(value == 100 ? "done" : "active");
    item.setProgress(value);
    item.setScore(null);
    item.setUpdatedAt(now);
    journeyProgress.save(item);
  }

  private AppUserEntity user(String tenantId, String email) {
    return users.findByTenantIdAndEmailIgnoreCase(tenantId, email)
        .orElseThrow(() -> new NotFoundException("User not found for tenant"));
  }

  private UserAssignmentEntity activeAssignment(List<UserAssignmentEntity> list, String assignmentId) {
    if (list.isEmpty()) throw new NotFoundException("No active assignments found");
    if (assignmentId != null && !assignmentId.isBlank()) {
      return list.stream()
          .filter(item -> item.getId().equals(assignmentId))
          .findFirst()
          .orElseThrow(() -> new NotFoundException("Assignment not found"));
    }
    return list.stream().filter(UserAssignmentEntity::isPrimaryAssignment).findFirst().orElse(list.get(0));
  }

  private boolean matches(Map<String, Object> targeting, UserAssignmentEntity assignment, int readiness) {
    return matchesValue(targeting.get("schoolName"), assignment.getSchoolName())
        && matchesValue(targeting.get("grade"), assignment.getGrade())
        && matchesValue(targeting.get("division"), assignment.getDivision())
        && matchesValue(targeting.get("subject"), assignment.getSubject())
        && matchesValue(targeting.get("responsibility"), assignment.getResponsibility())
        && readiness >= minReadiness(targeting.get("minReadiness"))
        && readiness <= maxReadiness(targeting.get("maxReadiness"));
  }

  private boolean matchesValue(Object filter, String actual) {
    if (filter == null || String.valueOf(filter).isBlank() || "Any".equalsIgnoreCase(String.valueOf(filter))) return true;
    if (filter instanceof List<?> list) {
      return list.isEmpty() || list.stream().map(String::valueOf).anyMatch(value -> value.equalsIgnoreCase(actual));
    }
    return String.valueOf(filter).equalsIgnoreCase(actual);
  }

  private int minReadiness(Object value) {
    return value == null ? 0 : parseInt(value, 0);
  }

  private int maxReadiness(Object value) {
    return value == null ? 100 : parseInt(value, 100);
  }

  private int parseInt(Object value, int fallback) {
    try {
      return Integer.parseInt(String.valueOf(value));
    } catch (NumberFormatException ex) {
      return fallback;
    }
  }

  private LearningModuleDto toModuleDto(
      LearningModuleEntity module,
      List<LearningUnitEntity> moduleUnits,
      List<LearningProgressEntity> savedProgress) {
    int completedUnits = (int) moduleUnits.stream()
        .filter(unit -> savedProgress.stream().anyMatch(item -> unit.getId().equals(item.getUnitId()) && "completed".equals(item.getStatus())))
        .count();
    int moduleProgress = moduleUnits.isEmpty() ? 0 : Math.round((completedUnits * 100f) / moduleUnits.size());
    return new LearningModuleDto(
        module.getId(),
        module.getTenantId(),
        module.getTitle(),
        module.getDescription(),
        module.getLevel(),
        module.getLanguage(),
        module.getEstimatedMinutes(),
        module.getStatus(),
        module.getSortOrder(),
        module.getTargeting(),
        moduleProgress,
        false,
        moduleUnits.stream().map(unit -> toUnitDto(unit, savedProgress)).toList());
  }

  private LearningUnitDto toUnitDto(LearningUnitEntity unit, List<LearningProgressEntity> savedProgress) {
    String status = savedProgress.stream()
        .filter(item -> unit.getId().equals(item.getUnitId()))
        .findFirst()
        .map(LearningProgressEntity::getStatus)
        .orElse("not_started");
    return new LearningUnitDto(
        unit.getId(),
        unit.getModuleId(),
        unit.getTitle(),
        unit.getType(),
        unit.getEstimatedMinutes(),
        unit.getSortOrder(),
        unit.getContent(),
        status);
  }

  private AppUserDto toDto(AppUserEntity entity) {
    return new AppUserDto(entity.getId(), entity.getTenantId(), entity.getEmail(), entity.getName(), entity.getRole(), entity.getAvatar(), entity.getProfile());
  }

  private AssignmentDto toDto(UserAssignmentEntity entity) {
    return new AssignmentDto(entity.getId(), entity.getUserId(), entity.getTenantId(), entity.getSchoolName(), entity.getGrade(), entity.getDivision(), entity.getSubject(), entity.getResponsibility(), entity.isPrimaryAssignment(), entity.isActive(), entity.getMetadata());
  }
}
