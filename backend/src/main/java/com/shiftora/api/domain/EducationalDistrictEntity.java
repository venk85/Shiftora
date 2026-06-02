package com.shiftora.api.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "educational_districts")
public class EducationalDistrictEntity {
  @Id private String udiseDistrictCode;
  private String stateCode;
  private String districtName;
  private String deoOfficeName;
  private String deoContact;

  public String getUdiseDistrictCode() { return udiseDistrictCode; }
  public void setUdiseDistrictCode(String udiseDistrictCode) { this.udiseDistrictCode = udiseDistrictCode; }
  public String getStateCode() { return stateCode; }
  public void setStateCode(String stateCode) { this.stateCode = stateCode; }
  public String getDistrictName() { return districtName; }
  public void setDistrictName(String districtName) { this.districtName = districtName; }
  public String getDeoOfficeName() { return deoOfficeName; }
  public void setDeoOfficeName(String deoOfficeName) { this.deoOfficeName = deoOfficeName; }
  public String getDeoContact() { return deoContact; }
  public void setDeoContact(String deoContact) { this.deoContact = deoContact; }
}
