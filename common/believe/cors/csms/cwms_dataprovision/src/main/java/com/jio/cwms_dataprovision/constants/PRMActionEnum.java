package com.jio.cwms_dataprovision.constants;

import lombok.Getter;

@Getter
public enum PRMActionEnum {

	ADD("ADD"),MOD("MODIFY"),TER("TERMINATE"),MOVE("MOVE");
	
	
	private final String value;

	PRMActionEnum(String value) {
		this.value = value;
	}
}
