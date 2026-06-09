package com.shiftora.api.repository;

import com.shiftora.api.domain.LearningUnitEntity;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LearningUnitRepository extends JpaRepository<LearningUnitEntity, String> {
  List<LearningUnitEntity> findByModuleIdOrderBySortOrderAsc(String moduleId);
  List<LearningUnitEntity> findByModuleIdInOrderByModuleIdAscSortOrderAsc(Collection<String> moduleIds);
  void deleteByModuleId(String moduleId);
}
