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
@Table(name = "learning_modules")
public class LearningModuleEntity {
  @Id private String id;
  private String tenantId;
  private String title;
  private String description;
  private String level;
  private String language;
  private int estimatedMinutes;
  private String status;
  private int sortOrder;
  private boolean mandatory;
  private boolean isPlatform;
  private long createdAt;
  private long updatedAt;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(columnDefinition = "jsonb", nullable = false)
  private Map<String, Object> targeting = new LinkedHashMap<>();

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getTenantId() { return tenantId; }
  public void setTenantId(String tenantId) { this.tenantId = tenantId; }
  public String getTitle() { return title; }
  public void setTitle(String title) { this.title = title; }
  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }
  public String getLevel() { return level; }
  public void setLevel(String level) { this.level = level; }
  public String getLanguage() { return language; }
  public void setLanguage(String language) { this.language = language; }
  public int getEstimatedMinutes() { return estimatedMinutes; }
  public void setEstimatedMinutes(int estimatedMinutes) { this.estimatedMinutes = estimatedMinutes; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  public int getSortOrder() { return sortOrder; }
  public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
  public long getCreatedAt() { return createdAt; }
  public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }
  public long getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(long updatedAt) { this.updatedAt = updatedAt; }
  public Map<String, Object> getTargeting() { return targeting; }
  public void setTargeting(Map<String, Object> targeting) { this.targeting = targeting; }
  public boolean isMandatory() { return mandatory; }
  public void setMandatory(boolean mandatory) { this.mandatory = mandatory; }
  public boolean isIsPlatform() { return isPlatform; }
  public void setIsPlatform(boolean isPlatform) { this.isPlatform = isPlatform; }
}
