package com.shiftora.api.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "certificates")
public class CertificateEntity {
  @Id private String id;
  private String userId;
  private String tenantId;
  private String assignmentId;
  private String certificateNumber;
  private String status;
  private String emailedTo;
  private String generatedBy;
  private long generatedAt;
  private Long emailedAt;

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getUserId() { return userId; }
  public void setUserId(String userId) { this.userId = userId; }
  public String getTenantId() { return tenantId; }
  public void setTenantId(String tenantId) { this.tenantId = tenantId; }
  public String getAssignmentId() { return assignmentId; }
  public void setAssignmentId(String assignmentId) { this.assignmentId = assignmentId; }
  public String getCertificateNumber() { return certificateNumber; }
  public void setCertificateNumber(String certificateNumber) { this.certificateNumber = certificateNumber; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  public String getEmailedTo() { return emailedTo; }
  public void setEmailedTo(String emailedTo) { this.emailedTo = emailedTo; }
  public String getGeneratedBy() { return generatedBy; }
  public void setGeneratedBy(String generatedBy) { this.generatedBy = generatedBy; }
  public long getGeneratedAt() { return generatedAt; }
  public void setGeneratedAt(long generatedAt) { this.generatedAt = generatedAt; }
  public Long getEmailedAt() { return emailedAt; }
  public void setEmailedAt(Long emailedAt) { this.emailedAt = emailedAt; }
}
