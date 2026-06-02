package com.shiftora.api.repository;

import com.shiftora.api.domain.UserAssignmentEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAssignmentRepository extends JpaRepository<UserAssignmentEntity, String> {
  List<UserAssignmentEntity> findByTenantIdOrderBySchoolNameAscGradeAscDivisionAscSubjectAsc(String tenantId);
  List<UserAssignmentEntity> findByUserIdAndTenantIdOrderByPrimaryAssignmentDescGradeAscDivisionAscSubjectAsc(String userId, String tenantId);
  List<UserAssignmentEntity> findByUserIdAndActiveTrueOrderByPrimaryAssignmentDescGradeAscDivisionAscSubjectAsc(String userId);
  Optional<UserAssignmentEntity> findByIdAndTenantId(String id, String tenantId);
  Optional<UserAssignmentEntity> findByIdAndUserId(String id, String userId);
}
