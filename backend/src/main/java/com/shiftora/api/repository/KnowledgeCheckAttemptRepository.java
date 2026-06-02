package com.shiftora.api.repository;

import com.shiftora.api.domain.KnowledgeCheckAttemptEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KnowledgeCheckAttemptRepository extends JpaRepository<KnowledgeCheckAttemptEntity, String> {
  List<KnowledgeCheckAttemptEntity> findByTenantId(String tenantId);
  Optional<KnowledgeCheckAttemptEntity> findFirstByUserIdAndTenantIdAndAssignmentIdOrderByCreatedAtDesc(String userId, String tenantId, String assignmentId);
  Optional<KnowledgeCheckAttemptEntity> findFirstByUserIdAndTenantIdAndAssignmentIdIsNullOrderByCreatedAtDesc(String userId, String tenantId);
}
