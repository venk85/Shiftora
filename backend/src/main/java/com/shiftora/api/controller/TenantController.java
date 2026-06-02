package com.shiftora.api.controller;

import com.shiftora.api.domain.IndustryKey;
import com.shiftora.api.dto.AuthDtos.AuthUserDto;
import com.shiftora.api.dto.TenantDto;
import com.shiftora.api.service.UnauthorizedException;
import com.shiftora.api.service.TenantService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tenants")
public class TenantController {
  private final TenantService service;

  public TenantController(TenantService service) {
    this.service = service;
  }

  @GetMapping
  public List<TenantDto> findAll(@RequestParam(required = false) String industry, HttpServletRequest request) {
    AuthUserDto user = auth(request);
    if (!user.isSuper()) return List.of(service.get(user.tenantId()));
    return service.findAll(IndustryKey.fromRequestValue(industry));
  }

  @GetMapping("/{id}")
  public TenantDto get(@PathVariable String id, HttpServletRequest request) {
    requireTenantAccess(auth(request), id);
    return service.get(id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public TenantDto create(@Valid @RequestBody TenantDto dto, HttpServletRequest request) {
    requirePlatform(auth(request));
    return service.create(dto);
  }

  @PutMapping("/{id}")
  public TenantDto update(@PathVariable String id, @Valid @RequestBody TenantDto dto, HttpServletRequest request) {
    AuthUserDto user = auth(request);
    if (!user.isSuper() && !(id.equals(user.tenantId()) && "admin".equals(user.role()))) {
      throw new UnauthorizedException("You do not have access to update this organization.");
    }
    return service.update(id, dto);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable String id, HttpServletRequest request) {
    requirePlatform(auth(request));
    service.delete(id);
  }

  private AuthUserDto auth(HttpServletRequest request) {
    Object user = request.getAttribute("authUser");
    if (user instanceof AuthUserDto dto) return dto;
    throw new UnauthorizedException("Authentication required");
  }

  private void requirePlatform(AuthUserDto user) {
    if (!user.isSuper()) throw new UnauthorizedException("Platform access required");
  }

  private void requireTenantAccess(AuthUserDto user, String tenantId) {
    if (!user.isSuper() && !tenantId.equals(user.tenantId())) {
      throw new UnauthorizedException("You do not have access to this organization.");
    }
  }
}
