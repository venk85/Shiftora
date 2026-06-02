package com.shiftora.api.repository;

import com.shiftora.api.domain.EducationStateEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EducationStateRepository extends JpaRepository<EducationStateEntity, String> {
  List<EducationStateEntity> findAllByOrderByStateNameAsc();
}
