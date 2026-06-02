package com.shiftora.api.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "platform_users")
public class PlatformUserEntity {
  @Id private String id;
  private String email;
  private String name;
  private String avatar;
  private String passwordHash;
  private int authVersion;
  private int failedLoginCount;
  private Long lockedUntil;
  private Long lastLoginAt;
  private boolean active = true;
  private long createdAt;

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }
  public String getName() { return name; }
  public void setName(String name) { this.name = name; }
  public String getAvatar() { return avatar; }
  public void setAvatar(String avatar) { this.avatar = avatar; }
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
  public boolean isActive() { return active; }
  public void setActive(boolean active) { this.active = active; }
  public long getCreatedAt() { return createdAt; }
  public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }
}
