package com.shiftora.api.dto;

import java.util.List;

public record WorkshopSessionDto(
    String id,
    String tenantId,
    String title,
    String status,
    long startsAt,
    int durationMinutes,
    String facilitator,
    String meetingUrl,
    int attendeeCount,
    List<String> agenda,
    List<String> prerequisites
) {}
