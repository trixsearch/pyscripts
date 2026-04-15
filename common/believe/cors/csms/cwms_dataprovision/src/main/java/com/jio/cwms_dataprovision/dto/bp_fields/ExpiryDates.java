package com.jio.cwms_dataprovision.dto.bp_fields;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class ExpiryDates {

	public String safety;
    public String medical;
    public String workOrder;
    public String labourLicense;
    public String wcPolicy;
}
