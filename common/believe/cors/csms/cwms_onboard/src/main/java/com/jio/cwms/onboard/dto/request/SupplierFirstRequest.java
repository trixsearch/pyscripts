package com.jio.cwms.onboard.dto.request;

import java.util.ArrayList;
import java.util.List;



import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierFirstRequest {
	
	private ArrayList<String> segmentCodes ;
	
	private ArrayList<String> siteCodes ;
	
	private ArrayList<String> workerCodes ;
	
}
