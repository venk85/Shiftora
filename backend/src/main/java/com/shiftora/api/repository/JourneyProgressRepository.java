package com.shiftora.api.repository;

import com.shiftora.api.domain.JourneyProgressEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JourneyProgressRepository extends JpaRepository<JourneyProgressEntity, String> {
  List<JourneyProgressEntity> findByUserIdAndTenantIdAndAssignmentIdOrderByStepKey(String userId, String tenantId, String assignmentId);
  List<JourneyProgressEntity> findByUserIdAndTenantIdAndAssignmentIdIsNullOrderByStepKey(String userId, String tenantId);
  List<JourneyProgressEntity> findByUserIdAndTenantIdAndStepKey(String userId, String tenantId, String stepKey);
  Optional<JourneyProgressEntity> findByUserIdAndTenantIdAndAssignmentIdAndStepKey(String userId, String tenantId, String assignmentId, String stepKey);
  Optional<JourneyProgressEntity> findByUserIdAndTenantIdAndAssignmentIdIsNullAndStepKey(String userId, String tenantId, String stepKey);
}
