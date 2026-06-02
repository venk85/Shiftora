package com.shiftora.api.controller;

import com.shiftora.api.dto.CertificateGenerateDto;
import com.shiftora.api.dto.CompletionRowDto;
import com.shiftora.api.dto.KnowledgeAttemptDto;
import com.shiftora.api.dto.KnowledgeCheckDto;
import com.shiftora.api.dto.KnowledgeSubmitDto;
import com.shiftora.api.dto.WorkshopCompleteDto;
import com.shiftora.api.service.CompletionService;
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
public class CompletionController {
  private final CompletionService service;

  public CompletionController(CompletionService service) {
    this.service = service;
  }

  @GetMapping("/users/me/knowledge-check")
  public KnowledgeCheckDto knowledgeCheck(
      @RequestParam String tenantId,
      @RequestParam String email,
      @RequestParam(required = false) String assignmentId) {
    return service.knowledgeCheck(tenantId, email, assignmentId);
  }

  @PostMapping("/users/me/knowledge-check/attempts")
  public KnowledgeAttemptDto submitKnowledge(
      @RequestParam String tenantId,
      @RequestParam String email,
      @Valid @RequestBody KnowledgeSubmitDto dto) {
    return service.submitKnowledge(tenantId, email, dto);
  }

  @GetMapping("/admin/completion")
  public List<CompletionRowDto> completionRows(@RequestParam String tenantId) {
    return service.completionRows(tenantId);
  }

  @PostMapping("/admin/workshop-completions")
  public CompletionRowDto markWorkshop(
      @RequestParam String tenantId,
      @Valid @RequestBody WorkshopCompleteDto dto) {
    return service.markWorkshop(tenantId, dto);
  }

  @PostMapping("/admin/certificates/generate")
  public CompletionRowDto generateCertificate(
      @RequestParam String tenantId,
      @Valid @RequestBody CertificateGenerateDto dto) {
    return service.generateCertificate(tenantId, dto);
  }
}
