package com.shiftora.api.controller;

import com.shiftora.api.dto.LearningModuleDto;
import com.shiftora.api.dto.LearningModuleSubmitDto;
import com.shiftora.api.dto.LearningUnitDto;
import com.shiftora.api.dto.LearningUnitSubmitDto;
import com.shiftora.api.service.LearningService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/platform/content")
public class PlatformContentController {
  private final LearningService service;

  public PlatformContentController(LearningService service) {
    this.service = service;
  }

  @GetMapping("/modules")
  public List<LearningModuleDto> modules() {
    return service.platformModules();
  }

  @PostMapping("/modules")
  public LearningModuleDto create(@Valid @RequestBody LearningModuleSubmitDto dto) {
    return service.createPlatformModule(dto);
  }

  @PutMapping("/modules/{id}")
  public LearningModuleDto update(
      @PathVariable String id,
      @Valid @RequestBody LearningModuleSubmitDto dto) {
    return service.updatePlatformModule(id, dto);
  }

  @DeleteMapping("/modules/{id}")
  public void delete(@PathVariable String id) {
    service.deletePlatformModule(id);
  }

  @PostMapping("/modules/{id}/units")
  public LearningUnitDto addUnit(
      @PathVariable String id,
      @Valid @RequestBody LearningUnitSubmitDto dto) {
    return service.addUnit(id, dto);
  }

  @PutMapping("/units/{id}")
  public LearningUnitDto updateUnit(
      @PathVariable String id,
      @Valid @RequestBody LearningUnitSubmitDto dto) {
    return service.updateUnit(id, dto);
  }

  @DeleteMapping("/units/{id}")
  public void deleteUnit(@PathVariable String id) {
    service.deleteUnit(id);
  }
}
