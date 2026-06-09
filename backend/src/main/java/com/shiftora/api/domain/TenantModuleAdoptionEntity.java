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
@Table(name = "tenant_module_adoptions")
public class TenantModuleAdoptionEntity {
  @Id private String id;
  private String tenantId;
  private String moduleId;
  private boolean mandatory;
  private int sortOrder;
  private long adoptedAt;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(columnDefinition = "jsonb", nullable = false)
  private Map<String, Object> targeting = new LinkedHashMap<>();

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getTenantId() { return tenantId; }
  public void setTenantId(String tenantId) { this.tenantId = tenantId; }
  public String getModuleId() { return moduleId; }
  public void setModuleId(String moduleId) { this.moduleId = moduleId; }
  public boolean isMandatory() { return mandatory; }
  public void setMandatory(boolean mandatory) { this.mandatory = mandatory; }
  public int getSortOrder() { return sortOrder; }
  public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
  public long getAdoptedAt() { return adoptedAt; }
  public void setAdoptedAt(long adoptedAt) { this.adoptedAt = adoptedAt; }
  public Map<String, Object> getTargeting() { return targeting; }
  public void setTargeting(Map<String, Object> targeting) { this.targeting = targeting; }
}
