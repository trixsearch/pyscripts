package com.jio.cwms.onboard.model;

import java.sql.Timestamp;

import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;

import io.swagger.v3.oas.annotations.Hidden;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Hidden
@Data
@Builder
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "upstream_application_master")
public class UpstreamMaster {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "uam_id")
	private long id;

	@Column(name = "uam_source_system")
	private String sourceSystem;

	@Column(name = "uam_source_sub_system")
	private String sourceSubSystem;

	@Column(name = "uam_calling_mechenism")
	private String callingMechanism;

	@Column(name = "uam_protocol")
	private String protocol;

	@Column(name = "uam_server_ip_url")
	private String serverURL;

	@Column(name = "uam_port")
	private String port;

	@Column(name = "uam_endpoint")
	private String endpoint;

	@Column(name = "uam_acm_id")
	private long acmId;

	@Column(name = "uam_status")
	private String status;

	@Column(name = "uam_request_type")
	private String requestType;

	@Column(name = "uam_dbname")
	private String dbName;

	@Column(name = "uam_username")
	private String username;

	@Column(name = "uam_password")
	private String password;

	@Column(name = "uam_tablename")
	private String tableName;

	@Column(name = "uam_inbound_topic")
	private String inboundTopic;

	@Column(name = "uam_outbound_topic")
	private String outboundTopic;

	@Column(name = "uam_publisher_url")
	private String publisherURL;

	@CreatedDate
	@Column(name = "uam_created_date")
	private Timestamp createdDate;

	@CreatedBy
	@Column(name = "uam_created_by")
	private long createdBy;

	@LastModifiedDate
	@Column(name = "uam_updated_date")
	private Timestamp updatedDate;

	@LastModifiedBy
	@Column(name = "uam_updated_by")
	private Long updatedBy;

	@Column(name = "uam_active")
	private boolean active;
	
	@Column(name = "uam_request_body")
	private String requestBody;

}
