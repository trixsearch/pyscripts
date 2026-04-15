package com.jio.cwms_dataprovision.dto.bp_fields;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApprovalInfo {

	public Integer Code;
	public String Site_ID;
	public String WorkerCode;
	public String App_Type;
	public String App_Status;
	public String App_Date;
    public String App_Validity;
    public String App_Remarks;
    public String Created_Date;
    public String Modify_Date;
}
