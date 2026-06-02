package com.shiftora.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "knowledge_checks")
public class KnowledgeCheckEntity {
  @Id private String id;
  private String tenantId;
  private String title;
  private String description;
  private String status;
  private int passScore;
  private int sortOrder;
  private long createdAt;
  private long updatedAt;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(columnDefinition = "jsonb", nullable = false)
  private Map<String, Object> targeting = new LinkedHashMap<>();

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(columnDefinition = "jsonb", nullable = false)
  private List<Map<String, Object>> questions = new ArrayList<>();

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getTenantId() { return tenantId; }
  public void setTenantId(String tenantId) { this.tenantId = tenantId; }
  public String getTitle() { return title; }
  public void setTitle(String title) { this.title = title; }
  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  public int getPassScore() { return passScore; }
  public void setPassScore(int passScore) { this.passScore = passScore; }
  public int getSortOrder() { return sortOrder; }
  public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
  public long getCreatedAt() { return createdAt; }
  public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }
  public long getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(long updatedAt) { this.updatedAt = updatedAt; }
  public Map<String, Object> getTargeting() { return targeting; }
  public void setTargeting(Map<String, Object> targeting) { this.targeting = targeting; }
  public List<Map<String, Object>> getQuestions() { return questions; }
  public void setQuestions(List<Map<String, Object>> questions) { this.questions = questions; }
}
