package com.shiftora.api.controller;

import com.shiftora.api.dto.PlatformSettingsDto;
import com.shiftora.api.service.PlatformSettingsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/platform/settings")
public class PlatformSettingsController {
  private final PlatformSettingsService service;

  public PlatformSettingsController(PlatformSettingsService service) {
    this.service = service;
  }

  @GetMapping
  public PlatformSettingsDto get() {
    return service.get();
  }

  @PutMapping
  public PlatformSettingsDto update(@RequestBody PlatformSettingsDto dto) {
    return service.update(dto);
  }
}
