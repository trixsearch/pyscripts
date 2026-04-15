package com.jio.cwms_dataprovision.dto.bp_fields;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class General {

	public String noseOralCavity;
    public String eyes;
    public String pulse;
    @JsonProperty("Ears") 
    public String ears;
    @JsonProperty("Weight") 
    public String weight;
    public String height;
    public String bloodPressure;
}
