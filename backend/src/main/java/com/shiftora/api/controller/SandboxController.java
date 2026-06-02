package com.shiftora.api.controller;

import com.shiftora.api.dto.SandboxRequestDto;
import com.shiftora.api.dto.SandboxResponseDto;
import com.shiftora.api.service.SandboxService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sandbox")
public class SandboxController {
  private final SandboxService service;

  public SandboxController(SandboxService service) {
    this.service = service;
  }

  @PostMapping("/run")
  public SandboxResponseDto run(@Valid @RequestBody SandboxRequestDto request) {
    return service.run(request);
  }
}
