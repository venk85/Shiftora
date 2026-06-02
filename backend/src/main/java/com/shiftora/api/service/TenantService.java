package com.shiftora.api.service;

import com.shiftora.api.domain.IndustryKey;
import com.shiftora.api.domain.TenantEntity;
import com.shiftora.api.dto.TenantDto;
import com.shiftora.api.repository.TenantRepository;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
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
    validateEduFields(dto);
    TenantEntity entity = mapper.toEntity(dto);
    TenantEntity saved = repository.save(entity);
    if (saved.getIndustry() == IndustryKey.edu) educationOverview.syncRegisteredSchool(saved);
    return mapper.toDto(saved);
  }

  @Transactional
  public TenantDto update(String id, TenantDto dto) {
    validateEduFields(dto);
    TenantEntity entity = repository.findById(id).orElseThrow(() -> notFound(id));
    mapper.updateEntity(entity, dto);
    TenantEntity saved = repository.save(entity);
    if (saved.getIndustry() == IndustryKey.edu) educationOverview.syncRegisteredSchool(saved);
    return mapper.toDto(saved);
  }

  private void validateEduFields(TenantDto dto) {
    if (dto.industry() != IndustryKey.edu) return;
    if (dto.board() == null || dto.board().isBlank())
      throw new IllegalArgumentException("Board is required for education organizations.");
    if (dto.udiseCode() != null && !dto.udiseCode().isBlank() && !dto.udiseCode().matches("\\d{11}"))
      throw new IllegalArgumentException("UDISE code must be exactly 11 digits.");
    Map<String, String> loc = dto.location();
    if (loc == null || loc.getOrDefault("city", "").isBlank() || loc.getOrDefault("state", "").isBlank())
      throw new IllegalArgumentException("City and state are required for education organizations.");
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
