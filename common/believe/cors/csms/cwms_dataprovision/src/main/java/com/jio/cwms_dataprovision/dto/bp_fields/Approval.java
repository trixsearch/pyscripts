package com.jio.cwms_dataprovision.dto.bp_fields;

import java.util.ArrayList;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class Approval {

	public ArrayList<Medical> medical;
    public ArrayList<Eic> eic;
    public ArrayList<SafetyTraining> safetyTraining;
    public ArrayList<Ir> ir;
    public ArrayList<Vigilance> vigilance;
    public ArrayList<AccessCard> accessCard;
    public ArrayList<Bribs> bribs;
}
