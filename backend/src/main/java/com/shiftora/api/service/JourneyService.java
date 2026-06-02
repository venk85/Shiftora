package com.shiftora.api.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiftora.api.domain.AppUserEntity;
import com.shiftora.api.domain.JourneyProgressEntity;
import com.shiftora.api.domain.ReadinessAttemptEntity;
import com.shiftora.api.domain.ReadinessTemplateEntity;
import com.shiftora.api.domain.UserAssignmentEntity;
import com.shiftora.api.dto.AppUserDto;
import com.shiftora.api.dto.AssignmentDto;
import com.shiftora.api.dto.JourneyActionDto;
import com.shiftora.api.dto.JourneyDto;
import com.shiftora.api.dto.JourneyMetricsDto;
import com.shiftora.api.dto.JourneyModuleDto;
import com.shiftora.api.dto.JourneyStepDto;
import com.shiftora.api.dto.ReadinessAttemptDto;
import com.shiftora.api.dto.ReadinessCheckDto;
import com.shiftora.api.dto.ReadinessQuestionDto;
import com.shiftora.api.dto.ReadinessSubmitDto;
import com.shiftora.api.dto.ReadinessTemplateDto;
import com.shiftora.api.repository.AppUserRepository;
import com.shiftora.api.repository.JourneyProgressRepository;
import com.shiftora.api.repository.PracticeEntryRepository;
import com.shiftora.api.repository.ReadinessAttemptRepository;
import com.shiftora.api.repository.ReadinessTemplateRepository;
import com.shiftora.api.repository.UserAssignmentRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class JourneyService {
  private static final List<JourneyStepDto> DEFAULT_STEPS = List.of(
      new JourneyStepDto("assessment", "Readiness check", "/learner/assessment", "todo", 0, null),
      new JourneyStepDto("learning", "Learning path", "/learner/learning", "todo", 0, null),
      new JourneyStepDto("workshop", "Live workshop", "/learner/workshop", "todo", 0, null),
      new JourneyStepDto("sandbox", "AI Sandbox", "/learner/sandbox", "todo", 0, null),
      new JourneyStepDto("practice", "Practice log", "/learner/practice", "todo", 0, null),
      new JourneyStepDto("check", "Knowledge check", "/learner/check", "todo", 0, null));

  private final AppUserRepository users;
  private final UserAssignmentRepository assignments;
  private final ReadinessTemplateRepository templates;
  private final ReadinessAttemptRepository attempts;
  private final JourneyProgressRepository progress;
  private final PracticeEntryRepository practiceEntries;
  private final ObjectMapper objectMapper;
  private final PasswordEncoder passwordEncoder;

  public JourneyService(
      AppUserRepository users,
      UserAssignmentRepository assignments,
      ReadinessTemplateRepository templates,
      ReadinessAttemptRepository attempts,
      JourneyProgressRepository progress,
      PracticeEntryRepository practiceEntries,
      ObjectMapper objectMapper,
      PasswordEncoder passwordEncoder) {
    this.users = users;
    this.assignments = assignments;
    this.templates = templates;
    this.attempts = attempts;
    this.progress = progress;
    this.practiceEntries = practiceEntries;
    this.objectMapper = objectMapper;
    this.passwordEncoder = passwordEncoder;
  }

  public JourneyDto journey(String tenantId, String email, String assignmentId) {
    AppUserEntity user = user(tenantId, email);
    List<UserAssignmentEntity> userAssignments =
        assignments.findByUserIdAndActiveTrueOrderByPrimaryAssignmentDescGradeAscDivisionAscSubjectAsc(user.getId());
    UserAssignmentEntity active = activeAssignment(user, userAssignments, assignmentId);
    List<JourneyStepDto> steps = journeySteps(user, tenantId, userAssignments);
    int readiness = attempts.findFirstByUserIdAndTenantIdAndAssignmentIdIsNullOrderByCreatedAtDesc(user.getId(), tenantId)
        .map(ReadinessAttemptEntity::getScore)
        .orElse(0);
    int practiceRuns = (int) practiceEntries.countByTenantId(tenantId);
    int completed = (int) steps.stream().filter(step -> "done".equals(step.status())).count();
    return new JourneyDto(
        toDto(user),
        toDto(active),
        userAssignments.stream().map(this::toDto).toList(),
        steps,
        modules(readiness),
        new JourneyMetricsDto(readiness, practiceRuns, readiness >= 70 ? "High" : readiness >= 45 ? "Developing" : "New", completed),
        nextAction(steps));
  }

  public List<AppUserDto> users(String tenantId) {
    return users.findByTenantIdOrderByName(tenantId).stream().map(this::toDto).toList();
  }

  public List<AssignmentDto> assignments(String tenantId) {
    return assignments.findByTenantIdOrderBySchoolNameAscGradeAscDivisionAscSubjectAsc(tenantId)
        .stream().map(this::toDto).toList();
  }

  public List<ReadinessTemplateDto> templates(String tenantId) {
    return templates.findByTenantIdOrderBySortOrderAscUpdatedAtDesc(tenantId)
        .stream().map(this::toDto).toList();
  }

  @Transactional
  public ReadinessTemplateDto saveTemplate(ReadinessTemplateDto dto) {
    long now = Instant.now().toEpochMilli();
    ReadinessTemplateEntity entity = dto.id() == null || dto.id().isBlank()
        ? new ReadinessTemplateEntity()
        : templates.findById(dto.id()).orElse(new ReadinessTemplateEntity());
    if (entity.getId() == null) {
      entity.setId("rt-" + UUID.randomUUID().toString().substring(0, 8));
      entity.setCreatedAt(now);
    }
    entity.setTenantId(dto.tenantId());
    entity.setName(dto.name());
    entity.setDescription(dto.description() == null ? "" : dto.description());
    entity.setStatus(dto.status() == null ? "draft" : dto.status());
    entity.setSortOrder(dto.sortOrder());
    entity.setTargeting(dto.targeting() == null ? Map.of() : dto.targeting());
    entity.setQuestions(toQuestionMaps(dto.questions()));
    entity.setUpdatedAt(now);
    return toDto(templates.save(entity));
  }

  @Transactional
  public AppUserDto saveUser(AppUserDto dto) {
    if (dto.tenantId() == null || dto.tenantId().isBlank()) {
      throw new IllegalArgumentException("tenantId is required");
    }
    if (dto.email() == null || dto.email().isBlank()) {
      throw new IllegalArgumentException("email is required");
    }
    long now = Instant.now().toEpochMilli();
    AppUserEntity entity = dto.id() == null || dto.id().isBlank()
        ? users.findByTenantIdAndEmailIgnoreCase(dto.tenantId(), dto.email()).orElse(new AppUserEntity())
        : users.findByIdAndTenantId(dto.id(), dto.tenantId()).orElse(new AppUserEntity());
    if (entity.getId() == null) {
      entity.setId("u-" + UUID.randomUUID().toString().substring(0, 8));
      entity.setCreatedAt(now);
    }
    entity.setTenantId(dto.tenantId());
    entity.setEmail(dto.email().trim().toLowerCase());
    entity.setName(blankOr(dto.name(), dto.email()));
    entity.setRole(blankOr(dto.role(), "TRAINEE").toUpperCase());
    entity.setAvatar(blankOr(dto.avatar(), initials(entity.getName())));
    Map<String, Object> profile = new LinkedHashMap<>(dto.profile() == null ? Map.of("status", "invited") : dto.profile());
    Object rawPassword = profile.remove("password");
    if (rawPassword instanceof String password && !password.isBlank()) {
      entity.setPasswordHash(passwordEncoder.encode(password));
      entity.setAuthVersion(entity.getAuthVersion() + 1);
    } else if (entity.getPasswordHash() == null || entity.getPasswordHash().isBlank()) {
      throw new IllegalArgumentException("password is required for new users");
    }
    entity.setProfile(profile);
    return toDto(users.save(entity));
  }

  @Transactional
  public AssignmentDto saveAssignment(AssignmentDto dto) {
    if (dto.tenantId() == null || dto.tenantId().isBlank()) {
      throw new IllegalArgumentException("tenantId is required");
    }
    AppUserEntity user = users.findByIdAndTenantId(dto.userId(), dto.tenantId())
        .orElseThrow(() -> new NotFoundException("Teacher not found for tenant"));
    UserAssignmentEntity entity = dto.id() == null || dto.id().isBlank()
        ? new UserAssignmentEntity()
        : assignments.findByIdAndTenantId(dto.id(), dto.tenantId()).orElse(new UserAssignmentEntity());
    if (entity.getId() == null) entity.setId("as-" + UUID.randomUUID().toString().substring(0, 8));
    entity.setUserId(user.getId());
    entity.setTenantId(dto.tenantId());
    if (dto.schoolName() == null || dto.schoolName().isBlank()) {
      throw new IllegalArgumentException("schoolName is required");
    }
    entity.setSchoolName(dto.schoolName().trim());
    entity.setGrade(blankOr(dto.grade(), "Grade 3"));
    entity.setDivision(blankOr(dto.division(), "A"));
    entity.setSubject(blankOr(dto.subject(), "General"));
    entity.setResponsibility(blankOr(dto.responsibility(), "Subject Teacher"));
    entity.setPrimaryAssignment(dto.primaryAssignment());
    entity.setActive(dto.active());
    entity.setMetadata(dto.metadata() == null ? Map.of() : dto.metadata());
    UserAssignmentEntity saved = assignments.save(entity);
    if (saved.isPrimaryAssignment()) {
      assignments.findByUserIdAndTenantIdOrderByPrimaryAssignmentDescGradeAscDivisionAscSubjectAsc(user.getId(), dto.tenantId())
          .stream()
          .filter(item -> !item.getId().equals(saved.getId()) && item.isPrimaryAssignment())
          .forEach(item -> {
            item.setPrimaryAssignment(false);
            assignments.save(item);
          });
    }
    return toDto(saved);
  }

  public ReadinessCheckDto readinessCheck(String tenantId, String email, String assignmentId) {
    AppUserEntity user = user(tenantId, email);
    List<UserAssignmentEntity> userAssignments =
        assignments.findByUserIdAndActiveTrueOrderByPrimaryAssignmentDescGradeAscDivisionAscSubjectAsc(user.getId());
    UserAssignmentEntity active = activeAssignment(user, userAssignments, assignmentId);
    ReadinessTemplateEntity template = matchingTemplate(tenantId, active);
    ReadinessAttemptDto latest = attempts
        .findFirstByUserIdAndTenantIdAndAssignmentIdIsNullOrderByCreatedAtDesc(user.getId(), tenantId)
        .map(this::toDto)
        .orElse(null);
    return new ReadinessCheckDto(
        template.getId(),
        template.getName(),
        template.getDescription(),
        toDto(active),
        userAssignments.stream().map(this::toDto).toList(),
        questions(template),
        latest);
  }

  @Transactional
  public ReadinessAttemptDto submitReadiness(String tenantId, String email, ReadinessSubmitDto dto) {
    AppUserEntity user = user(tenantId, email);
    ReadinessTemplateEntity template = templates.findById(dto.templateId())
        .orElseThrow(() -> new NotFoundException("Readiness template not found"));
    List<UserAssignmentEntity> userAssignments =
        assignments.findByUserIdAndActiveTrueOrderByPrimaryAssignmentDescGradeAscDivisionAscSubjectAsc(user.getId());
    UserAssignmentEntity primary = activeAssignment(user, userAssignments, dto.assignmentId());
    int score = score(template, dto.answers() == null ? Map.of() : dto.answers());
    long now = Instant.now().toEpochMilli();
    ReadinessAttemptEntity attempt = new ReadinessAttemptEntity();
    attempt.setId("ra-" + UUID.randomUUID().toString().substring(0, 8));
    attempt.setUserId(user.getId());
    attempt.setTenantId(tenantId);
    attempt.setTemplateId(template.getId());
    attempt.setAssignmentId(null);
    attempt.setAnswers(dto.answers() == null ? Map.of() : dto.answers());
    attempt.setScore(score);
    attempt.setLevel(score >= 75 ? "Practitioner" : score >= 45 ? "Developing" : "Foundation");
    attempt.setRecommendedModules(recommendations(primary, score));
    attempt.setCreatedAt(now);
    attempts.save(attempt);
    upsertProgress(user, tenantId, null, "assessment", "done", 100, score, now);
    return toDto(attempt);
  }

  private AppUserEntity user(String tenantId, String email) {
    return users.findByTenantIdAndEmailIgnoreCase(tenantId, email)
        .orElseThrow(() -> new NotFoundException("User not found for tenant"));
  }

  private UserAssignmentEntity activeAssignment(AppUserEntity user, List<UserAssignmentEntity> list, String assignmentId) {
    if (list.isEmpty()) throw new NotFoundException("No active assignments found");
    if (assignmentId != null && !assignmentId.isBlank()) {
      return list.stream()
          .filter(item -> item.getId().equals(assignmentId))
          .findFirst()
          .orElseThrow(() -> new NotFoundException("Assignment not found"));
    }
    return list.stream().filter(UserAssignmentEntity::isPrimaryAssignment).findFirst().orElse(list.get(0));
  }

  private ReadinessTemplateEntity matchingTemplate(String tenantId, UserAssignmentEntity assignment) {
    return templates.findByTenantIdAndStatusOrderBySortOrderAscUpdatedAtDesc(tenantId, "published")
        .stream()
        .filter(template -> matches(template.getTargeting(), assignment))
        .findFirst()
        .orElseThrow(() -> new NotFoundException("No published readiness check matches this assignment"));
  }

  private boolean matches(Map<String, Object> targeting, UserAssignmentEntity assignment) {
    return matchesValue(targeting.get("schoolName"), assignment.getSchoolName())
        && matchesValue(targeting.get("grade"), assignment.getGrade())
        && matchesValue(targeting.get("division"), assignment.getDivision())
        && matchesValue(targeting.get("subject"), assignment.getSubject())
        && matchesValue(targeting.get("responsibility"), assignment.getResponsibility());
  }

  private boolean matchesValue(Object filter, String actual) {
    if (filter == null || String.valueOf(filter).isBlank() || "Any".equalsIgnoreCase(String.valueOf(filter))) return true;
    if (filter instanceof List<?> list) {
      return list.isEmpty() || list.stream().map(String::valueOf).anyMatch(value -> value.equalsIgnoreCase(actual));
    }
    return String.valueOf(filter).equalsIgnoreCase(actual);
  }

  private List<JourneyStepDto> journeySteps(AppUserEntity user, String tenantId, List<UserAssignmentEntity> userAssignments) {
    Map<String, JourneyProgressEntity> byStep = new LinkedHashMap<>();
    progress.findByUserIdAndTenantIdAndAssignmentIdIsNullOrderByStepKey(user.getId(), tenantId)
        .forEach(item -> byStep.put(item.getStepKey(), item));
    return DEFAULT_STEPS.stream().map(step -> {
      if ("learning".equals(step.key())) {
        JourneyStepDto aggregated = aggregateLearningStep(user, tenantId, userAssignments);
        if (aggregated != null) return aggregated;
      }
      JourneyProgressEntity item = byStep.get(step.key());
      return item == null ? step : new JourneyStepDto(step.key(), step.label(), step.path(), item.getStatus(), item.getProgress(), item.getScore());
    }).toList();
  }

  private JourneyStepDto aggregateLearningStep(AppUserEntity user, String tenantId, List<UserAssignmentEntity> userAssignments) {
    List<JourneyProgressEntity> rows = progress.findByUserIdAndTenantIdAndStepKey(user.getId(), tenantId, "learning")
        .stream()
        .filter(item -> item.getAssignmentId() != null)
        .toList();
    if (rows.isEmpty()) return null;
    int assignmentCount = Math.max(1, userAssignments.size());
    int value = Math.min(100, Math.round(rows.stream().mapToInt(JourneyProgressEntity::getProgress).sum() / (float) assignmentCount));
    String status = value >= 100 ? "done" : value > 0 ? "active" : "todo";
    return new JourneyStepDto("learning", "Learning path", "/learner/learning", status, value, null);
  }

  private JourneyActionDto nextAction(List<JourneyStepDto> steps) {
    return steps.stream()
        .filter(step -> !"done".equals(step.status()))
        .min(Comparator.comparingInt(steps::indexOf))
        .map(step -> new JourneyActionDto("Continue " + step.label(), step.path()))
        .orElse(new JourneyActionDto("Completion review", "/learner/dashboard"));
  }

  private List<JourneyModuleDto> modules(int readiness) {
    return List.of(
        new JourneyModuleDto("Foundations of responsible AI", readiness > 0 ? 100 : 0, readiness > 0 ? "done" : "todo"),
        new JourneyModuleDto("Prompt patterns for classroom work", readiness >= 45 ? 60 : 0, readiness >= 45 ? "active" : "todo"),
        new JourneyModuleDto("Verification and remediation planning", readiness >= 75 ? 35 : 0, readiness >= 75 ? "active" : "locked"));
  }

  private int score(ReadinessTemplateEntity template, Map<String, Object> answers) {
    List<ReadinessQuestionDto> qs = questions(template);
    if (qs.isEmpty()) return 0;
    int earned = 0;
    int possible = 0;
    for (ReadinessQuestionDto question : qs) {
      int weight = Math.max(1, question.weight());
      int max = Math.max(1, question.options() == null ? 1 : question.options().size() - 1);
      Object answer = answers.get(question.id());
      int selected = answer instanceof Number number ? number.intValue() : parseInt(answer);
      earned += Math.max(0, Math.min(max, selected)) * weight;
      possible += max * weight;
    }
    return possible == 0 ? 0 : Math.round((earned * 100f) / possible);
  }

  private int parseInt(Object value) {
    try {
      return Integer.parseInt(String.valueOf(value));
    } catch (NumberFormatException ex) {
      return 0;
    }
  }

  private String blankOr(String value, String fallback) {
    return value == null || value.isBlank() ? fallback : value.trim();
  }

  private String initials(String name) {
    String[] parts = name == null ? new String[0] : name.trim().split("\\s+");
    if (parts.length == 0 || parts[0].isBlank()) return "U";
    if (parts.length == 1) return parts[0].substring(0, Math.min(2, parts[0].length())).toUpperCase();
    return (parts[0].substring(0, 1) + parts[parts.length - 1].substring(0, 1)).toUpperCase();
  }

  private List<String> recommendations(UserAssignmentEntity assignment, int score) {
    String subject = assignment.getSubject();
    if (score < 45) return List.of("AI basics for " + subject, "Safe prompt writing", "Output verification");
    if (score < 75) return List.of(subject + " worksheet generation", "Differentiated practice design", "Remediation planning");
    return List.of("Advanced " + subject + " lesson design", "Assessment blueprinting", "Peer mentoring");
  }

  private void upsertProgress(AppUserEntity user, String tenantId, String assignmentId, String key, String status, int value, Integer score, long now) {
    JourneyProgressEntity item = assignmentId == null
        ? progress.findByUserIdAndTenantIdAndAssignmentIdIsNullAndStepKey(user.getId(), tenantId, key).orElseGet(JourneyProgressEntity::new)
        : progress.findByUserIdAndTenantIdAndAssignmentIdAndStepKey(user.getId(), tenantId, assignmentId, key).orElseGet(JourneyProgressEntity::new);
    if (item.getId() == null) item.setId("jp-" + UUID.randomUUID().toString().substring(0, 8));
    item.setUserId(user.getId());
    item.setTenantId(tenantId);
    item.setAssignmentId(assignmentId);
    item.setStepKey(key);
    item.setStatus(status);
    item.setProgress(value);
    item.setScore(score);
    item.setUpdatedAt(now);
    progress.save(item);
  }

  private AppUserDto toDto(AppUserEntity entity) {
    return new AppUserDto(entity.getId(), entity.getTenantId(), entity.getEmail(), entity.getName(), entity.getRole(), entity.getAvatar(), entity.getProfile());
  }

  private AssignmentDto toDto(UserAssignmentEntity entity) {
    return new AssignmentDto(entity.getId(), entity.getUserId(), entity.getTenantId(), entity.getSchoolName(), entity.getGrade(), entity.getDivision(), entity.getSubject(), entity.getResponsibility(), entity.isPrimaryAssignment(), entity.isActive(), entity.getMetadata());
  }

  private ReadinessTemplateDto toDto(ReadinessTemplateEntity entity) {
    return new ReadinessTemplateDto(entity.getId(), entity.getTenantId(), entity.getName(), entity.getDescription(), entity.getStatus(), entity.getSortOrder(), entity.getTargeting(), questions(entity), entity.getUpdatedAt());
  }

  private ReadinessAttemptDto toDto(ReadinessAttemptEntity entity) {
    return new ReadinessAttemptDto(entity.getId(), entity.getTemplateId(), entity.getAssignmentId(), entity.getAnswers(), entity.getScore(), entity.getLevel(), entity.getRecommendedModules(), entity.getCreatedAt());
  }

  private List<ReadinessQuestionDto> questions(ReadinessTemplateEntity entity) {
    return objectMapper.convertValue(entity.getQuestions(), new TypeReference<List<ReadinessQuestionDto>>() {});
  }

  private List<Map<String, Object>> toQuestionMaps(List<ReadinessQuestionDto> questions) {
    if (questions == null) return List.of();
    List<Map<String, Object>> maps = new ArrayList<>();
    for (ReadinessQuestionDto question : questions) {
      maps.add(objectMapper.convertValue(question, new TypeReference<Map<String, Object>>() {}));
    }
    return maps;
  }
}
