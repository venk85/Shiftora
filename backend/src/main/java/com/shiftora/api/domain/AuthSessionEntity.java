package com.shiftora.api.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "auth_sessions")
public class AuthSessionEntity {
  @Id private String id;
  private String principalType;
  private String principalId;
  private String tenantId;
  private String tokenHash;
  private String role;
  private long expiresAt;
  private Long revokedAt;
  private long createdAt;
  private long lastSeenAt;

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getPrincipalType() { return principalType; }
  public void setPrincipalType(String principalType) { this.principalType = principalType; }
  public String getPrincipalId() { return principalId; }
  public void setPrincipalId(String principalId) { this.principalId = principalId; }
  public String getTenantId() { return tenantId; }
  public void setTenantId(String tenantId) { this.tenantId = tenantId; }
  public String getTokenHash() { return tokenHash; }
  public void setTokenHash(String tokenHash) { this.tokenHash = tokenHash; }
  public String getRole() { return role; }
  public void setRole(String role) { this.role = role; }
  public long getExpiresAt() { return expiresAt; }
  public void setExpiresAt(long expiresAt) { this.expiresAt = expiresAt; }
  public Long getRevokedAt() { return revokedAt; }
  public void setRevokedAt(Long revokedAt) { this.revokedAt = revokedAt; }
  public long getCreatedAt() { return createdAt; }
  public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }
  public long getLastSeenAt() { return lastSeenAt; }
  public void setLastSeenAt(long lastSeenAt) { this.lastSeenAt = lastSeenAt; }
}
