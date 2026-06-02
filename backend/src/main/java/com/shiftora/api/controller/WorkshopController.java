package com.shiftora.api.controller;

import com.shiftora.api.dto.WorkshopSessionDto;
import com.shiftora.api.service.WorkshopService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class WorkshopController {
  private final WorkshopService service;

  public WorkshopController(WorkshopService service) {
    this.service = service;
  }

  @GetMapping("/users/me/workshop")
  public WorkshopSessionDto workshop(@RequestParam String tenantId) {
    return service.workshop(tenantId);
  }
}
