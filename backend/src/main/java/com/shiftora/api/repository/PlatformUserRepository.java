package com.shiftora.api.repository;

import com.shiftora.api.domain.PlatformUserEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlatformUserRepository extends JpaRepository<PlatformUserEntity, String> {
  Optional<PlatformUserEntity> findByEmailIgnoreCase(String email);
}
