package com.shiftora.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.LinkedHashMap;
import java.util.Map;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "app_users")
public class AppUserEntity {
  @Id private String id;
  private String tenantId;
  private String email;
  private String name;
  private String role;
  private String avatar;
  private long createdAt;
  private String passwordHash;
  private int authVersion;
  private int failedLoginCount;
  private Long lockedUntil;
  private Long lastLoginAt;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(columnDefinition = "jsonb", nullable = false)
  private Map<String, Object> profile = new LinkedHashMap<>();

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getTenantId() { return tenantId; }
  public void setTenantId(String tenantId) { this.tenantId = tenantId; }
  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }
  public String getName() { return name; }
  public void setName(String name) { this.name = name; }
  public String getRole() { return role; }
  public void setRole(String role) { this.role = role; }
  public String getAvatar() { return avatar; }
  public void setAvatar(String avatar) { this.avatar = avatar; }
  public long getCreatedAt() { return createdAt; }
  public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }
  public String getPasswordHash() { return passwordHash; }
  public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
  public int getAuthVersion() { return authVersion; }
  public void setAuthVersion(int authVersion) { this.authVersion = authVersion; }
  public int getFailedLoginCount() { return failedLoginCount; }
  public void setFailedLoginCount(int failedLoginCount) { this.failedLoginCount = failedLoginCount; }
  public Long getLockedUntil() { return lockedUntil; }
  public void setLockedUntil(Long lockedUntil) { this.lockedUntil = lockedUntil; }
  public Long getLastLoginAt() { return lastLoginAt; }
  public void setLastLoginAt(Long lastLoginAt) { this.lastLoginAt = lastLoginAt; }
  public Map<String, Object> getProfile() { return profile; }
  public void setProfile(Map<String, Object> profile) { this.profile = profile; }
}
