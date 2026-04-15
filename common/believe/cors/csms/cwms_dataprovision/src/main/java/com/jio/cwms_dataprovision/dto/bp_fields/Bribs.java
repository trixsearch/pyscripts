package com.jio.cwms_dataprovision.dto.bp_fields;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class Bribs {

	public String status;
    public String systemCheck;
    public String systemStatus;
}
