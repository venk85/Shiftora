package com.shiftora.api.service;

import com.shiftora.api.domain.WorkshopSessionEntity;
import com.shiftora.api.dto.WorkshopSessionDto;
import com.shiftora.api.repository.TenantRepository;
import com.shiftora.api.repository.WorkshopSessionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WorkshopService {
  private final WorkshopSessionRepository sessions;
  private final TenantRepository tenants;

  public WorkshopService(WorkshopSessionRepository sessions, TenantRepository tenants) {
    this.sessions = sessions;
    this.tenants = tenants;
  }

  @Transactional(readOnly = true)
  public WorkshopSessionDto workshop(String tenantId) {
    if (!tenants.existsById(tenantId)) throw new NotFoundException("Tenant not found: " + tenantId);
    return sessions.findFirstByTenantIdOrderByStartsAtAsc(tenantId)
        .map(this::toDto)
        .orElseThrow(() -> new NotFoundException("Workshop session not configured"));
  }

  private WorkshopSessionDto toDto(WorkshopSessionEntity entity) {
    return new WorkshopSessionDto(
        entity.getId(),
        entity.getTenantId(),
        entity.getTitle(),
        entity.getStatus(),
        entity.getStartsAt(),
        entity.getDurationMinutes(),
        entity.getFacilitator(),
        entity.getMeetingUrl(),
        entity.getAttendeeCount(),
        entity.getAgenda(),
        entity.getPrerequisites());
  }
}
