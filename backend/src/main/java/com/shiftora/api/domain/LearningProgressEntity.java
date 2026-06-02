package com.shiftora.api.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "learning_progress")
public class LearningProgressEntity {
  @Id private String id;
  private String userId;
  private String tenantId;
  private String assignmentId;
  private String moduleId;
  private String unitId;
  private String status;
  private int progressPercent;
  private Integer score;
  private int timeSpentSeconds;
  private Long completedAt;
  private long updatedAt;

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getUserId() { return userId; }
  public void setUserId(String userId) { this.userId = userId; }
  public String getTenantId() { return tenantId; }
  public void setTenantId(String tenantId) { this.tenantId = tenantId; }
  public String getAssignmentId() { return assignmentId; }
  public void setAssignmentId(String assignmentId) { this.assignmentId = assignmentId; }
  public String getModuleId() { return moduleId; }
  public void setModuleId(String moduleId) { this.moduleId = moduleId; }
  public String getUnitId() { return unitId; }
  public void setUnitId(String unitId) { this.unitId = unitId; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  public int getProgressPercent() { return progressPercent; }
  public void setProgressPercent(int progressPercent) { this.progressPercent = progressPercent; }
  public Integer getScore() { return score; }
  public void setScore(Integer score) { this.score = score; }
  public int getTimeSpentSeconds() { return timeSpentSeconds; }
  public void setTimeSpentSeconds(int timeSpentSeconds) { this.timeSpentSeconds = timeSpentSeconds; }
  public Long getCompletedAt() { return completedAt; }
  public void setCompletedAt(Long completedAt) { this.completedAt = completedAt; }
  public long getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(long updatedAt) { this.updatedAt = updatedAt; }
}
