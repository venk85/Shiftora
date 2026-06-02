package com.shiftora.api.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "registered_schools")
public class RegisteredSchoolEntity {
  @Id
  private String udiseCode;
  private String tenantId;
  private String schoolName;
  private String stateCode;
  private String udiseDistrictCode;
  private String udiseBlockCode;
  private String assignmentStatus;
  private String reviewReason;
  private long createdAt;
  private long updatedAt;

  public String getUdiseCode() { return udiseCode; }
  public void setUdiseCode(String udiseCode) { this.udiseCode = udiseCode; }
  public String getTenantId() { return tenantId; }
  public void setTenantId(String tenantId) { this.tenantId = tenantId; }
  public String getSchoolName() { return schoolName; }
  public void setSchoolName(String schoolName) { this.schoolName = schoolName; }
  public String getStateCode() { return stateCode; }
  public void setStateCode(String stateCode) { this.stateCode = stateCode; }
  public String getUdiseDistrictCode() { return udiseDistrictCode; }
  public void setUdiseDistrictCode(String udiseDistrictCode) { this.udiseDistrictCode = udiseDistrictCode; }
  public String getUdiseBlockCode() { return udiseBlockCode; }
  public void setUdiseBlockCode(String udiseBlockCode) { this.udiseBlockCode = udiseBlockCode; }
  public String getAssignmentStatus() { return assignmentStatus; }
  public void setAssignmentStatus(String assignmentStatus) { this.assignmentStatus = assignmentStatus; }
  public String getReviewReason() { return reviewReason; }
  public void setReviewReason(String reviewReason) { this.reviewReason = reviewReason; }
  public long getCreatedAt() { return createdAt; }
  public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }
  public long getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(long updatedAt) { this.updatedAt = updatedAt; }
}
