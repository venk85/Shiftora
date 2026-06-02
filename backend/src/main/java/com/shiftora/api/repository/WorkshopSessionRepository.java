package com.shiftora.api.repository;

import com.shiftora.api.domain.WorkshopSessionEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkshopSessionRepository extends JpaRepository<WorkshopSessionEntity, String> {
  Optional<WorkshopSessionEntity> findFirstByTenantIdOrderByStartsAtAsc(String tenantId);
}
