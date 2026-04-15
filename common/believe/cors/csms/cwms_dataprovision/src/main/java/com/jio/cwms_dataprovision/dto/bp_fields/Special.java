package com.jio.cwms_dataprovision.dto.bp_fields;

import java.util.ArrayList;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class Special {

	public String bloodGroup;
    public String rns;
    public String hb;
    public String validUpto;
    public String remarks;
    public ArrayList<String> documents;
}
