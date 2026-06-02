package com.shiftora.api.repository;

import com.shiftora.api.domain.RegisteredSchoolEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RegisteredSchoolRepository extends JpaRepository<RegisteredSchoolEntity, String> {
  List<RegisteredSchoolEntity> findByUdiseBlockCodeOrderBySchoolNameAsc(String udiseBlockCode);
  List<RegisteredSchoolEntity> findByUdiseBlockCodeAndTenantIdIsNotNullOrderBySchoolNameAsc(String udiseBlockCode);
  List<RegisteredSchoolEntity> findByUdiseDistrictCodeOrderByUdiseBlockCodeAscSchoolNameAsc(String udiseDistrictCode);
  List<RegisteredSchoolEntity> findByUdiseDistrictCodeAndTenantIdIsNotNullOrderByUdiseBlockCodeAscSchoolNameAsc(String udiseDistrictCode);
  List<RegisteredSchoolEntity> findByTenantId(String tenantId);
}
