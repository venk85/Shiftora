package com.shiftora.api.service;

import com.shiftora.api.domain.AppUserEntity;
import com.shiftora.api.domain.JourneyProgressEntity;
import com.shiftora.api.domain.LearningModuleEntity;
import com.shiftora.api.domain.LearningProgressEntity;
import com.shiftora.api.domain.LearningUnitEntity;
import com.shiftora.api.domain.ReadinessAttemptEntity;
import com.shiftora.api.domain.TenantModuleAdoptionEntity;
import com.shiftora.api.domain.UserAssignmentEntity;
import com.shiftora.api.dto.AppUserDto;
import com.shiftora.api.dto.AssignmentDto;
import com.shiftora.api.dto.LearningModuleDto;
import com.shiftora.api.dto.LearningModuleSubmitDto;
import com.shiftora.api.dto.LearningPathDto;
import com.shiftora.api.dto.LearningProgressSubmitDto;
import com.shiftora.api.dto.LearningUnitDto;
import com.shiftora.api.dto.LearningUnitSubmitDto;
import com.shiftora.api.dto.TenantModuleAdoptionDto;
import com.shiftora.api.dto.TenantModuleAdoptionSubmitDto;
import com.shiftora.api.repository.AppUserRepository;
import com.shiftora.api.repository.JourneyProgressRepository;
import com.shiftora.api.repository.LearningModuleRepository;
import com.shiftora.api.repository.LearningProgressRepository;
import com.shiftora.api.repository.LearningUnitRepository;
import com.shiftora.api.repository.ReadinessAttemptRepository;
import com.shiftora.api.repository.TenantModuleAdoptionRepository;
import com.shiftora.api.repository.TenantRepository;
import com.shiftora.api.repository.UserAssignmentRepository;
import java.time.Instant;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Stream;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LearningService {

  private record MatchCandidate(
      LearningModuleEntity module,
      Map<String, Object> effectiveTargeting,
      boolean mandatory,
      int effectiveSortOrder) {}

  private final AppUserRepository users;
  private final UserAssignmentRepository assignments;
  private final ReadinessAttemptRepository attempts;
  private final LearningModuleRepository modules;
  private final LearningUnitRepository units;
  private final LearningProgressRepository progress;
  private final JourneyProgressRepository journeyProgress;
  private final TenantModuleAdoptionRepository adoptions;
  private final TenantRepository tenants;

  public LearningService(
      AppUserRepository users,
      UserAssignmentRepository assignments,
      ReadinessAttemptRepository attempts,
      LearningModuleRepository modules,
      LearningUnitRepository units,
      LearningProgressRepository progress,
      JourneyProgressRepository journeyProgress,
      TenantModuleAdoptionRepository adoptions,
      TenantRepository tenants) {
    this.users = users;
    this.assignments = assignments;
    this.attempts = attempts;
    this.modules = modules;
    this.units = units;
    this.progress = progress;
    this.journeyProgress = journeyProgress;
    this.adoptions = adoptions;
    this.tenants = tenants;
  }

  // ── Learner: get personalised learning path ──────────────────────────────

  public LearningPathDto learningPath(String tenantId, String email, String assignmentId) {
    AppUserEntity user = user(tenantId, email);
    List<UserAssignmentEntity> userAssignments =
        assignments.findByUserIdAndActiveTrueOrderByPrimaryAssignmentDescGradeAscDivisionAscSubjectAsc(user.getId());
    UserAssignmentEntity active = activeAssignment(userAssignments, assignmentId);

    int readiness = attempts
        .findFirstByUserIdAndTenantIdAndAssignmentIdIsNullOrderByCreatedAtDesc(user.getId(), tenantId)
        .map(ReadinessAttemptEntity::getScore)
        .orElse(0);

    String tenantBoard = tenants.findById(tenantId)
        .map(t -> Optional.ofNullable(t.getConfig().get("board")).map(String::valueOf).orElse(""))
        .orElse("");

    List<MatchCandidate> candidates = buildCandidates(tenantId);
    List<LearningModuleEntity> matchedModules = candidates.stream()
        .filter(c -> matches(c.effectiveTargeting(), active, readiness, tenantBoard))
        .sorted(Comparator.comparingInt(MatchCandidate::effectiveSortOrder))
        .map(MatchCandidate::module)
        .toList();

    Map<String, List<LearningUnitEntity>> unitMap = new LinkedHashMap<>();
    List<String> moduleIds = matchedModules.stream().map(LearningModuleEntity::getId).toList();
    if (!moduleIds.isEmpty()) {
      units.findByModuleIdInOrderByModuleIdAscSortOrderAsc(moduleIds)
          .forEach(unit -> unitMap.computeIfAbsent(unit.getModuleId(), k -> new java.util.ArrayList<>()).add(unit));
    }

    // mandatory flag from adoption if present
    Map<String, Boolean> mandatoryMap = buildMandatoryMap(tenantId);

    List<LearningProgressEntity> savedProgress =
        progress.findByUserIdAndTenantIdAndAssignmentId(user.getId(), tenantId, active.getId());

    List<LearningModuleDto> moduleDtos = matchedModules.stream()
        .map(m -> toModuleDto(m, unitMap.getOrDefault(m.getId(), List.of()), savedProgress,
            mandatoryMap.getOrDefault(m.getId(), m.isMandatory())))
        .toList();

    int completed = (int) moduleDtos.stream().filter(m -> m.progress() == 100).count();
    int minutes = moduleDtos.stream().mapToInt(LearningModuleDto::estimatedMinutes).sum();
    return new LearningPathDto(toDto(user), toDto(active),
        userAssignments.stream().map(this::toDto).toList(),
        readiness, completed, moduleDtos.size(), minutes, moduleDtos);
  }

  // ── Admin: list modules (own + adopted) ──────────────────────────────────

  public List<LearningModuleDto> adminModules(String tenantId) {
    Map<String, Boolean> mandatoryMap = buildMandatoryMap(tenantId);
    List<MatchCandidate> candidates = buildCandidates(tenantId);
    return candidates.stream()
        .sorted(Comparator.comparingInt(MatchCandidate::effectiveSortOrder))
        .map(c -> new LearningModuleDto(
            c.module().getId(), c.module().getTenantId(), c.module().getTitle(),
            c.module().getDescription(), c.module().getLevel(), c.module().getLanguage(),
            c.module().getEstimatedMinutes(), c.module().getStatus(), c.effectiveSortOrder(),
            c.effectiveTargeting(), 0, false, List.of(),
            mandatoryMap.getOrDefault(c.module().getId(), c.module().isMandatory()),
            c.module().isIsPlatform()))
        .toList();
  }

  // ── Admin: platform catalog (all published platform modules + isAdopted) ─

  public List<LearningModuleDto> platformCatalog(String tenantId) {
    List<TenantModuleAdoptionEntity> tenantAdoptions = adoptions.findByTenantIdOrderBySortOrderAsc(tenantId);
    java.util.Set<String> adoptedIds = tenantAdoptions.stream()
        .map(TenantModuleAdoptionEntity::getModuleId)
        .collect(java.util.stream.Collectors.toSet());
    return modules.findByIsPlatformTrueAndStatusOrderBySortOrderAsc("published").stream()
        .map(m -> new LearningModuleDto(
            m.getId(), m.getTenantId(), m.getTitle(), m.getDescription(), m.getLevel(),
            m.getLanguage(), m.getEstimatedMinutes(), m.getStatus(), m.getSortOrder(),
            m.getTargeting(), 0, adoptedIds.contains(m.getId()), List.of(),
            m.isMandatory(), true))
        .toList();
  }

  // ── Admin: own module CRUD ────────────────────────────────────────────────

  @Transactional
  public LearningModuleDto createModule(String tenantId, LearningModuleSubmitDto dto) {
    long now = Instant.now().toEpochMilli();
    LearningModuleEntity entity = new LearningModuleEntity();
    entity.setId("lm-" + UUID.randomUUID().toString().substring(0, 8));
    entity.setTenantId(tenantId);
    applyModuleFields(entity, dto, now);
    entity.setCreatedAt(now);
    return toModuleDto(modules.save(entity), List.of(), List.of(), dto.mandatory());
  }

  @Transactional
  public LearningModuleDto updateModule(String tenantId, String moduleId, LearningModuleSubmitDto dto) {
    LearningModuleEntity entity = modules.findById(moduleId)
        .filter(m -> tenantId.equals(m.getTenantId()))
        .orElseThrow(() -> new NotFoundException("Module not found for tenant"));
    applyModuleFields(entity, dto, Instant.now().toEpochMilli());
    return toModuleDto(modules.save(entity), List.of(), List.of(), dto.mandatory());
  }

  @Transactional
  public void deleteModule(String tenantId, String moduleId) {
    LearningModuleEntity entity = modules.findById(moduleId)
        .filter(m -> tenantId.equals(m.getTenantId()))
        .orElseThrow(() -> new NotFoundException("Module not found for tenant"));
    units.deleteByModuleId(moduleId);
    modules.delete(entity);
  }

  @Transactional
  public LearningUnitDto addUnit(String moduleId, LearningUnitSubmitDto dto) {
    LearningModuleEntity module = modules.findById(moduleId)
        .orElseThrow(() -> new NotFoundException("Module not found"));
    LearningUnitEntity entity = new LearningUnitEntity();
    entity.setId("lu-" + UUID.randomUUID().toString().substring(0, 8));
    entity.setModuleId(module.getId());
    applyUnitFields(entity, dto);
    updateModuleMinutes(module);
    return toUnitDto(units.save(entity), List.of());
  }

  @Transactional
  public LearningUnitDto updateUnit(String unitId, LearningUnitSubmitDto dto) {
    LearningUnitEntity entity = units.findById(unitId)
        .orElseThrow(() -> new NotFoundException("Unit not found"));
    applyUnitFields(entity, dto);
    LearningUnitEntity saved = units.save(entity);
    modules.findById(saved.getModuleId()).ifPresent(this::updateModuleMinutes);
    return toUnitDto(saved, List.of());
  }

  @Transactional
  public void deleteUnit(String unitId) {
    LearningUnitEntity entity = units.findById(unitId)
        .orElseThrow(() -> new NotFoundException("Unit not found"));
    String moduleId = entity.getModuleId();
    units.delete(entity);
    modules.findById(moduleId).ifPresent(this::updateModuleMinutes);
  }

  // ── Admin: adoption CRUD ─────────────────────────────────────────────────

  @Transactional
  public TenantModuleAdoptionDto adoptModule(String tenantId, TenantModuleAdoptionSubmitDto dto) {
    modules.findById(dto.moduleId())
        .orElseThrow(() -> new NotFoundException("Platform module not found"));
    long now = Instant.now().toEpochMilli();
    TenantModuleAdoptionEntity entity = adoptions
        .findByTenantIdAndModuleId(tenantId, dto.moduleId())
        .orElseGet(TenantModuleAdoptionEntity::new);
    if (entity.getId() == null) {
      entity.setId("tma-" + UUID.randomUUID().toString().substring(0, 8));
      entity.setAdoptedAt(now);
    }
    entity.setTenantId(tenantId);
    entity.setModuleId(dto.moduleId());
    entity.setMandatory(dto.mandatory());
    entity.setSortOrder(dto.sortOrder());
    entity.setTargeting(dto.targeting() == null ? Map.of() : dto.targeting());
    return toAdoptionDto(adoptions.save(entity));
  }

  @Transactional
  public TenantModuleAdoptionDto updateAdoption(String tenantId, String moduleId, TenantModuleAdoptionSubmitDto dto) {
    TenantModuleAdoptionEntity entity = adoptions
        .findByTenantIdAndModuleId(tenantId, moduleId)
        .orElseThrow(() -> new NotFoundException("Adoption not found"));
    entity.setMandatory(dto.mandatory());
    entity.setSortOrder(dto.sortOrder());
    entity.setTargeting(dto.targeting() == null ? Map.of() : dto.targeting());
    return toAdoptionDto(adoptions.save(entity));
  }

  @Transactional
  public void removeAdoption(String tenantId, String moduleId) {
    adoptions.deleteByTenantIdAndModuleId(tenantId, moduleId);
  }

  // ── Platform admin: module CRUD ───────────────────────────────────────────

  @Transactional
  public LearningModuleDto createPlatformModule(LearningModuleSubmitDto dto) {
    long now = Instant.now().toEpochMilli();
    LearningModuleEntity entity = new LearningModuleEntity();
    entity.setId("pm-" + UUID.randomUUID().toString().substring(0, 8));
    entity.setTenantId(null);
    entity.setIsPlatform(true);
    applyModuleFields(entity, dto, now);
    entity.setCreatedAt(now);
    return toModuleDto(modules.save(entity), List.of(), List.of(), dto.mandatory());
  }

  @Transactional
  public LearningModuleDto updatePlatformModule(String moduleId, LearningModuleSubmitDto dto) {
    LearningModuleEntity entity = modules.findById(moduleId)
        .filter(LearningModuleEntity::isIsPlatform)
        .orElseThrow(() -> new NotFoundException("Platform module not found"));
    applyModuleFields(entity, dto, Instant.now().toEpochMilli());
    return toModuleDto(modules.save(entity), List.of(), List.of(), dto.mandatory());
  }

  @Transactional
  public void deletePlatformModule(String moduleId) {
    LearningModuleEntity entity = modules.findById(moduleId)
        .filter(LearningModuleEntity::isIsPlatform)
        .orElseThrow(() -> new NotFoundException("Platform module not found"));
    units.deleteByModuleId(moduleId);
    modules.delete(entity);
  }

  public List<LearningModuleDto> platformModules() {
    return modules.findByIsPlatformTrueAndStatusOrderBySortOrderAsc("published").stream()
        .map(m -> toModuleDto(m, List.of(), List.of(), m.isMandatory()))
        .toList();
  }

  // ── Save learning progress ────────────────────────────────────────────────

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

  // ── Private helpers ───────────────────────────────────────────────────────

  private List<MatchCandidate> buildCandidates(String tenantId) {
    List<LearningModuleEntity> ownModules =
        modules.findByTenantIdAndStatusOrderBySortOrderAsc(tenantId, "published");
    List<TenantModuleAdoptionEntity> tenantAdoptions =
        adoptions.findByTenantIdOrderBySortOrderAsc(tenantId);
    List<String> adoptedIds = tenantAdoptions.stream()
        .map(TenantModuleAdoptionEntity::getModuleId).toList();
    List<LearningModuleEntity> platformModules = adoptedIds.isEmpty() ? List.of() :
        modules.findByIdInAndStatusOrderBySortOrderAsc(adoptedIds, "published");
    Map<String, TenantModuleAdoptionEntity> adoptionMap = new LinkedHashMap<>();
    tenantAdoptions.forEach(a -> adoptionMap.put(a.getModuleId(), a));
    return Stream.concat(
        ownModules.stream().map(m -> new MatchCandidate(m, m.getTargeting(), m.isMandatory(), m.getSortOrder())),
        platformModules.stream().map(m -> {
          TenantModuleAdoptionEntity a = adoptionMap.get(m.getId());
          Map<String, Object> t = (a.getTargeting() == null || a.getTargeting().isEmpty())
              ? m.getTargeting() : a.getTargeting();
          return new MatchCandidate(m, t, a.isMandatory(), a.getSortOrder());
        })
    ).toList();
  }

  private Map<String, Boolean> buildMandatoryMap(String tenantId) {
    Map<String, Boolean> map = new LinkedHashMap<>();
    adoptions.findByTenantIdOrderBySortOrderAsc(tenantId)
        .forEach(a -> map.put(a.getModuleId(), a.isMandatory()));
    return map;
  }

  private boolean matches(Map<String, Object> t, UserAssignmentEntity a, int r, String board) {
    return matchesValue(t.get("schoolName"), a.getSchoolName())
        && matchesValue(t.get("grade"),          a.getGrade())
        && matchesValue(t.get("division"),        a.getDivision())
        && matchesValue(t.get("subject"),         a.getSubject())
        && matchesValue(t.get("responsibility"),  a.getResponsibility())
        && matchesValue(t.get("board"),           board)
        && r >= minReadiness(t.get("minReadiness"))
        && r <= maxReadiness(t.get("maxReadiness"));
  }

  private boolean matchesValue(Object filter, String actual) {
    if (filter == null || String.valueOf(filter).isBlank() || "Any".equalsIgnoreCase(String.valueOf(filter))) return true;
    if (filter instanceof List<?> list) {
      return list.isEmpty() || list.stream().map(String::valueOf).anyMatch(v -> v.equalsIgnoreCase(actual));
    }
    return String.valueOf(filter).equalsIgnoreCase(actual);
  }

  private int minReadiness(Object value) { return value == null ? 0 : parseInt(value, 0); }
  private int maxReadiness(Object value) { return value == null ? 100 : parseInt(value, 100); }

  private int parseInt(Object value, int fallback) {
    try { return Integer.parseInt(String.valueOf(value)); } catch (NumberFormatException e) { return fallback; }
  }

  private void applyModuleFields(LearningModuleEntity e, LearningModuleSubmitDto dto, long now) {
    e.setTitle(dto.title() == null ? "" : dto.title().trim());
    e.setDescription(dto.description() == null ? "" : dto.description().trim());
    e.setLevel(dto.level() == null ? "Beginner" : dto.level());
    e.setLanguage(dto.language() == null ? "English" : dto.language());
    e.setEstimatedMinutes(Math.max(0, dto.estimatedMinutes()));
    e.setStatus(dto.status() == null || dto.status().isBlank() ? "draft" : dto.status());
    e.setMandatory(dto.mandatory());
    e.setSortOrder(dto.sortOrder());
    e.setTargeting(dto.targeting() == null ? Map.of() : dto.targeting());
    e.setUpdatedAt(now);
  }

  private void applyUnitFields(LearningUnitEntity e, LearningUnitSubmitDto dto) {
    e.setTitle(dto.title() == null ? "" : dto.title().trim());
    e.setType(dto.type() == null ? "reading" : dto.type());
    e.setEstimatedMinutes(Math.max(0, dto.estimatedMinutes()));
    e.setSortOrder(dto.sortOrder());
    e.setContent(dto.content() == null ? Map.of() : dto.content());
  }

  private void updateModuleMinutes(LearningModuleEntity module) {
    int total = units.findByModuleIdInOrderByModuleIdAscSortOrderAsc(List.of(module.getId()))
        .stream().mapToInt(LearningUnitEntity::getEstimatedMinutes).sum();
    module.setEstimatedMinutes(total);
    module.setUpdatedAt(Instant.now().toEpochMilli());
    modules.save(module);
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

  private UserAssignmentEntity activeAssignment(List<UserAssignmentEntity> list, String assignmentId) {
    if (list.isEmpty()) throw new NotFoundException("No active assignments found");
    if (assignmentId != null && !assignmentId.isBlank()) {
      return list.stream().filter(a -> a.getId().equals(assignmentId)).findFirst()
          .orElseThrow(() -> new NotFoundException("Assignment not found"));
    }
    return list.stream().filter(UserAssignmentEntity::isPrimaryAssignment).findFirst().orElse(list.get(0));
  }

  private AppUserEntity user(String tenantId, String email) {
    return users.findByTenantIdAndEmailIgnoreCase(tenantId, email)
        .orElseThrow(() -> new NotFoundException("User not found for tenant"));
  }

  // ── DTO converters ────────────────────────────────────────────────────────

  private LearningModuleDto toModuleDto(LearningModuleEntity module, List<LearningUnitEntity> moduleUnits,
      List<LearningProgressEntity> savedProgress, boolean mandatory) {
    int completedUnits = (int) moduleUnits.stream()
        .filter(u -> savedProgress.stream().anyMatch(p -> u.getId().equals(p.getUnitId()) && "completed".equals(p.getStatus())))
        .count();
    int moduleProgress = moduleUnits.isEmpty() ? 0 : Math.round((completedUnits * 100f) / moduleUnits.size());
    return new LearningModuleDto(
        module.getId(), module.getTenantId(), module.getTitle(), module.getDescription(),
        module.getLevel(), module.getLanguage(), module.getEstimatedMinutes(), module.getStatus(),
        module.getSortOrder(), module.getTargeting(), moduleProgress, false,
        moduleUnits.stream().map(u -> toUnitDto(u, savedProgress)).toList(),
        mandatory, module.isIsPlatform());
  }

  private LearningUnitDto toUnitDto(LearningUnitEntity unit, List<LearningProgressEntity> savedProgress) {
    String status = savedProgress.stream()
        .filter(p -> unit.getId().equals(p.getUnitId()))
        .findFirst().map(LearningProgressEntity::getStatus).orElse("not_started");
    return new LearningUnitDto(unit.getId(), unit.getModuleId(), unit.getTitle(), unit.getType(),
        unit.getEstimatedMinutes(), unit.getSortOrder(), unit.getContent(), status);
  }

  private TenantModuleAdoptionDto toAdoptionDto(TenantModuleAdoptionEntity e) {
    return new TenantModuleAdoptionDto(e.getId(), e.getTenantId(), e.getModuleId(),
        e.isMandatory(), e.getSortOrder(), e.getTargeting(), e.getAdoptedAt());
  }

  private AppUserDto toDto(AppUserEntity e) {
    return new AppUserDto(e.getId(), e.getTenantId(), e.getEmail(), e.getName(), e.getRole(), e.getAvatar(), e.getProfile());
  }

  private AssignmentDto toDto(UserAssignmentEntity e) {
    return new AssignmentDto(e.getId(), e.getUserId(), e.getTenantId(), e.getSchoolName(), e.getGrade(),
        e.getDivision(), e.getSubject(), e.getResponsibility(), e.isPrimaryAssignment(), e.isActive(), e.getMetadata());
  }
}
