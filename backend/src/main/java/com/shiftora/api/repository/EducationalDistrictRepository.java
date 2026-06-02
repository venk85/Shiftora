package com.shiftora.api.repository;

import com.shiftora.api.domain.EducationalDistrictEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EducationalDistrictRepository extends JpaRepository<EducationalDistrictEntity, String> {
  List<EducationalDistrictEntity> findByStateCodeOrderByDistrictNameAsc(String stateCode);
}
