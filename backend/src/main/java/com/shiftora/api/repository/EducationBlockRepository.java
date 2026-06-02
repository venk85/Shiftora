package com.shiftora.api.repository;

import com.shiftora.api.domain.EducationBlockEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EducationBlockRepository extends JpaRepository<EducationBlockEntity, String> {
  List<EducationBlockEntity> findByUdiseDistrictCodeOrderByBlockNameAsc(String udiseDistrictCode);
}
