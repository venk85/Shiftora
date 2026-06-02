package com.shiftora.api.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "education_blocks")
public class EducationBlockEntity {
  @Id private String udiseBlockCode;
  private String udiseDistrictCode;
  private String stateCode;
  private String blockName;
  private String beoOfficeName;
  private String beoContact;

  public String getUdiseBlockCode() { return udiseBlockCode; }
  public void setUdiseBlockCode(String udiseBlockCode) { this.udiseBlockCode = udiseBlockCode; }
  public String getUdiseDistrictCode() { return udiseDistrictCode; }
  public void setUdiseDistrictCode(String udiseDistrictCode) { this.udiseDistrictCode = udiseDistrictCode; }
  public String getStateCode() { return stateCode; }
  public void setStateCode(String stateCode) { this.stateCode = stateCode; }
  public String getBlockName() { return blockName; }
  public void setBlockName(String blockName) { this.blockName = blockName; }
  public String getBeoOfficeName() { return beoOfficeName; }
  public void setBeoOfficeName(String beoOfficeName) { this.beoOfficeName = beoOfficeName; }
  public String getBeoContact() { return beoContact; }
  public void setBeoContact(String beoContact) { this.beoContact = beoContact; }
}
