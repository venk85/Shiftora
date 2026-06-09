package com.shiftora.api.controller;

import com.shiftora.api.dto.LearningModuleDto;
import com.shiftora.api.dto.LearningModuleSubmitDto;
import com.shiftora.api.dto.LearningPathDto;
import com.shiftora.api.dto.LearningProgressSubmitDto;
import com.shiftora.api.dto.LearningUnitDto;
import com.shiftora.api.dto.LearningUnitSubmitDto;
import com.shiftora.api.dto.TenantModuleAdoptionDto;
import com.shiftora.api.dto.TenantModuleAdoptionSubmitDto;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class LearningController {
  private final LearningService service;

  public LearningController(LearningService service) {
    this.service = service;
  }

  // ── Learner ───────────────────────────────────────────────────────────────

  @GetMapping("/users/me/learning-path")
  public LearningPathDto learningPath(
      @RequestParam String tenantId,
      @RequestParam String email,
      @RequestParam(required = false) String assignmentId) {
    return service.learningPath(tenantId, email, assignmentId);
  }

  @PostMapping("/users/me/learning-progress")
  public LearningPathDto saveProgress(
      @RequestParam String tenantId,
      @RequestParam String email,
      @Valid @RequestBody LearningProgressSubmitDto dto) {
    return service.saveProgress(tenantId, email, dto);
  }

  // ── Admin: own modules ────────────────────────────────────────────────────

  @GetMapping("/admin/learning-modules")
  public List<LearningModuleDto> adminModules(@RequestParam String tenantId) {
    return service.adminModules(tenantId);
  }

  @PostMapping("/admin/learning-modules")
  public LearningModuleDto createModule(
      @RequestParam String tenantId,
      @Valid @RequestBody LearningModuleSubmitDto dto) {
    return service.createModule(tenantId, dto);
  }

  @PutMapping("/admin/learning-modules/{id}")
  public LearningModuleDto updateModule(
      @RequestParam String tenantId,
      @PathVariable String id,
      @Valid @RequestBody LearningModuleSubmitDto dto) {
    return service.updateModule(tenantId, id, dto);
  }

  @DeleteMapping("/admin/learning-modules/{id}")
  public void deleteModule(@RequestParam String tenantId, @PathVariable String id) {
    service.deleteModule(tenantId, id);
  }

  @PostMapping("/admin/learning-modules/{id}/units")
  public LearningUnitDto addUnit(
      @PathVariable String id,
      @Valid @RequestBody LearningUnitSubmitDto dto) {
    return service.addUnit(id, dto);
  }

  @PutMapping("/admin/learning-units/{id}")
  public LearningUnitDto updateUnit(
      @PathVariable String id,
      @Valid @RequestBody LearningUnitSubmitDto dto) {
    return service.updateUnit(id, dto);
  }

  @DeleteMapping("/admin/learning-units/{id}")
  public void deleteUnit(@PathVariable String id) {
    service.deleteUnit(id);
  }

  // ── Admin: platform catalog + adoptions ───────────────────────────────────

  @GetMapping("/admin/platform-catalog")
  public List<LearningModuleDto> platformCatalog(@RequestParam String tenantId) {
    return service.platformCatalog(tenantId);
  }

  @PostMapping("/admin/module-adoptions")
  public TenantModuleAdoptionDto adoptModule(
      @RequestParam String tenantId,
      @Valid @RequestBody TenantModuleAdoptionSubmitDto dto) {
    return service.adoptModule(tenantId, dto);
  }

  @PutMapping("/admin/module-adoptions/{moduleId}")
  public TenantModuleAdoptionDto updateAdoption(
      @RequestParam String tenantId,
      @PathVariable String moduleId,
      @Valid @RequestBody TenantModuleAdoptionSubmitDto dto) {
    return service.updateAdoption(tenantId, moduleId, dto);
  }

  @DeleteMapping("/admin/module-adoptions/{moduleId}")
  public void removeAdoption(@RequestParam String tenantId, @PathVariable String moduleId) {
    service.removeAdoption(tenantId, moduleId);
  }
}
