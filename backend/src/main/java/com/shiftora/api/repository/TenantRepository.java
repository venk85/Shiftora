package com.shiftora.api.repository;

import com.shiftora.api.domain.IndustryKey;
import com.shiftora.api.domain.TenantEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantRepository extends JpaRepository<TenantEntity, String> {
  List<TenantEntity> findByIndustryOrderByCreatedAtAsc(IndustryKey industry);
}
