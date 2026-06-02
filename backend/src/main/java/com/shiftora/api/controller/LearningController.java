package com.shiftora.api.controller;

import com.shiftora.api.dto.LearningPathDto;
import com.shiftora.api.dto.LearningModuleDto;
import com.shiftora.api.dto.LearningProgressSubmitDto;
import com.shiftora.api.service.LearningService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
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

  @GetMapping("/admin/learning-modules")
  public List<LearningModuleDto> adminModules(@RequestParam String tenantId) {
    return service.adminModules(tenantId);
  }
}
