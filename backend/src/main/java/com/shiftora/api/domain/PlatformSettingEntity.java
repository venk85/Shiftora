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
@Table(name = "platform_settings")
public class PlatformSettingEntity {
  @Id
  @Column(name = "setting_key")
  private String key;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "setting_value", columnDefinition = "jsonb", nullable = false)
  private Map<String, Object> value = new LinkedHashMap<>();

  private long updatedAt;

  public String getKey() {
    return key;
  }

  public void setKey(String key) {
    this.key = key;
  }

  public Map<String, Object> getValue() {
    return value;
  }

  public void setValue(Map<String, Object> value) {
    this.value = value;
  }

  public long getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(long updatedAt) {
    this.updatedAt = updatedAt;
  }
}
