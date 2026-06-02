package com.shiftora.api.controller;

import com.shiftora.api.domain.IndustryKey;
import com.shiftora.api.dto.ScenarioDto;
import com.shiftora.api.service.ScenarioService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/scenarios")
public class ScenarioController {
  private final ScenarioService service;

  public ScenarioController(ScenarioService service) {
    this.service = service;
  }

  @GetMapping
  public List<ScenarioDto> findAll(@RequestParam(required = false) String industry) {
    return service.findAll(IndustryKey.fromRequestValue(industry));
  }
}
