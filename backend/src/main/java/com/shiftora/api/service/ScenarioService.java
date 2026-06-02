package com.shiftora.api.service;

import com.shiftora.api.domain.IndustryKey;
import com.shiftora.api.dto.ScenarioDto;
import com.shiftora.api.repository.ScenarioRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ScenarioService {
  private final ScenarioRepository repository;
  private final ScenarioMapper mapper;

  public ScenarioService(ScenarioRepository repository, ScenarioMapper mapper) {
    this.repository = repository;
    this.mapper = mapper;
  }

  @Transactional(readOnly = true)
  public List<ScenarioDto> findAll(IndustryKey industry) {
    return (industry == null
            ? repository.findAllByOrderByIndustryAscSortOrderAsc()
            : repository.findByIndustryOrderBySortOrderAsc(industry))
        .stream().map(mapper::toDto).toList();
  }
}
