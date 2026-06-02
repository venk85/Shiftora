package com.shiftora.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.shiftora.api.domain.EducationBlockEntity;
import com.shiftora.api.domain.EducationStateEntity;
import com.shiftora.api.domain.EducationalDistrictEntity;
import com.shiftora.api.repository.EducationAssignmentReviewRepository;
import com.shiftora.api.repository.EducationBlockRepository;
import com.shiftora.api.repository.EducationStateRepository;
import com.shiftora.api.repository.EducationalDistrictRepository;
import com.shiftora.api.repository.TnSchoolMasterRepository;
import com.shiftora.api.service.EducationDirectoryService;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

@ExtendWith(MockitoExtension.class)
class EducationDirectoryServiceTest {
  @Mock private EducationStateRepository states;
  @Mock private EducationalDistrictRepository districts;
  @Mock private EducationBlockRepository blocks;
  @Mock private EducationAssignmentReviewRepository reviews;
  @Mock private TnSchoolMasterRepository schoolMaster;

  private EducationDirectoryService service;

  @BeforeEach
  void setUp() {
    service = new EducationDirectoryService(states, districts, blocks, reviews, schoolMaster);
  }

  @Test
  void importsDistrictsOnlyWhenCodeBelongsToStatePrefix() throws Exception {
    when(states.findById("37")).thenReturn(Optional.of(state("37", "Ladakh")));
    when(districts.findById("3708")).thenReturn(Optional.empty());

    Map<String, Object> result = service.importDistricts(csv(
        "udise_district_code,state_code,district_name,deo_office_name,deo_contact\n"
            + "3708,37,KARGIL,Kargil District Office,deo@example.gov.in\n"));

    assertThat(result).containsEntry("imported", 1);
    ArgumentCaptor<EducationalDistrictEntity> saved = ArgumentCaptor.forClass(EducationalDistrictEntity.class);
    verify(districts).save(saved.capture());
    assertThat(saved.getValue().getUdiseDistrictCode()).isEqualTo("3708");
    assertThat(saved.getValue().getStateCode()).isEqualTo("37");
  }

  @Test
  void rejectsDistrictImportWhenPrefixDoesNotMatchState() {
    assertThatThrownBy(() -> service.importDistricts(csv(
        "udise_district_code,state_code,district_name\n"
            + "3308,37,KARGIL\n")))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("must start with state code 37");
  }

  @Test
  void importsBlocksOnlyWhenCodeBelongsToDistrictPrefix() throws Exception {
    when(states.findById("37")).thenReturn(Optional.of(state("37", "Ladakh")));
    when(districts.findById("3708")).thenReturn(Optional.of(district("3708", "37", "KARGIL")));
    when(blocks.findById("370801")).thenReturn(Optional.empty());

    Map<String, Object> result = service.importBlocks(csv(
        "udise_block_code,udise_district_code,state_code,block_name,beo_office_name,beo_contact\n"
            + "370801,3708,37,KARGIL,Kargil Block Office,beo@example.gov.in\n"));

    assertThat(result).containsEntry("imported", 1);
    ArgumentCaptor<EducationBlockEntity> saved = ArgumentCaptor.forClass(EducationBlockEntity.class);
    verify(blocks).save(saved.capture());
    assertThat(saved.getValue().getUdiseBlockCode()).isEqualTo("370801");
    assertThat(saved.getValue().getUdiseDistrictCode()).isEqualTo("3708");
    assertThat(saved.getValue().getStateCode()).isEqualTo("37");
  }

  @Test
  void rejectsBlockImportWhenPrefixDoesNotMatchDistrict() {
    assertThatThrownBy(() -> service.importBlocks(csv(
        "udise_block_code,udise_district_code,state_code,block_name\n"
            + "370901,3708,37,KARGIL\n")))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("must start with district code 3708");
  }

  private MockMultipartFile csv(String content) {
    return new MockMultipartFile("file", "udise.csv", "text/csv", content.getBytes(StandardCharsets.UTF_8));
  }

  private EducationStateEntity state(String code, String name) {
    EducationStateEntity entity = new EducationStateEntity();
    entity.setStateCode(code);
    entity.setStateName(name);
    entity.setBlockUnitName("Block");
    entity.setBlockOfficerTitle("Block-level MIS / education authority");
    entity.setDistrictOfficerTitle("District-level MIS / education authority");
    entity.setUdiseBlockDigits(2);
    return entity;
  }

  private EducationalDistrictEntity district(String code, String stateCode, String name) {
    EducationalDistrictEntity entity = new EducationalDistrictEntity();
    entity.setUdiseDistrictCode(code);
    entity.setStateCode(stateCode);
    entity.setDistrictName(name);
    entity.setDeoOfficeName(name + " District Office");
    return entity;
  }
}
