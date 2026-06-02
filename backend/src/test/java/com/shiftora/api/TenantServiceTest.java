package com.shiftora.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiftora.api.domain.IndustryKey;
import com.shiftora.api.domain.TenantEntity;
import com.shiftora.api.dto.PersonaDto;
import com.shiftora.api.dto.SubdivisionDto;
import com.shiftora.api.dto.TenantDto;
import com.shiftora.api.repository.TenantRepository;
import com.shiftora.api.service.NotFoundException;
import com.shiftora.api.service.EducationOverviewService;
import com.shiftora.api.service.TenantMapper;
import com.shiftora.api.service.TenantService;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TenantServiceTest {
  @Mock private TenantRepository repository;
  @Mock private EducationOverviewService educationOverview;

  private TenantService service;
  private TenantMapper mapper;

  @BeforeEach
  void setUp() {
    mapper = new TenantMapper(new ObjectMapper());
    service = new TenantService(repository, mapper, educationOverview);
  }

  @Test
  void createsTenantWithFlexibleJsonbConfig() {
    TenantDto request = tenant("tn-new", "New School");
    when(repository.save(any(TenantEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

    TenantDto saved = service.create(request);

    assertThat(saved.id()).isEqualTo("tn-new");
    assertThat(saved.aiName()).isEqualTo("Shiksha AI");
    assertThat(saved.subdivisions()).hasSize(1);
    verify(repository).save(any(TenantEntity.class));
    verify(educationOverview).syncRegisteredSchool(any(TenantEntity.class));
  }

  @Test
  void updatesExistingTenant() {
    TenantEntity existing = mapper.toEntity(tenant("tn-existing", "Old Name"));
    when(repository.findById("tn-existing")).thenReturn(Optional.of(existing));
    when(repository.save(any(TenantEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

    TenantDto updated = service.update("tn-existing", tenant("tn-existing", "New Name"));

    assertThat(updated.name()).isEqualTo("New Name");
    assertThat(updated.roleLabels()).containsExactly("Platform", "School Admin", "Principal", "HOD", "Teacher");
    verify(educationOverview).syncRegisteredSchool(existing);
  }

  @Test
  void updateMissingTenantFailsClearly() {
    when(repository.findById("missing")).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.update("missing", tenant("missing", "Missing")))
        .isInstanceOf(NotFoundException.class)
        .hasMessageContaining("Tenant not found");
  }

  @Test
  void tenantCanBeDeletedByPlatformAdmin() {
    TenantEntity tenant = mapper.toEntity(tenant("tn-existing", "Existing School"));
    when(repository.findById("tn-existing")).thenReturn(Optional.of(tenant));

    service.delete("tn-existing");

    verify(repository).delete(tenant);
  }

  private TenantDto tenant(String id, String name) {
    return new TenantDto(
        id,
        name,
        "TPS",
        "K-12 School",
        80,
        IndustryKey.edu,
        "CBSE",
        Map.of("city", "Chennai", "state", "Tamil Nadu", "country", "India"),
        "33010020034",
        Map.of("status", "ASSIGNED"),
        "",
        "Shiksha AI",
        "Departments",
        List.of(new SubdivisionDto("sd-test", "English", "A. Teacher", "HOD", "Language department", 50, 60, 12)),
        List.of("Platform", "School Admin", "Principal", "HOD", "Teacher"),
        Map.of(
            "admin", new PersonaDto("Admin", "School Admin", "AD"),
            "principal", new PersonaDto("Principal", "Principal", "PR"),
            "hod", new PersonaDto("HOD", "HOD", "HD"),
            "learner", new PersonaDto("Teacher", "Teacher", "TR")),
        "#4069F0",
        40,
        50,
        "Use classroom-ready language.",
        0);
  }
}
