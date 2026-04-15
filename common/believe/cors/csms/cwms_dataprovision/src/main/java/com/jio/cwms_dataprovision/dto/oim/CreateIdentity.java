package com.jio.cwms_dataprovision.dto.oim;

import java.util.ArrayList;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateIdentity {

	private List<Identity> identity = new ArrayList<>();
}
