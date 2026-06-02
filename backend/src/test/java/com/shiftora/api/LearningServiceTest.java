package com.shiftora.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.shiftora.api.domain.AppUserEntity;
import com.shiftora.api.domain.LearningModuleEntity;
import com.shiftora.api.domain.LearningProgressEntity;
import com.shiftora.api.domain.LearningUnitEntity;
import com.shiftora.api.domain.UserAssignmentEntity;
import com.shiftora.api.dto.LearningProgressSubmitDto;
import com.shiftora.api.repository.AppUserRepository;
import com.shiftora.api.repository.JourneyProgressRepository;
import com.shiftora.api.repository.LearningModuleRepository;
import com.shiftora.api.repository.LearningProgressRepository;
import com.shiftora.api.repository.LearningUnitRepository;
import com.shiftora.api.repository.ReadinessAttemptRepository;
import com.shiftora.api.repository.UserAssignmentRepository;
import com.shiftora.api.service.LearningService;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class LearningServiceTest {
  @Mock private AppUserRepository users;
  @Mock private UserAssignmentRepository assignments;
  @Mock private ReadinessAttemptRepository attempts;
  @Mock private LearningModuleRepository modules;
  @Mock private LearningUnitRepository units;
  @Mock private LearningProgressRepository progress;
  @Mock private JourneyProgressRepository journeyProgress;

  private LearningService service;

  @BeforeEach
  void setUp() {
    service = new LearningService(users, assignments, attempts, modules, units, progress, journeyProgress);
  }

  @Test
  void returnsModulesMatchedToTeacherAssignment() {
    when(users.findByTenantIdAndEmailIgnoreCase("tn-demo-school", "learner@demo.demo")).thenReturn(Optional.of(user()));
    when(assignments.findByUserIdAndActiveTrueOrderByPrimaryAssignmentDescGradeAscDivisionAscSubjectAsc("u-demo-teacher"))
        .thenReturn(List.of(assignment()));
    when(attempts.findFirstByUserIdAndTenantIdAndAssignmentIdIsNullOrderByCreatedAtDesc("u-demo-teacher", "tn-demo-school"))
        .thenReturn(Optional.empty());
    when(modules.findByTenantIdAndStatusOrderBySortOrderAsc("tn-demo-school", "published"))
        .thenReturn(List.of(module("lm-match", Map.of("grade", "Grade 3", "subject", "Mathematics")), module("lm-skip", Map.of("subject", "Science"))));
    when(units.findByModuleIdInOrderByModuleIdAscSortOrderAsc(List.of("lm-match")))
        .thenReturn(List.of(unit("lu-1", "lm-match"), unit("lu-2", "lm-match")));
    when(progress.findByUserIdAndTenantIdAndAssignmentId("u-demo-teacher", "tn-demo-school", "as-demo-g3a-math"))
        .thenReturn(List.of());

    var path = service.learningPath("tn-demo-school", "learner@demo.demo", null);

    assertThat(path.modules()).hasSize(1);
    assertThat(path.modules().get(0).title()).isEqualTo("Module lm-match");
    assertThat(path.modules().get(0).units()).hasSize(2);
  }

  @Test
  void savingUnitProgressMarksModuleProgress() {
    when(users.findByTenantIdAndEmailIgnoreCase("tn-demo-school", "learner@demo.demo")).thenReturn(Optional.of(user()));
    when(assignments.findByIdAndUserId("as-demo-g3a-math", "u-demo-teacher")).thenReturn(Optional.of(assignment()));
    when(assignments.findByUserIdAndActiveTrueOrderByPrimaryAssignmentDescGradeAscDivisionAscSubjectAsc("u-demo-teacher"))
        .thenReturn(List.of(assignment()));
    when(modules.findById("lm-match")).thenReturn(Optional.of(module("lm-match", Map.of("subject", "Mathematics"))));
    when(modules.findByTenantIdAndStatusOrderBySortOrderAsc("tn-demo-school", "published"))
        .thenReturn(List.of(module("lm-match", Map.of("subject", "Mathematics"))));
    when(units.findById("lu-1")).thenReturn(Optional.of(unit("lu-1", "lm-match")));
    when(units.findByModuleIdInOrderByModuleIdAscSortOrderAsc(List.of("lm-match")))
        .thenReturn(List.of(unit("lu-1", "lm-match")));
    when(progress.findByUserIdAndAssignmentIdAndModuleIdAndUnitId("u-demo-teacher", "as-demo-g3a-math", "lm-match", "lu-1"))
        .thenReturn(Optional.empty());
    when(progress.save(any(LearningProgressEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
    when(progress.findByUserIdAndTenantIdAndAssignmentId("u-demo-teacher", "tn-demo-school", "as-demo-g3a-math"))
        .thenReturn(List.of(completed()));
    when(journeyProgress.findByUserIdAndTenantIdAndAssignmentIdAndStepKey("u-demo-teacher", "tn-demo-school", "as-demo-g3a-math", "learning"))
        .thenReturn(Optional.empty());

    var path = service.saveProgress(
        "tn-demo-school",
        "learner@demo.demo",
        new LearningProgressSubmitDto("as-demo-g3a-math", "lm-match", "lu-1", "completed", 100, 300));

    assertThat(path.completedModules()).isEqualTo(1);
    assertThat(path.modules().get(0).progress()).isEqualTo(100);
  }

  private AppUserEntity user() {
    AppUserEntity entity = new AppUserEntity();
    entity.setId("u-demo-teacher");
    entity.setTenantId("tn-demo-school");
    entity.setEmail("learner@demo.demo");
    entity.setName("Demo Teacher");
    entity.setRole("TRAINEE");
    entity.setAvatar("DT");
    entity.setProfile(Map.of());
    return entity;
  }

  private UserAssignmentEntity assignment() {
    UserAssignmentEntity entity = new UserAssignmentEntity();
    entity.setId("as-demo-g3a-math");
    entity.setUserId("u-demo-teacher");
    entity.setTenantId("tn-demo-school");
    entity.setSchoolName("Demo Government School");
    entity.setGrade("Grade 3");
    entity.setDivision("A");
    entity.setSubject("Mathematics");
    entity.setResponsibility("Subject Teacher");
    entity.setPrimaryAssignment(true);
    entity.setActive(true);
    entity.setMetadata(Map.of());
    return entity;
  }

  private LearningModuleEntity module(String id, Map<String, Object> targeting) {
    LearningModuleEntity entity = new LearningModuleEntity();
    entity.setId(id);
    entity.setTenantId("tn-demo-school");
    entity.setTitle("Module " + id);
    entity.setDescription("Demo module");
    entity.setLevel("Foundation");
    entity.setLanguage("Tamil + English");
    entity.setEstimatedMinutes(20);
    entity.setStatus("published");
    entity.setSortOrder(1);
    entity.setTargeting(targeting);
    return entity;
  }

  private LearningUnitEntity unit(String id, String moduleId) {
    LearningUnitEntity entity = new LearningUnitEntity();
    entity.setId(id);
    entity.setModuleId(moduleId);
    entity.setTitle("Unit " + id);
    entity.setType("reading");
    entity.setEstimatedMinutes(5);
    entity.setSortOrder(1);
    entity.setContent(Map.of("summary", "Demo unit"));
    return entity;
  }

  private LearningProgressEntity completed() {
    LearningProgressEntity entity = new LearningProgressEntity();
    entity.setId("lp-1");
    entity.setUserId("u-demo-teacher");
    entity.setTenantId("tn-demo-school");
    entity.setAssignmentId("as-demo-g3a-math");
    entity.setModuleId("lm-match");
    entity.setUnitId("lu-1");
    entity.setStatus("completed");
    entity.setProgressPercent(100);
    return entity;
  }
}
