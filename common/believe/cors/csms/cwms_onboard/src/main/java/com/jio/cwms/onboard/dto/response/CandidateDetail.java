package com.jio.cwms.onboard.dto.response;

import java.util.ArrayList;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;

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
public class CandidateDetail{
    public String candidateId;
    public String name;
    public String role;
    public String agency;
    public String plannedDOJ;
    public String status;
    public String location;
    public String designation;
    public String actualDOJ;
}