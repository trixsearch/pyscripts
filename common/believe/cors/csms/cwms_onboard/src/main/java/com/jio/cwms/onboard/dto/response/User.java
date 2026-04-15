package com.jio.cwms.onboard.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@JsonIgnoreProperties(ignoreUnknown = true)
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class User {
	    public String firstName;
	    public String lastName;
	    public String mobileNumber;
	    public String email;
	    public String employeeId;
	    public String state;
	    public String contractorName;
}
