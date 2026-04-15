package com.jio.cwms.onboard.dto.response;

import java.util.List;

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
public class CreateClaimFailedResponse {

    public String clientTxnId;
    public String success;
    public int status;
    public String errors;
}
