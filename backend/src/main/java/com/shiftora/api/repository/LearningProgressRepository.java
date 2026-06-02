package com.shiftora.api.repository;

import com.shiftora.api.domain.LearningProgressEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LearningProgressRepository extends JpaRepository<LearningProgressEntity, String> {
  List<LearningProgressEntity> findByUserIdAndTenantIdAndAssignmentId(String userId, String tenantId, String assignmentId);
  Optional<LearningProgressEntity> findByUserIdAndAssignmentIdAndModuleIdAndUnitId(String userId, String assignmentId, String moduleId, String unitId);
}
