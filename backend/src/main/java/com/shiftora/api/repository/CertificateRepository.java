package com.shiftora.api.repository;

import com.shiftora.api.domain.CertificateEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CertificateRepository extends JpaRepository<CertificateEntity, String> {
  List<CertificateEntity> findByTenantId(String tenantId);
  Optional<CertificateEntity> findByUserIdAndTenantIdAndAssignmentId(String userId, String tenantId, String assignmentId);
  Optional<CertificateEntity> findByUserIdAndTenantIdAndAssignmentIdIsNull(String userId, String tenantId);
}
