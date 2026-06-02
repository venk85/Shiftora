package com.shiftora.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiftora.api.domain.AppUserEntity;
import com.shiftora.api.domain.JourneyProgressEntity;
import com.shiftora.api.domain.ReadinessAttemptEntity;
import com.shiftora.api.domain.ReadinessTemplateEntity;
import com.shiftora.api.domain.UserAssignmentEntity;
import com.shiftora.api.dto.AppUserDto;
import com.shiftora.api.dto.AssignmentDto;
import com.shiftora.api.dto.ReadinessSubmitDto;
import com.shiftora.api.repository.AppUserRepository;
import com.shiftora.api.repository.JourneyProgressRepository;
import com.shiftora.api.repository.PracticeEntryRepository;
import com.shiftora.api.repository.ReadinessAttemptRepository;
import com.shiftora.api.repository.ReadinessTemplateRepository;
import com.shiftora.api.repository.UserAssignmentRepository;
import com.shiftora.api.service.JourneyService;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class JourneyServiceTest {
  @Mock private AppUserRepository users;
  @Mock private UserAssignmentRepository assignments;
  @Mock private ReadinessTemplateRepository templates;
  @Mock private ReadinessAttemptRepository attempts;
  @Mock private JourneyProgressRepository progress;
  @Mock private PracticeEntryRepository practiceEntries;
  @Mock private PasswordEncoder passwordEncoder;

  private JourneyService service;

  @BeforeEach
  void setUp() {
    service = new JourneyService(
        users,
        assignments,
        templates,
        attempts,
        progress,
        practiceEntries,
        new ObjectMapper(),
        passwordEncoder);
  }

  @Test
  void readinessCheckShowsAllAssignmentsButUsesOneTeacherLevelAttempt() {
    AppUserEntity teacher = teacher();
    UserAssignmentEntity math = assignment("as-math", "Mathematics", true);
    UserAssignmentEntity science = assignment("as-science", "Science", false);
    ReadinessTemplateEntity teacherTemplate = template("rt-teacher", Map.of("responsibility", "Subject Teacher"));

    when(users.findByTenantIdAndEmailIgnoreCase("org-alpha", "learner@alpha.school")).thenReturn(Optional.of(teacher));
    when(assignments.findByUserIdAndActiveTrueOrderByPrimaryAssignmentDescGradeAscDivisionAscSubjectAsc("u-teacher"))
        .thenReturn(List.of(math, science));
    when(templates.findByTenantIdAndStatusOrderBySortOrderAscUpdatedAtDesc("org-alpha", "published"))
        .thenReturn(List.of(teacherTemplate));
    when(attempts.findFirstByUserIdAndTenantIdAndAssignmentIdIsNullOrderByCreatedAtDesc("u-teacher", "org-alpha"))
        .thenReturn(Optional.empty());

    var check = service.readinessCheck("org-alpha", "learner@alpha.school", "as-science");

    assertThat(check.templateId()).isEqualTo("rt-teacher");
    assertThat(check.assignment().subject()).isEqualTo("Science");
    assertThat(check.availableAssignments()).hasSize(2);
  }

  @Test
  void submitReadinessScoresAndUpdatesJourneyProgress() {
    AppUserEntity teacher = teacher();
    UserAssignmentEntity math = assignment("as-math", "Mathematics", true);
    ReadinessTemplateEntity mathTemplate = template("rt-math", Map.of("subject", "Mathematics"));

    when(users.findByTenantIdAndEmailIgnoreCase("org-alpha", "learner@alpha.school")).thenReturn(Optional.of(teacher));
    when(assignments.findByUserIdAndActiveTrueOrderByPrimaryAssignmentDescGradeAscDivisionAscSubjectAsc("u-teacher"))
        .thenReturn(List.of(math));
    when(templates.findById("rt-math")).thenReturn(Optional.of(mathTemplate));
    when(attempts.save(any(ReadinessAttemptEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
    when(progress.findByUserIdAndTenantIdAndAssignmentIdIsNullAndStepKey("u-teacher", "org-alpha", "assessment"))
        .thenReturn(Optional.empty());

    var saved = service.submitReadiness(
        "org-alpha",
        "learner@alpha.school",
        new ReadinessSubmitDto("rt-math", "as-math", Map.of("q-confidence", 3)));

    assertThat(saved.score()).isEqualTo(100);
    assertThat(saved.level()).isEqualTo("Practitioner");
    assertThat(saved.recommendedModules()).contains("Advanced Mathematics lesson design");
    verify(progress, times(1)).save(any(JourneyProgressEntity.class));
  }

  @Test
  void saveUserCreatesTeacherInvite() {
    when(users.findByTenantIdAndEmailIgnoreCase("org-alpha", "new.teacher@alpha.school")).thenReturn(Optional.empty());
    when(passwordEncoder.encode("temporary-password")).thenReturn("hashed-temporary-password");
    when(users.save(any(AppUserEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

    var saved = service.saveUser(new AppUserDto(
        "",
        "org-alpha",
        "new.teacher@alpha.school",
        "New Teacher",
        "trainee",
        "",
        Map.of("designation", "Subject Teacher", "status", "invited", "password", "temporary-password")));

    assertThat(saved.id()).startsWith("u-");
    assertThat(saved.email()).isEqualTo("new.teacher@alpha.school");
    assertThat(saved.role()).isEqualTo("TRAINEE");
    assertThat(saved.avatar()).isEqualTo("NT");
    assertThat(saved.profile()).containsEntry("status", "invited");
  }

  @Test
  void savePrimaryAssignmentUnsetsOtherPrimaryContexts() {
    AppUserEntity teacher = teacher();
    UserAssignmentEntity existing = assignment("as-existing", "Science", true);

    when(users.findByIdAndTenantId("u-teacher", "org-alpha")).thenReturn(Optional.of(teacher));
    when(assignments.findByIdAndTenantId("as-new", "org-alpha")).thenReturn(Optional.empty());
    when(assignments.save(any(UserAssignmentEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
    when(assignments.findByUserIdAndTenantIdOrderByPrimaryAssignmentDescGradeAscDivisionAscSubjectAsc("u-teacher", "org-alpha"))
        .thenReturn(List.of(existing));

    var saved = service.saveAssignment(new AssignmentDto(
        "as-new",
        "u-teacher",
        "org-alpha",
        "PUPS Ranipet",
        "Grade 3",
        "A",
        "Mathematics",
        "Subject Teacher",
        true,
        true,
        Map.of("board", "TN Board")));

    assertThat(saved.primaryAssignment()).isTrue();
    verify(assignments, times(2)).save(any(UserAssignmentEntity.class));
  }

  private AppUserEntity teacher() {
    AppUserEntity entity = new AppUserEntity();
    entity.setId("u-teacher");
    entity.setTenantId("org-alpha");
    entity.setEmail("learner@alpha.school");
    entity.setName("Anitha R");
    entity.setRole("TRAINEE");
    entity.setAvatar("AR");
    entity.setProfile(Map.of());
    return entity;
  }

  private UserAssignmentEntity assignment(String id, String subject, boolean primary) {
    UserAssignmentEntity entity = new UserAssignmentEntity();
    entity.setId(id);
    entity.setUserId("u-teacher");
    entity.setTenantId("org-alpha");
    entity.setSchoolName("PUPS Ranipet");
    entity.setGrade("Grade 3");
    entity.setDivision("A");
    entity.setSubject(subject);
    entity.setResponsibility("Subject Teacher");
    entity.setPrimaryAssignment(primary);
    entity.setActive(true);
    entity.setMetadata(Map.of());
    return entity;
  }

  private ReadinessTemplateEntity template(String id, Map<String, Object> targeting) {
    ReadinessTemplateEntity entity = new ReadinessTemplateEntity();
    entity.setId(id);
    entity.setTenantId("org-alpha");
    entity.setName(id);
    entity.setDescription("Checks readiness");
    entity.setStatus("published");
    entity.setSortOrder(1);
    entity.setTargeting(targeting);
    entity.setQuestions(List.of(Map.of(
        "id", "q-confidence",
        "type", "scale",
        "prompt", "How confident are you?",
        "options", List.of("Not yet", "Trying", "Comfortable", "Confident"),
        "weight", 2)));
    entity.setUpdatedAt(0);
    return entity;
  }
}
