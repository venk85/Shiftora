package com.shiftora.api.repository;

import com.shiftora.api.domain.AppUserEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppUserRepository extends JpaRepository<AppUserEntity, String> {
  Optional<AppUserEntity> findByTenantIdAndEmailIgnoreCase(String tenantId, String email);
  List<AppUserEntity> findByEmailIgnoreCase(String email);
  Optional<AppUserEntity> findByIdAndTenantId(String id, String tenantId);
  List<AppUserEntity> findByTenantIdOrderByName(String tenantId);
}
