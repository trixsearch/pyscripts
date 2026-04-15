package com.jio.cwms_dataprovision.dto.prm.characteristicsdto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@JsonIgnoreProperties(ignoreUnknown = true)
public class Agent {

	private CharacteristicsResponseDto characteristics;
} 
