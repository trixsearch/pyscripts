package com.jio.cwms_dataprovision.constants;

import lombok.Getter;

@Getter
public enum OIMActionEnum {

	ADD("createIdentity"), MOD("updateIdentity"), TER("disableIdentity"), RENEW("enableIdentity"), VENADD("createIdentity") , VENMOD("updateIdentity") , VENTER("disableIdentity"), HIB("disableIdentity"),DEHIB("enableIdentity");

	private final String value;

	OIMActionEnum(String value) {
		this.value = value;
	}

}
