package com.shiftora.api.controller;

import com.shiftora.api.dto.PracticeEntryDto;
import com.shiftora.api.service.PracticeService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class PracticeController {
  private final PracticeService service;

  public PracticeController(PracticeService service) {
    this.service = service;
  }

  @GetMapping("/tenants/{tenantId}/practice")
  public List<PracticeEntryDto> findForTenant(@PathVariable String tenantId) {
    return service.findForTenant(tenantId);
  }

  @PostMapping("/practice")
  @ResponseStatus(HttpStatus.CREATED)
  public PracticeEntryDto create(@Valid @RequestBody PracticeEntryDto dto) {
    return service.create(dto);
  }
}
