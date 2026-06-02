package com.shiftora.api.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "workshop_completions")
public class WorkshopCompletionEntity {
  @Id private String id;
  private String userId;
  private String tenantId;
  private String assignmentId;
  private String status;
  private String completedBy;
  private long completedAt;
  private String notes;

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getUserId() { return userId; }
  public void setUserId(String userId) { this.userId = userId; }
  public String getTenantId() { return tenantId; }
  public void setTenantId(String tenantId) { this.tenantId = tenantId; }
  public String getAssignmentId() { return assignmentId; }
  public void setAssignmentId(String assignmentId) { this.assignmentId = assignmentId; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  public String getCompletedBy() { return completedBy; }
  public void setCompletedBy(String completedBy) { this.completedBy = completedBy; }
  public long getCompletedAt() { return completedAt; }
  public void setCompletedAt(long completedAt) { this.completedAt = completedAt; }
  public String getNotes() { return notes; }
  public void setNotes(String notes) { this.notes = notes; }
}
