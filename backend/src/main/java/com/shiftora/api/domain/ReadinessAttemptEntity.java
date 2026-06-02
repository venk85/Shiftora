package com.shiftora.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "readiness_attempts")
public class ReadinessAttemptEntity {
  @Id private String id;
  private String userId;
  private String tenantId;
  private String templateId;
  private String assignmentId;
  private int score;
  private String level;
  private long createdAt;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(columnDefinition = "jsonb", nullable = false)
  private Map<String, Object> answers = new LinkedHashMap<>();

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(columnDefinition = "jsonb", nullable = false)
  private List<String> recommendedModules = List.of();

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getUserId() { return userId; }
  public void setUserId(String userId) { this.userId = userId; }
  public String getTenantId() { return tenantId; }
  public void setTenantId(String tenantId) { this.tenantId = tenantId; }
  public String getTemplateId() { return templateId; }
  public void setTemplateId(String templateId) { this.templateId = templateId; }
  public String getAssignmentId() { return assignmentId; }
  public void setAssignmentId(String assignmentId) { this.assignmentId = assignmentId; }
  public int getScore() { return score; }
  public void setScore(int score) { this.score = score; }
  public String getLevel() { return level; }
  public void setLevel(String level) { this.level = level; }
  public long getCreatedAt() { return createdAt; }
  public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }
  public Map<String, Object> getAnswers() { return answers; }
  public void setAnswers(Map<String, Object> answers) { this.answers = answers; }
  public List<String> getRecommendedModules() { return recommendedModules; }
  public void setRecommendedModules(List<String> recommendedModules) { this.recommendedModules = recommendedModules; }
}
