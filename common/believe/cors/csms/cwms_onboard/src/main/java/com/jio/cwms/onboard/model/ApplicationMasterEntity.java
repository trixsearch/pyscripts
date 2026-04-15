package com.jio.cwms.onboard.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity(name = "downstream_application_master")
public class ApplicationMasterEntity {
	
	@Id
	@Column(name = "dam_id")
	private Integer damId;
	
	@Column(name = "dam_target_system")
	private String damTargetSystem;
	
	@Column(name = "dam_calling_mechenism")
	private String damCallingMechenism;
	
	@Column(name = "dam_protocol")
	private String damProtocol;
	
	@Column(name = "dam_server_ip_url")
	private String damserverIpUrl;
	
	@Column(name = "dam_port")
	private String damPort;
	
	@Column(name = "dam_endpoint")
	private String damEndpoint;
	
	@Column(name = "dam_status")
	private boolean damStatus;
	
	@Column(name = "dam_request_type")
	private String damRequestType;
	
	@Column(name = "dam_dbname")
	private String damDbname;
	
	@Column(name = "dam_username")
	private String damUsername;
	
	@Column(name = "dam_password")
	private String damPassword;
	
	@Column(name = "damTablename")
	private String dam_tablename;
	
	@Column(name = "dam_request_header")
	private String dam_requestHeader;
	
	@Column(name = "dam_site_service")
	private String dam_siteService;	
	
	@Column(name = "dam_headers")
	private String damHeaders;

}
