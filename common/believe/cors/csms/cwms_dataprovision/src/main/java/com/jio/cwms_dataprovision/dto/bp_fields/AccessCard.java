package com.jio.cwms_dataprovision.dto.bp_fields;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class AccessCard {

	public String idCardNo;
    public String validUpto;
    public String validUpto_dep;
    public String issueLevel;
    public String cardFormat;
    public ExpiryDates expiryDates;
    public String downloadIdCard;
}
