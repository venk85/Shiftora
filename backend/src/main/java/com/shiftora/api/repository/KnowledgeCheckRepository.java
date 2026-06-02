package com.shiftora.api.repository;

import com.shiftora.api.domain.KnowledgeCheckEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KnowledgeCheckRepository extends JpaRepository<KnowledgeCheckEntity, String> {
  List<KnowledgeCheckEntity> findByTenantIdAndStatusOrderBySortOrderAscUpdatedAtDesc(String tenantId, String status);
}
