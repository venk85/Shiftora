package com.shiftora.api.repository;

import com.shiftora.api.domain.IndustryKey;
import com.shiftora.api.domain.ScenarioEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScenarioRepository extends JpaRepository<ScenarioEntity, String> {
  List<ScenarioEntity> findByIndustryOrderBySortOrderAsc(IndustryKey industry);
  List<ScenarioEntity> findAllByOrderByIndustryAscSortOrderAsc();
}
