package com.shiftora.api.repository;

import com.shiftora.api.domain.TenantModuleAdoptionEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantModuleAdoptionRepository extends JpaRepository<TenantModuleAdoptionEntity, String> {
  List<TenantModuleAdoptionEntity> findByTenantIdOrderBySortOrderAsc(String tenantId);
  Optional<TenantModuleAdoptionEntity> findByTenantIdAndModuleId(String tenantId, String moduleId);
  void deleteByTenantIdAndModuleId(String tenantId, String moduleId);
}
