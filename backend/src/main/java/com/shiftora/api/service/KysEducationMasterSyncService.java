package com.shiftora.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiftora.api.domain.EducationBlockEntity;
import com.shiftora.api.domain.EducationStateEntity;
import com.shiftora.api.domain.EducationalDistrictEntity;
import com.shiftora.api.repository.EducationBlockRepository;
import com.shiftora.api.repository.EducationStateRepository;
import com.shiftora.api.repository.EducationalDistrictRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.boot.web.client.ClientHttpRequestFactories;
import org.springframework.boot.web.client.ClientHttpRequestFactorySettings;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

@Service
public class KysEducationMasterSyncService {
  private static final String STATE_CODE_PATTERN = "\\d{2}";
  private static final String DISTRICT_CODE_PATTERN = "\\d{4}";
  private static final String BLOCK_CODE_PATTERN = "\\d{6}";

  private final EducationStateRepository states;
  private final EducationalDistrictRepository districts;
  private final EducationBlockRepository blocks;
  private final RestClient restClient;
  private final ObjectMapper objectMapper;

  @Autowired
  public KysEducationMasterSyncService(
      EducationStateRepository states,
      EducationalDistrictRepository districts,
      EducationBlockRepository blocks,
      RestClient.Builder restClientBuilder,
      ObjectMapper objectMapper,
      @Value("${shiftora.kys.api-base-url}") String apiBaseUrl,
      @Value("${shiftora.kys.app-signature}") String appSignature) {
    this.states = states;
    this.districts = districts;
    this.blocks = blocks;
    this.restClient = restClientBuilder
        .baseUrl(apiBaseUrl)
        .requestFactory(ClientHttpRequestFactories.get(ClientHttpRequestFactorySettings.DEFAULTS
            .withConnectTimeout(java.time.Duration.ofSeconds(5))
            .withReadTimeout(java.time.Duration.ofSeconds(15))))
        .defaultHeader("X-APP-SIGNATURE", appSignature)
        .build();
    this.objectMapper = objectMapper;
  }

  public KysEducationMasterSyncService(
      EducationStateRepository states,
      EducationalDistrictRepository districts,
      EducationBlockRepository blocks,
      RestClient restClient,
      ObjectMapper objectMapper) {
    this.states = states;
    this.districts = districts;
    this.blocks = blocks;
    this.restClient = restClient;
    this.objectMapper = objectMapper;
  }

  @Transactional
  public Map<String, Object> sync(String requestedStateCode, int yearId) {
    List<JsonNode> officialStates = data("states?yearId=" + yearId);
    int statesImported = 0;
    int districtsImported = 0;
    int blocksImported = 0;
    List<String> syncedStates = new ArrayList<>();

    for (JsonNode stateRow : officialStates) {
      String stateCode = text(stateRow, "udiseStateCode");
      if (!isCurrentStateOrUtCode(stateCode)) continue;
      if (requestedStateCode != null && !requestedStateCode.isBlank() && !requestedStateCode.equals(stateCode)) continue;

      EducationStateEntity state = states.findById(stateCode).orElse(new EducationStateEntity());
      state.setStateCode(stateCode);
      state.setStateName(text(stateRow, "stateName"));
      state.setBlockUnitName("Block");
      state.setBlockOfficerTitle("Block-level education authority");
      state.setDistrictOfficerTitle("District-level education authority");
      state.setUdiseBlockDigits(2);
      states.save(state);
      statesImported++;
      syncedStates.add(stateCode);

      int kysStateId = stateRow.path("stateId").asInt();
      List<JsonNode> officialDistricts = data("districts?stateId=" + kysStateId + "&yearId=" + yearId);
      for (JsonNode districtRow : officialDistricts) {
        String districtCode = text(districtRow, "udiseDistrictCode");
        if (!validDistrictCode(districtCode, stateCode)) continue;

        EducationalDistrictEntity district = districts.findById(districtCode).orElse(new EducationalDistrictEntity());
        district.setUdiseDistrictCode(districtCode);
        district.setStateCode(stateCode);
        district.setDistrictName(text(districtRow, "districtName"));
        district.setDeoOfficeName(text(districtRow, "districtName") + " District education authority");
        district.setDeoContact("");
        districts.save(district);
        districtsImported++;

        int kysDistrictId = districtRow.path("districtId").asInt();
        List<JsonNode> officialBlocks = data("blocks?districtId=" + kysDistrictId + "&yearId=" + yearId);
        for (JsonNode blockRow : officialBlocks) {
          String blockCode = text(blockRow, "udiseBlockCode");
          String blockDistrictCode = text(blockRow, "udiseDistrictCode");
          if (!districtCode.equals(blockDistrictCode) || !validBlockCode(blockCode, districtCode)) continue;

          EducationBlockEntity block = blocks.findById(blockCode).orElse(new EducationBlockEntity());
          block.setUdiseBlockCode(blockCode);
          block.setUdiseDistrictCode(districtCode);
          block.setStateCode(stateCode);
          block.setBlockName(text(blockRow, "blockName"));
          block.setBeoOfficeName(text(blockRow, "blockName") + " Block education authority");
          block.setBeoContact("");
          blocks.save(block);
          blocksImported++;
        }
      }
    }

    return Map.of(
        "source", "KYS UDISE+ public API",
        "yearId", yearId,
        "states", statesImported,
        "districts", districtsImported,
        "blocks", blocksImported,
        "syncedStateCodes", syncedStates);
  }

  private List<JsonNode> data(String path) {
    String body = restClient.get().uri(path).retrieve().body(String.class);
    try {
      JsonNode root = objectMapper.readTree(body);
      if (!root.path("status").asBoolean(false)) {
        String message = root.path("error").path("errorDetails").path("details").asText(root.path("message").asText("KYS API returned no data"));
        throw new IllegalArgumentException(message);
      }
      JsonNode data = root.path("data");
      if (!data.isArray()) return List.of();
      List<JsonNode> rows = new ArrayList<>();
      data.forEach(rows::add);
      return rows;
    } catch (Exception e) {
      if (e instanceof IllegalArgumentException illegalArgumentException) throw illegalArgumentException;
      throw new IllegalArgumentException("Could not parse KYS UDISE+ response for " + path, e);
    }
  }

  private boolean isCurrentStateOrUtCode(String code) {
    if (!code.matches(STATE_CODE_PATTERN)) return false;
    int numeric = Integer.parseInt(code);
    return numeric >= 1 && numeric <= 38;
  }

  private boolean validDistrictCode(String districtCode, String stateCode) {
    return districtCode.matches(DISTRICT_CODE_PATTERN) && districtCode.startsWith(stateCode);
  }

  private boolean validBlockCode(String blockCode, String districtCode) {
    return blockCode.matches(BLOCK_CODE_PATTERN) && blockCode.startsWith(districtCode);
  }

  private String text(JsonNode node, String field) {
    return node.path(field).asText("").trim();
  }
}
