package com.shiftora.api.repository;

import com.shiftora.api.domain.LearningModuleEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LearningModuleRepository extends JpaRepository<LearningModuleEntity, String> {
  List<LearningModuleEntity> findByTenantIdOrderBySortOrderAsc(String tenantId);
  List<LearningModuleEntity> findByTenantIdAndStatusOrderBySortOrderAsc(String tenantId, String status);
  List<LearningModuleEntity> findByIdInAndStatusOrderBySortOrderAsc(List<String> ids, String status);
  List<LearningModuleEntity> findByIsPlatformTrueAndStatusOrderBySortOrderAsc(String status);
}
