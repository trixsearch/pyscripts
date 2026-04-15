package com.jio.cwms_dataprovision.dto.bp_fields;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class Medical {

	public String status;
    public String validUpto;
    public String approvedBy;
    public String approvedDate;
    public String profileImage;
    public String fullName;
    public String vendorName;
    public General general;
    public Systematic systematic;
    public Locomotor locomotor;
    public GenitoUrinary genitoUrinary;
    public Special special;
    public Vaccination vaccination;
    public String remarks;
}
