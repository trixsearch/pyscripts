package com.jio.cwms.onboard.dto.request;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Component
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(Include.NON_NULL)
public class CandidateDetails {
	    public String firstName;
		public String lastName;
		public String dob;
		public String mobileNo;
		public String emailId;
		public String idProofNo;
	    public String middleName;
	    public String localAddress;
	    public String localPincode;
	    public String permanentAddress;
	    public String permanentPincode;
		public String gender;
		public String ctc;
	    public String candidateId;
		public String sapCode;
		public String jioCentreCode;
		public String designation;
		public String hiringManagerECNo;
		public String onboarderEmail;
	    public String onboarderECNo;
	    public String onboarderName;
		public String bankName;
		public String accountNo;
		public String ifscCode;
	    public String pan;
		public String expectedDoJ;
		public String expectedJoiningDate;
        public String qualification;
        public String fatherName;
        public String profilePicUrl;
        public String joiningDate;
        public String positionCodeId;
        public String nameAsPerIdProof;
        
		
	}


