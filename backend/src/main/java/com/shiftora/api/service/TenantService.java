package com.shiftora.api.service;

import com.shiftora.api.domain.IndustryKey;
import com.shiftora.api.domain.TenantEntity;
import com.shiftora.api.dto.TenantDto;
import com.shiftora.api.repository.TenantRepository;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TenantService {
  private final TenantRepository repository;
  private final TenantMapper mapper;
  private final EducationOverviewService educationOverview;

  public TenantService(TenantRepository repository, TenantMapper mapper, EducationOverviewService educationOverview) {
    this.repository = repository;
    this.mapper = mapper;
    this.educationOverview = educationOverview;
  }

  @Transactional(readOnly = true)
  public List<TenantDto> findAll(IndustryKey industry) {
    List<TenantEntity> entities =
        industry == null
            ? repository.findAll().stream()
                .sorted(Comparator.comparingLong(TenantEntity::getCreatedAt))
                .toList()
            : repository.findByIndustryOrderByCreatedAtAsc(industry);
    return entities.stream().map(mapper::toDto).toList();
  }

  @Transactional(readOnly = true)
  public TenantDto get(String id) {
    return repository.findById(id).map(mapper::toDto).orElseThrow(() -> notFound(id));
  }

  @Transactional
  public TenantDto create(TenantDto dto) {
    TenantEntity entity = mapper.toEntity(dto);
    TenantEntity saved = repository.save(entity);
    if (saved.getIndustry() == IndustryKey.edu) educationOverview.syncRegisteredSchool(saved);
    return mapper.toDto(saved);
  }

  @Transactional
  public TenantDto update(String id, TenantDto dto) {
    TenantEntity entity = repository.findById(id).orElseThrow(() -> notFound(id));
    mapper.updateEntity(entity, dto);
    TenantEntity saved = repository.save(entity);
    if (saved.getIndustry() == IndustryKey.edu) educationOverview.syncRegisteredSchool(saved);
    return mapper.toDto(saved);
  }

  @Transactional
  public void delete(String id) {
    TenantEntity entity = repository.findById(id).orElseThrow(() -> notFound(id));
    repository.delete(entity);
  }

  private NotFoundException notFound(String id) {
    return new NotFoundException("Tenant not found: " + id);
  }
}
