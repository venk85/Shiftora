package com.shiftora.api.repository;

import com.shiftora.api.domain.PracticeEntryEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PracticeEntryRepository extends JpaRepository<PracticeEntryEntity, String> {
  List<PracticeEntryEntity> findTop50ByTenantIdOrderByCreatedAtDesc(String tenantId);
  long countByTenantId(String tenantId);
}
