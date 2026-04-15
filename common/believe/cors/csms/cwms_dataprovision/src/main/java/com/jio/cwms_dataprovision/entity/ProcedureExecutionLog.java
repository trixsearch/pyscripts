package com.jio.cwms_dataprovision.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "procedure_execution_log")
public class ProcedureExecutionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "log_timestamp")
    private LocalDateTime logTimestamp;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "error_code")
    private String errorCode;

    @Column(name = "procedure_name")
    private String procedureName;

    @Column(name = "failed_query", columnDefinition = "TEXT")
    private String failedQuery;

    @Column(name = "stack_trace", columnDefinition = "TEXT")
    private String stackTrace;

    @Column(name = "status")
    private String status;

    @Column(name = "resolved_timestamp")
    private LocalDateTime resolvedTimestamp;

}