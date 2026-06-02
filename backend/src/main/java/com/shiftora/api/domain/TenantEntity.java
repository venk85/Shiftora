package com.shiftora.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.util.LinkedHashMap;
import java.util.Map;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "tenants")
public class TenantEntity {
  @Id
  private String id;

  @NotBlank
  private String name;

  @NotBlank
  private String abbr;

  @NotBlank
  private String type;

  @PositiveOrZero
  private int size;

  @NotNull
  @Enumerated(EnumType.STRING)
  private IndustryKey industry;

  @Min(0)
  @Max(100)
  private int maturity;

  @Min(0)
  @Max(100)
  private int adoption;

  private long createdAt;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(columnDefinition = "jsonb", nullable = false)
  private Map<String, Object> config = new LinkedHashMap<>();

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getAbbr() {
    return abbr;
  }

  public void setAbbr(String abbr) {
    this.abbr = abbr;
  }

  public String getType() {
    return type;
  }

  public void setType(String type) {
    this.type = type;
  }

  public int getSize() {
    return size;
  }

  public void setSize(int size) {
    this.size = size;
  }

  public IndustryKey getIndustry() {
    return industry;
  }

  public void setIndustry(IndustryKey industry) {
    this.industry = industry;
  }

  public int getMaturity() {
    return maturity;
  }

  public void setMaturity(int maturity) {
    this.maturity = maturity;
  }

  public int getAdoption() {
    return adoption;
  }

  public void setAdoption(int adoption) {
    this.adoption = adoption;
  }

  public long getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(long createdAt) {
    this.createdAt = createdAt;
  }

  public Map<String, Object> getConfig() {
    return config;
  }

  public void setConfig(Map<String, Object> config) {
    this.config = config;
  }
}
