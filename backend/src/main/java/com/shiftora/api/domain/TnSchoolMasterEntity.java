package com.shiftora.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "tn_school_master")
public class TnSchoolMasterEntity {
  @Id
  @Column(name = "udise_code")
  private String udiseCode;

  @Column(name = "school_name", nullable = false)
  private String schoolName;

  @Column(name = "district_name", nullable = false)
  private String districtName;

  @Column(name = "block_name", nullable = false)
  private String blockName;

  @Column(name = "school_type", nullable = false)
  private String schoolType;

  @Column(name = "teaching_staff", nullable = false)
  private int teachingStaff;

  @Column(name = "state_code", nullable = false)
  private String stateCode;

  public String getUdiseCode() { return udiseCode; }
  public void setUdiseCode(String udiseCode) { this.udiseCode = udiseCode; }
  public String getSchoolName() { return schoolName; }
  public void setSchoolName(String schoolName) { this.schoolName = schoolName; }
  public String getDistrictName() { return districtName; }
  public void setDistrictName(String districtName) { this.districtName = districtName; }
  public String getBlockName() { return blockName; }
  public void setBlockName(String blockName) { this.blockName = blockName; }
  public String getSchoolType() { return schoolType; }
  public void setSchoolType(String schoolType) { this.schoolType = schoolType; }
  public int getTeachingStaff() { return teachingStaff; }
  public void setTeachingStaff(int teachingStaff) { this.teachingStaff = teachingStaff; }
  public String getStateCode() { return stateCode; }
  public void setStateCode(String stateCode) { this.stateCode = stateCode; }
}
