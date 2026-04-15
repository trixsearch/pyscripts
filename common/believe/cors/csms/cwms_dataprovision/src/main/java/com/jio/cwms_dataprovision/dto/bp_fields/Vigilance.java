package com.jio.cwms_dataprovision.dto.bp_fields;

import java.util.ArrayList;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class Vigilance {

	public String approvedBy;
    public String approvedDate;
    public String profileImage;
    public String fullName;
    public String vendorName;
    public ArrayList<String> documents;
    public String remarks;
    public String status;
}
