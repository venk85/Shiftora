package com.shiftora.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiftora.api.domain.EducationBlockEntity;
import com.shiftora.api.domain.EducationStateEntity;
import com.shiftora.api.domain.EducationalDistrictEntity;
import com.shiftora.api.repository.EducationBlockRepository;
import com.shiftora.api.repository.EducationStateRepository;
import com.shiftora.api.repository.EducationalDistrictRepository;
import com.shiftora.api.service.KysEducationMasterSyncService;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

@ExtendWith(MockitoExtension.class)
class KysEducationMasterSyncServiceTest {
  @Mock private EducationStateRepository states;
  @Mock private EducationalDistrictRepository districts;
  @Mock private EducationBlockRepository blocks;

  private MockRestServiceServer server;
  private KysEducationMasterSyncService service;

  @BeforeEach
  void setUp() {
    RestClient.Builder builder = RestClient.builder();
    server = MockRestServiceServer.bindTo(builder).build();
    service = new KysEducationMasterSyncService(
        states,
        districts,
        blocks,
        builder
            .baseUrl("https://kys.test/api/")
            .defaultHeader("X-APP-SIGNATURE", "signature")
            .build(),
        new ObjectMapper());
  }

  @Test
  void syncsOfficialStateDistrictAndBlockUdiseHierarchy() {
    when(states.findById("33")).thenReturn(Optional.empty());
    when(districts.findById("3332")).thenReturn(Optional.empty());
    when(blocks.findById("333208")).thenReturn(Optional.empty());

    server.expect(once(), requestTo("https://kys.test/api/states?yearId=11"))
        .andExpect(header("X-APP-SIGNATURE", "signature"))
        .andRespond(withSuccess("""
            {"status":true,"data":[{"stateId":133,"yearId":11,"stateName":"TAMILNADU","udiseStateCode":"33"}]}
            """, MediaType.APPLICATION_JSON));
    server.expect(once(), requestTo("https://kys.test/api/districts?stateId=133&yearId=11"))
        .andRespond(withSuccess("""
            {"status":true,"data":[{"districtId":4331,"yearId":11,"stateId":133,"districtName":"ARIYALUR","udiseDistrictCode":"3332","udiseStateCode":"33"}]}
            """, MediaType.APPLICATION_JSON));
    server.expect(once(), requestTo("https://kys.test/api/blocks?districtId=4331&yearId=11"))
        .andRespond(withSuccess("""
            {"status":true,"data":[{"blockId":43396,"yearId":11,"districtId":4331,"blockName":"ANDIMADAM","udiseBlockCode":"333208","udiseDistrictCode":"3332"}]}
            """, MediaType.APPLICATION_JSON));

    Map<String, Object> result = service.sync("33", 11);

    assertThat(result).containsEntry("states", 1).containsEntry("districts", 1).containsEntry("blocks", 1);

    ArgumentCaptor<EducationStateEntity> state = ArgumentCaptor.forClass(EducationStateEntity.class);
    verify(states).save(state.capture());
    assertThat(state.getValue().getStateCode()).isEqualTo("33");
    assertThat(state.getValue().getUdiseBlockDigits()).isEqualTo(2);

    ArgumentCaptor<EducationalDistrictEntity> district = ArgumentCaptor.forClass(EducationalDistrictEntity.class);
    verify(districts).save(district.capture());
    assertThat(district.getValue().getUdiseDistrictCode()).isEqualTo("3332");
    assertThat(district.getValue().getStateCode()).isEqualTo("33");

    ArgumentCaptor<EducationBlockEntity> block = ArgumentCaptor.forClass(EducationBlockEntity.class);
    verify(blocks).save(block.capture());
    assertThat(block.getValue().getUdiseBlockCode()).isEqualTo("333208");
    assertThat(block.getValue().getUdiseDistrictCode()).isEqualTo("3332");
    assertThat(block.getValue().getStateCode()).isEqualTo("33");

    server.verify();
  }

  @Test
  void ignoresSpecialOrganisationCodesThatAreNotStateOrUtMasters() {
    server.expect(once(), requestTo("https://kys.test/api/states?yearId=11"))
        .andRespond(withSuccess("""
            {"status":true,"data":[{"stateId":192,"yearId":11,"stateName":"KENDRIYA VIDYALAYA SANGHATHAN","udiseStateCode":"92"}]}
            """, MediaType.APPLICATION_JSON));

    Map<String, Object> result = service.sync(null, 11);

    assertThat(result).containsEntry("states", 0).containsEntry("districts", 0).containsEntry("blocks", 0);
    server.verify();
  }
}
