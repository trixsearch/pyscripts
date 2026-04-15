package com.jio.cwms_dataprovision.dto.bp_fields;

import java.util.ArrayList;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class Vaccination {

	public String status;
    public String dose;
    public String dose1;
    public String dose2;
    public String precautionary;
    public String benefeciaryId;
    public String remarks;
    public ArrayList<String> documents;
    public boolean isVerified;
}
