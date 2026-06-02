package com.shiftora.api.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiftora.api.domain.AppUserEntity;
import com.shiftora.api.domain.CertificateEntity;
import com.shiftora.api.domain.JourneyProgressEntity;
import com.shiftora.api.domain.KnowledgeCheckAttemptEntity;
import com.shiftora.api.domain.KnowledgeCheckEntity;
import com.shiftora.api.domain.LearningProgressEntity;
import com.shiftora.api.domain.ReadinessAttemptEntity;
import com.shiftora.api.domain.UserAssignmentEntity;
import com.shiftora.api.domain.WorkshopCompletionEntity;
import com.shiftora.api.dto.AppUserDto;
import com.shiftora.api.dto.AssignmentDto;
import com.shiftora.api.dto.CertificateGenerateDto;
import com.shiftora.api.dto.CompletionRowDto;
import com.shiftora.api.dto.KnowledgeAttemptDto;
import com.shiftora.api.dto.KnowledgeCheckDto;
import com.shiftora.api.dto.KnowledgeQuestionDto;
import com.shiftora.api.dto.KnowledgeSubmitDto;
import com.shiftora.api.dto.WorkshopCompleteDto;
import com.shiftora.api.repository.AppUserRepository;
import com.shiftora.api.repository.CertificateRepository;
import com.shiftora.api.repository.JourneyProgressRepository;
import com.shiftora.api.repository.KnowledgeCheckAttemptRepository;
import com.shiftora.api.repository.KnowledgeCheckRepository;
import com.shiftora.api.repository.LearningProgressRepository;
import com.shiftora.api.repository.ReadinessAttemptRepository;
import com.shiftora.api.repository.UserAssignmentRepository;
import com.shiftora.api.repository.WorkshopCompletionRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CompletionService {
  private final AppUserRepository users;
  private final UserAssignmentRepository assignments;
  private final ReadinessAttemptRepository readinessAttempts;
  private final LearningProgressRepository learningProgress;
  private final WorkshopCompletionRepository workshops;
  private final KnowledgeCheckRepository checks;
  private final KnowledgeCheckAttemptRepository attempts;
  private final CertificateRepository certificates;
  private final JourneyProgressRepository journeyProgress;
  private final ObjectMapper objectMapper;

  public CompletionService(
      AppUserRepository users,
      UserAssignmentRepository assignments,
      ReadinessAttemptRepository readinessAttempts,
      LearningProgressRepository learningProgress,
      WorkshopCompletionRepository workshops,
      KnowledgeCheckRepository checks,
      KnowledgeCheckAttemptRepository attempts,
      CertificateRepository certificates,
      JourneyProgressRepository journeyProgress,
      ObjectMapper objectMapper) {
    this.users = users;
    this.assignments = assignments;
    this.readinessAttempts = readinessAttempts;
    this.learningProgress = learningProgress;
    this.workshops = workshops;
    this.checks = checks;
    this.attempts = attempts;
    this.certificates = certificates;
    this.journeyProgress = journeyProgress;
    this.objectMapper = objectMapper;
  }

  public KnowledgeCheckDto knowledgeCheck(String tenantId, String email, String assignmentId) {
    AppUserEntity user = user(tenantId, email);
    List<UserAssignmentEntity> userAssignments =
        assignments.findByUserIdAndActiveTrueOrderByPrimaryAssignmentDescGradeAscDivisionAscSubjectAsc(user.getId());
    UserAssignmentEntity active = activeAssignment(userAssignments, assignmentId);
    boolean workshopDone = workshopCompleted(user.getId(), tenantId);
    KnowledgeCheckEntity check = matchingCheck(tenantId, active);
    KnowledgeAttemptDto latest = attempts
        .findFirstByUserIdAndTenantIdAndAssignmentIdIsNullOrderByCreatedAtDesc(user.getId(), tenantId)
        .map(this::toDto)
        .orElse(null);
    return new KnowledgeCheckDto(
        check == null ? null : check.getId(),
        check == null ? "Knowledge check" : check.getTitle(),
        check == null ? "" : check.getDescription(),
        check == null ? 80 : check.getPassScore(),
        workshopDone,
        workshopDone && check != null,
        !workshopDone ? "Available after School Admin marks workshop completion." : check == null ? "No knowledge check has been assigned yet." : "",
        toDto(active),
        userAssignments.stream().map(this::toDto).toList(),
        check == null ? List.of() : questions(check),
        latest);
  }

  @Transactional
  public KnowledgeAttemptDto submitKnowledge(String tenantId, String email, KnowledgeSubmitDto dto) {
    AppUserEntity user = user(tenantId, email);
    List<UserAssignmentEntity> userAssignments =
        assignments.findByUserIdAndActiveTrueOrderByPrimaryAssignmentDescGradeAscDivisionAscSubjectAsc(user.getId());
    UserAssignmentEntity assignment = activeAssignment(userAssignments, dto.assignmentId());
    if (!workshopCompleted(user.getId(), tenantId)) {
      throw new IllegalArgumentException("Knowledge check is available only after workshop completion");
    }
    KnowledgeCheckEntity check = checks.findById(dto.knowledgeCheckId())
        .orElseThrow(() -> new NotFoundException("Knowledge check not found"));
    int score = score(check, dto.answers() == null ? Map.of() : dto.answers());
    long now = Instant.now().toEpochMilli();
    KnowledgeCheckAttemptEntity attempt = new KnowledgeCheckAttemptEntity();
    attempt.setId("ka-" + UUID.randomUUID().toString().substring(0, 8));
    attempt.setUserId(user.getId());
    attempt.setTenantId(tenantId);
    attempt.setAssignmentId(null);
    attempt.setKnowledgeCheckId(check.getId());
    attempt.setAnswers(dto.answers() == null ? Map.of() : dto.answers());
    attempt.setScore(score);
    attempt.setPassed(score >= check.getPassScore());
    attempt.setCreatedAt(now);
    attempts.save(attempt);
    if (attempt.isPassed()) {
      upsertJourney(user.getId(), tenantId, null, "check", "done", 100, score, now);
    }
    return toDto(attempt);
  }

  public List<CompletionRowDto> completionRows(String tenantId) {
    List<AppUserEntity> tenantUsers = users.findByTenantIdOrderByName(tenantId);
    List<UserAssignmentEntity> tenantAssignments = assignments.findByTenantIdOrderBySchoolNameAscGradeAscDivisionAscSubjectAsc(tenantId);
    return tenantUsers.stream()
        .map(user -> {
          List<UserAssignmentEntity> userAssignments = tenantAssignments.stream()
              .filter(item -> item.getUserId().equals(user.getId()))
              .toList();
          if (userAssignments.isEmpty()) return null;
          UserAssignmentEntity assignment = userAssignments.stream()
              .filter(UserAssignmentEntity::isPrimaryAssignment)
              .findFirst()
              .orElse(userAssignments.get(0));
          int readiness = readinessAttempts
              .findFirstByUserIdAndTenantIdAndAssignmentIdIsNullOrderByCreatedAtDesc(user.getId(), tenantId)
              .map(ReadinessAttemptEntity::getScore)
              .orElse(0);
          int learning = programmeLearningProgress(user.getId(), tenantId, userAssignments);
          boolean workshop = workshopCompleted(user.getId(), tenantId);
          KnowledgeCheckAttemptEntity latest = attempts
              .findFirstByUserIdAndTenantIdAndAssignmentIdIsNullOrderByCreatedAtDesc(user.getId(), tenantId)
              .orElse(null);
          CertificateEntity cert = certificates.findByUserIdAndTenantIdAndAssignmentIdIsNull(user.getId(), tenantId).orElse(null);
          boolean eligible = readiness > 0 && learning >= 100 && workshop && latest != null && latest.isPassed();
          return new CompletionRowDto(
              toDto(user),
              toDto(assignment),
              readiness,
              learning,
              workshop,
              latest == null ? null : latest.getScore(),
              latest != null && latest.isPassed(),
              eligible,
              cert == null ? "not_generated" : cert.getStatus(),
              cert == null ? "" : cert.getCertificateNumber(),
              cert == null ? "" : cert.getEmailedTo());
        })
        .filter(row -> row != null)
        .toList();
  }

  @Transactional
  public CompletionRowDto markWorkshop(String tenantId, WorkshopCompleteDto dto) {
    AppUserEntity user = users.findById(dto.userId())
        .orElseThrow(() -> new NotFoundException("User not found"));
    long now = Instant.now().toEpochMilli();
    WorkshopCompletionEntity item = workshops
        .findByUserIdAndTenantIdAndAssignmentIdIsNull(user.getId(), tenantId)
        .orElseGet(WorkshopCompletionEntity::new);
    if (item.getId() == null) item.setId("wc-" + UUID.randomUUID().toString().substring(0, 8));
    item.setUserId(user.getId());
    item.setTenantId(tenantId);
    item.setAssignmentId(null);
    item.setStatus("completed");
    item.setCompletedBy(dto.completedBy());
    item.setCompletedAt(now);
    item.setNotes(dto.notes() == null ? "" : dto.notes());
    workshops.save(item);
    upsertJourney(user.getId(), tenantId, null, "workshop", "done", 100, null, now);
    return rowFor(tenantId, user.getId());
  }

  @Transactional
  public CompletionRowDto generateCertificate(String tenantId, CertificateGenerateDto dto) {
    CompletionRowDto row = rowFor(tenantId, dto.userId());
    if (!row.certificateEligible()) {
      throw new IllegalArgumentException("Certificate prerequisites are not complete");
    }
    long now = Instant.now().toEpochMilli();
    CertificateEntity cert = certificates
        .findByUserIdAndTenantIdAndAssignmentIdIsNull(dto.userId(), tenantId)
        .orElseGet(CertificateEntity::new);
    if (cert.getId() == null) {
      cert.setId("ct-" + UUID.randomUUID().toString().substring(0, 8));
      cert.setCertificateNumber("SHF-" + tenantId.toUpperCase().replace("TN-", "") + "-" + now);
    }
    cert.setUserId(dto.userId());
    cert.setTenantId(tenantId);
    cert.setAssignmentId(null);
    cert.setStatus("emailed");
    cert.setEmailedTo(row.user().email());
    cert.setGeneratedBy(dto.generatedBy());
    cert.setGeneratedAt(now);
    cert.setEmailedAt(now);
    certificates.save(cert);
    return rowFor(tenantId, dto.userId());
  }

  private CompletionRowDto rowFor(String tenantId, String userId) {
    return completionRows(tenantId).stream()
        .filter(row -> row.user().id().equals(userId))
        .findFirst()
        .orElseThrow(() -> new NotFoundException("Completion row not found"));
  }

  private int programmeLearningProgress(String userId, String tenantId, List<UserAssignmentEntity> assignments) {
    if (assignments.isEmpty()) return 0;
    int total = 0;
    for (UserAssignmentEntity assignment : assignments) {
      total += learningProgressPercent(userId, tenantId, assignment.getId());
    }
    return Math.round(total / (float) assignments.size());
  }

  private int learningProgressPercent(String userId, String tenantId, String assignmentId) {
    int journeyValue = journeyProgress
        .findByUserIdAndTenantIdAndAssignmentIdAndStepKey(userId, tenantId, assignmentId, "learning")
        .map(JourneyProgressEntity::getProgress)
        .orElse(0);
    if (journeyValue > 0) return journeyValue;
    List<LearningProgressEntity> rows = learningProgress.findByUserIdAndTenantIdAndAssignmentId(userId, tenantId, assignmentId);
    if (rows.isEmpty()) return 0;
    long completed = rows.stream().filter(row -> "completed".equals(row.getStatus())).count();
    return Math.min(100, Math.round((completed * 100f) / rows.size()));
  }

  private KnowledgeCheckEntity matchingCheck(String tenantId, UserAssignmentEntity assignment) {
    return checks.findByTenantIdAndStatusOrderBySortOrderAscUpdatedAtDesc(tenantId, "published")
        .stream()
        .filter(check -> matches(check.getTargeting(), assignment))
        .findFirst()
        .orElse(null);
  }

  private boolean workshopCompleted(String userId, String tenantId) {
    return workshops.findByUserIdAndTenantIdAndAssignmentIdIsNull(userId, tenantId)
        .map(item -> "completed".equals(item.getStatus()))
        .orElse(false);
  }

  private AppUserEntity user(String tenantId, String email) {
    return users.findByTenantIdAndEmailIgnoreCase(tenantId, email)
        .orElseThrow(() -> new NotFoundException("User not found for tenant"));
  }

  private UserAssignmentEntity activeAssignment(List<UserAssignmentEntity> list, String assignmentId) {
    if (list.isEmpty()) throw new NotFoundException("No active assignments found");
    if (assignmentId != null && !assignmentId.isBlank()) {
      return list.stream().filter(item -> item.getId().equals(assignmentId)).findFirst()
          .orElseThrow(() -> new NotFoundException("Assignment not found"));
    }
    return list.stream().filter(UserAssignmentEntity::isPrimaryAssignment).findFirst().orElse(list.get(0));
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

  private int score(KnowledgeCheckEntity check, Map<String, Object> answers) {
    List<KnowledgeQuestionDto> qs = questions(check);
    if (qs.isEmpty()) return 0;
    int earned = 0;
    int possible = 0;
    for (KnowledgeQuestionDto question : qs) {
      int weight = Math.max(1, question.weight());
      Object answer = answers.get(question.id());
      int selected = answer instanceof Number number ? number.intValue() : parseInt(answer);
      if (selected == question.answerIndex()) earned += weight;
      possible += weight;
    }
    return possible == 0 ? 0 : Math.round((earned * 100f) / possible);
  }

  private int parseInt(Object value) {
    try {
      return Integer.parseInt(String.valueOf(value));
    } catch (NumberFormatException ex) {
      return -1;
    }
  }

  private void upsertJourney(String userId, String tenantId, String assignmentId, String step, String status, int value, Integer score, long now) {
    JourneyProgressEntity item = assignmentId == null
        ? journeyProgress.findByUserIdAndTenantIdAndAssignmentIdIsNullAndStepKey(userId, tenantId, step).orElseGet(JourneyProgressEntity::new)
        : journeyProgress.findByUserIdAndTenantIdAndAssignmentIdAndStepKey(userId, tenantId, assignmentId, step).orElseGet(JourneyProgressEntity::new);
    if (item.getId() == null) item.setId("jp-" + UUID.randomUUID().toString().substring(0, 8));
    item.setUserId(userId);
    item.setTenantId(tenantId);
    item.setAssignmentId(assignmentId);
    item.setStepKey(step);
    item.setStatus(status);
    item.setProgress(value);
    item.setScore(score);
    item.setUpdatedAt(now);
    journeyProgress.save(item);
  }

  private KnowledgeAttemptDto toDto(KnowledgeCheckAttemptEntity entity) {
    return new KnowledgeAttemptDto(entity.getId(), entity.getKnowledgeCheckId(), entity.getAssignmentId(), entity.getAnswers(), entity.getScore(), entity.isPassed(), entity.getCreatedAt());
  }

  private AppUserDto toDto(AppUserEntity entity) {
    return new AppUserDto(entity.getId(), entity.getTenantId(), entity.getEmail(), entity.getName(), entity.getRole(), entity.getAvatar(), entity.getProfile());
  }

  private AssignmentDto toDto(UserAssignmentEntity entity) {
    return new AssignmentDto(entity.getId(), entity.getUserId(), entity.getTenantId(), entity.getSchoolName(), entity.getGrade(), entity.getDivision(), entity.getSubject(), entity.getResponsibility(), entity.isPrimaryAssignment(), entity.isActive(), entity.getMetadata());
  }

  private List<KnowledgeQuestionDto> questions(KnowledgeCheckEntity entity) {
    return objectMapper.convertValue(entity.getQuestions(), new TypeReference<List<KnowledgeQuestionDto>>() {});
  }

  public List<Map<String, Object>> toQuestionMaps(List<KnowledgeQuestionDto> questions) {
    if (questions == null) return List.of();
    List<Map<String, Object>> maps = new ArrayList<>();
    for (KnowledgeQuestionDto question : questions) {
      maps.add(objectMapper.convertValue(question, new TypeReference<Map<String, Object>>() {}));
    }
    return maps;
  }
}
