package com.shiftora.api.repository;

import com.shiftora.api.domain.WorkshopCompletionEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkshopCompletionRepository extends JpaRepository<WorkshopCompletionEntity, String> {
  List<WorkshopCompletionEntity> findByTenantId(String tenantId);
  Optional<WorkshopCompletionEntity> findByUserIdAndTenantIdAndAssignmentId(String userId, String tenantId, String assignmentId);
  Optional<WorkshopCompletionEntity> findByUserIdAndTenantIdAndAssignmentIdIsNull(String userId, String tenantId);
}
