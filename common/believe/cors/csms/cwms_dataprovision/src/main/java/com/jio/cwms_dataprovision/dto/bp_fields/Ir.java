package com.jio.cwms_dataprovision.dto.bp_fields;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class Ir {

	public String approvedBy;
    public String approvedDate;
    public String profileImage;
    public String fullName;
    public String vendorName;
    public String gender;
    public String phone;
    public String status;
    public String remarks;
}
