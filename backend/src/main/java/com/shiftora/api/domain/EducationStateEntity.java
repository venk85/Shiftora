package com.shiftora.api.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "education_states")
public class EducationStateEntity {
  @Id private String stateCode;
  private String stateName;
  private String blockOfficerTitle;
  private String districtOfficerTitle;
  private String blockUnitName;
  private int udiseBlockDigits;

  public String getStateCode() { return stateCode; }
  public void setStateCode(String stateCode) { this.stateCode = stateCode; }
  public String getStateName() { return stateName; }
  public void setStateName(String stateName) { this.stateName = stateName; }
  public String getBlockOfficerTitle() { return blockOfficerTitle; }
  public void setBlockOfficerTitle(String blockOfficerTitle) { this.blockOfficerTitle = blockOfficerTitle; }
  public String getDistrictOfficerTitle() { return districtOfficerTitle; }
  public void setDistrictOfficerTitle(String districtOfficerTitle) { this.districtOfficerTitle = districtOfficerTitle; }
  public String getBlockUnitName() { return blockUnitName; }
  public void setBlockUnitName(String blockUnitName) { this.blockUnitName = blockUnitName; }
  public int getUdiseBlockDigits() { return udiseBlockDigits; }
  public void setUdiseBlockDigits(int udiseBlockDigits) { this.udiseBlockDigits = udiseBlockDigits; }
}
