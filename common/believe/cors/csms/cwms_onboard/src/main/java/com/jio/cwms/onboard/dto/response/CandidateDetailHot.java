package com.jio.cwms.onboard.dto.response;

import java.util.ArrayList;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.mysql.cj.x.protobuf.MysqlxDatatypes.Array;

import jakarta.validation.constraints.AssertFalse.List;
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
@JsonInclude(Include.NON_NULL)
public class CandidateDetailHot{
    public String id;
    @JsonProperty("Name")
    public String name;
    @JsonProperty("Role")
    public String role;
    @JsonProperty("Agency")
    public String agency;
    @JsonProperty("PlannedDOJ")
    public String plannedDOJ;
    @JsonProperty("Status")
    public String status;
    @JsonProperty("ReportingLocation")
    public String location;
    @JsonProperty("Designation")
    public String designation;
    @JsonProperty("ActualDOJ")
    public String actualDOJ;
    
    
    public static ArrayList<CandidateDetailHot> fromRequest(ArrayList<CandidateDetail> request){
		
    	ArrayList<CandidateDetailHot> list = new ArrayList<CandidateDetailHot>();
    	request.forEach(i -> {
    		CandidateDetailHot details = new CandidateDetailHot();
    		details.setId(i.getCandidateId());
    		details.setName(i.getName());
    		details.setRole(i.getRole());
    		details.setAgency(i.getAgency());
    		details.setPlannedDOJ(i.getPlannedDOJ());
    		details.setStatus(i.getStatus());
    		details.setLocation(i.getLocation() == null ? "" : i.getLocation());
    		details.setDesignation(i.getDesignation());
    		details.setActualDOJ(i.getActualDOJ());
    		list.add(details);
    	});
    	
    	return list;
    	
    }
}