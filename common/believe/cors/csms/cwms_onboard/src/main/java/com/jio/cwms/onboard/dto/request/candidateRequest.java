package com.jio.cwms.onboard.dto.request;

import java.util.ArrayList;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Data
@Builder
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class candidateRequest {

	 public boolean isConsentAccepted;
	    public ArrayList<Contact> contacts;
	    public String firstName;
	    public String dob;
	    public String employeeId;
	    public String gender;
	    public String _id;
	    public String orgId;
	    public String userId;
	    public String requestFrom;
	    public String uuid;
	    public String createdOn;
	    public String modifiedOn;
	    public String createdBy;
	    public String modifiedBy;
	    public String isActive;
	    public String lockStatus;
	    public String nameInLowerCase;
	    public String personId;
	    public String orgName;
}
