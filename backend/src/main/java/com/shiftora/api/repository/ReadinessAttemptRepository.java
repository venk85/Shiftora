package com.shiftora.api.repository;

import com.shiftora.api.domain.ReadinessAttemptEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReadinessAttemptRepository extends JpaRepository<ReadinessAttemptEntity, String> {
  List<ReadinessAttemptEntity> findByUserIdAndTenantIdOrderByCreatedAtDesc(String userId, String tenantId);
  Optional<ReadinessAttemptEntity> findFirstByUserIdAndTenantIdAndAssignmentIdOrderByCreatedAtDesc(String userId, String tenantId, String assignmentId);
  Optional<ReadinessAttemptEntity> findFirstByUserIdAndTenantIdAndAssignmentIdIsNullOrderByCreatedAtDesc(String userId, String tenantId);
}
