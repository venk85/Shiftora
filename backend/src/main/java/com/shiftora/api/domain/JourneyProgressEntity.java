package com.shiftora.api.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "journey_progress")
public class JourneyProgressEntity {
  @Id private String id;
  private String userId;
  private String tenantId;
  private String assignmentId;
  private String stepKey;
  private String status;
  private int progress;
  private Integer score;
  private long updatedAt;

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getUserId() { return userId; }
  public void setUserId(String userId) { this.userId = userId; }
  public String getTenantId() { return tenantId; }
  public void setTenantId(String tenantId) { this.tenantId = tenantId; }
  public String getAssignmentId() { return assignmentId; }
  public void setAssignmentId(String assignmentId) { this.assignmentId = assignmentId; }
  public String getStepKey() { return stepKey; }
  public void setStepKey(String stepKey) { this.stepKey = stepKey; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  public int getProgress() { return progress; }
  public void setProgress(int progress) { this.progress = progress; }
  public Integer getScore() { return score; }
  public void setScore(Integer score) { this.score = score; }
  public long getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(long updatedAt) { this.updatedAt = updatedAt; }
}
