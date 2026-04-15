package com.jio.cwms.onboard.dto.request;

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
public class Contact {

    public String isPrimary;
    public String type;
    public String contact;
    public String uuid;
}
