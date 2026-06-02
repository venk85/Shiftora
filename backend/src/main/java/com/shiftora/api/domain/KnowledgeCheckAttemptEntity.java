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
@Table(name = "knowledge_check_attempts")
public class KnowledgeCheckAttemptEntity {
  @Id private String id;
  private String userId;
  private String tenantId;
  private String assignmentId;
  private String knowledgeCheckId;
  private int score;
  private boolean passed;
  private long createdAt;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(columnDefinition = "jsonb", nullable = false)
  private Map<String, Object> answers = new LinkedHashMap<>();

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getUserId() { return userId; }
  public void setUserId(String userId) { this.userId = userId; }
  public String getTenantId() { return tenantId; }
  public void setTenantId(String tenantId) { this.tenantId = tenantId; }
  public String getAssignmentId() { return assignmentId; }
  public void setAssignmentId(String assignmentId) { this.assignmentId = assignmentId; }
  public String getKnowledgeCheckId() { return knowledgeCheckId; }
  public void setKnowledgeCheckId(String knowledgeCheckId) { this.knowledgeCheckId = knowledgeCheckId; }
  public Map<String, Object> getAnswers() { return answers; }
  public void setAnswers(Map<String, Object> answers) { this.answers = answers; }
  public int getScore() { return score; }
  public void setScore(int score) { this.score = score; }
  public boolean isPassed() { return passed; }
  public void setPassed(boolean passed) { this.passed = passed; }
  public long getCreatedAt() { return createdAt; }
  public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }
}
