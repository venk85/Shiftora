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
@Table(name = "user_assignments")
public class UserAssignmentEntity {
  @Id private String id;
  private String userId;
  private String tenantId;
  private String schoolName;
  private String grade;
  private String division;
  private String subject;
  private String responsibility;
  private boolean primaryAssignment;
  private boolean active;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(columnDefinition = "jsonb", nullable = false)
  private Map<String, Object> metadata = new LinkedHashMap<>();

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getUserId() { return userId; }
  public void setUserId(String userId) { this.userId = userId; }
  public String getTenantId() { return tenantId; }
  public void setTenantId(String tenantId) { this.tenantId = tenantId; }
  public String getSchoolName() { return schoolName; }
  public void setSchoolName(String schoolName) { this.schoolName = schoolName; }
  public String getGrade() { return grade; }
  public void setGrade(String grade) { this.grade = grade; }
  public String getDivision() { return division; }
  public void setDivision(String division) { this.division = division; }
  public String getSubject() { return subject; }
  public void setSubject(String subject) { this.subject = subject; }
  public String getResponsibility() { return responsibility; }
  public void setResponsibility(String responsibility) { this.responsibility = responsibility; }
  public boolean isPrimaryAssignment() { return primaryAssignment; }
  public void setPrimaryAssignment(boolean primaryAssignment) { this.primaryAssignment = primaryAssignment; }
  public boolean isActive() { return active; }
  public void setActive(boolean active) { this.active = active; }
  public Map<String, Object> getMetadata() { return metadata; }
  public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
}
