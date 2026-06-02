package com.shiftora.api.repository;

import com.shiftora.api.domain.ReadinessTemplateEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReadinessTemplateRepository extends JpaRepository<ReadinessTemplateEntity, String> {
  List<ReadinessTemplateEntity> findByTenantIdOrderBySortOrderAscUpdatedAtDesc(String tenantId);
  List<ReadinessTemplateEntity> findByTenantIdAndStatusOrderBySortOrderAscUpdatedAtDesc(String tenantId, String status);
}
