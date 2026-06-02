package com.shiftora.api.repository;

import com.shiftora.api.domain.EducationAssignmentReviewEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EducationAssignmentReviewRepository extends JpaRepository<EducationAssignmentReviewEntity, String> {
  List<EducationAssignmentReviewEntity> findByStatusOrderByCreatedAtDesc(String status);
}
