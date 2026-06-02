package com.shiftora.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiftora.api.domain.PracticeEntryEntity;
import com.shiftora.api.dto.PracticeEntryDto;
import com.shiftora.api.dto.ScoreDto;
import com.shiftora.api.repository.PracticeEntryRepository;
import com.shiftora.api.repository.TenantRepository;
import com.shiftora.api.service.NotFoundException;
import com.shiftora.api.service.PracticeMapper;
import com.shiftora.api.service.PracticeService;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PracticeServiceTest {
  @Mock private PracticeEntryRepository repository;
  @Mock private TenantRepository tenantRepository;

  private PracticeService service;

  @BeforeEach
  void setUp() {
    service = new PracticeService(repository, tenantRepository, new PracticeMapper(new ObjectMapper()));
  }

  @Test
  void createsPracticeEntryForExistingTenant() {
    when(tenantRepository.existsById("org-alpha")).thenReturn(true);
    when(repository.save(any(PracticeEntryEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

    PracticeEntryDto saved = service.create(entry());

    assertThat(saved.id()).startsWith("pe-");
    assertThat(saved.output()).isEqualTo("Generated lesson");
    assertThat(saved.scores()).containsExactly(new ScoreDto("Clarity", 91));
    verify(repository).save(any(PracticeEntryEntity.class));
  }

  @Test
  void rejectsPracticeEntryForMissingTenant() {
    when(tenantRepository.existsById("org-alpha")).thenReturn(false);

    assertThatThrownBy(() -> service.create(entry()))
        .isInstanceOf(NotFoundException.class)
        .hasMessageContaining("Tenant not found");
  }

  private PracticeEntryDto entry() {
    return new PracticeEntryDto(
        null,
        "edu-lesson",
        "Lesson Plan Lab",
        "org-alpha",
        Map.of("subject", "English"),
        "Generated lesson",
        List.of(new ScoreDto("Clarity", 91)),
        0);
  }
}
