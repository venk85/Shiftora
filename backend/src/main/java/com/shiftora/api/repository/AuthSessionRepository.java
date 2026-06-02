package com.shiftora.api.repository;

import com.shiftora.api.domain.AuthSessionEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuthSessionRepository extends JpaRepository<AuthSessionEntity, String> {
  Optional<AuthSessionEntity> findByTokenHashAndRevokedAtIsNull(String tokenHash);
}
