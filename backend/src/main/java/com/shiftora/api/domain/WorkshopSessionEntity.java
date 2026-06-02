package com.shiftora.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "workshop_sessions")
public class WorkshopSessionEntity {
  @Id private String id;
  private String tenantId;
  private String title;
  private String status;
  private long startsAt;
  private int durationMinutes;
  private String facilitator;
  private String meetingUrl;
  private int attendeeCount;
  private long createdAt;
  private long updatedAt;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(columnDefinition = "jsonb", nullable = false)
  private List<String> agenda = new ArrayList<>();

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(columnDefinition = "jsonb", nullable = false)
  private List<String> prerequisites = new ArrayList<>();

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getTenantId() { return tenantId; }
  public void setTenantId(String tenantId) { this.tenantId = tenantId; }
  public String getTitle() { return title; }
  public void setTitle(String title) { this.title = title; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  public long getStartsAt() { return startsAt; }
  public void setStartsAt(long startsAt) { this.startsAt = startsAt; }
  public int getDurationMinutes() { return durationMinutes; }
  public void setDurationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; }
  public String getFacilitator() { return facilitator; }
  public void setFacilitator(String facilitator) { this.facilitator = facilitator; }
  public String getMeetingUrl() { return meetingUrl; }
  public void setMeetingUrl(String meetingUrl) { this.meetingUrl = meetingUrl; }
  public int getAttendeeCount() { return attendeeCount; }
  public void setAttendeeCount(int attendeeCount) { this.attendeeCount = attendeeCount; }
  public long getCreatedAt() { return createdAt; }
  public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }
  public long getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(long updatedAt) { this.updatedAt = updatedAt; }
  public List<String> getAgenda() { return agenda; }
  public void setAgenda(List<String> agenda) { this.agenda = agenda; }
  public List<String> getPrerequisites() { return prerequisites; }
  public void setPrerequisites(List<String> prerequisites) { this.prerequisites = prerequisites; }
}
