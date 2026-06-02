package com.shiftora.api.service;

import com.shiftora.api.dto.PracticeEntryDto;
import com.shiftora.api.repository.PracticeEntryRepository;
import com.shiftora.api.repository.TenantRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PracticeService {
  private final PracticeEntryRepository repository;
  private final TenantRepository tenantRepository;
  private final PracticeMapper mapper;

  public PracticeService(
      PracticeEntryRepository repository, TenantRepository tenantRepository, PracticeMapper mapper) {
    this.repository = repository;
    this.tenantRepository = tenantRepository;
    this.mapper = mapper;
  }

  @Transactional(readOnly = true)
  public List<PracticeEntryDto> findForTenant(String tenantId) {
    ensureTenant(tenantId);
    return repository.findTop50ByTenantIdOrderByCreatedAtDesc(tenantId).stream().map(mapper::toDto).toList();
  }

  @Transactional
  public PracticeEntryDto create(PracticeEntryDto dto) {
    ensureTenant(dto.tenantId());
    return mapper.toDto(repository.save(mapper.toEntity(dto)));
  }

  private void ensureTenant(String tenantId) {
    if (!tenantRepository.existsById(tenantId)) {
      throw new NotFoundException("Tenant not found: " + tenantId);
    }
  }
}
