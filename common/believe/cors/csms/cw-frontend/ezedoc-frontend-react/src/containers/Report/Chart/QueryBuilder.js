// TODO this needs to be refector
/* eslint-disable no-unneeded-ternary */
import React, { Fragment } from "react";
import { Button } from "../../../components/UI/AppButton/AppButton";
import { CancelOutlined } from "@material-ui/icons";

export default (props) => {
    const {
        runReport, query, index, handleAttribute, formFields, report_type, typeDecision, reportOnEntity, reportOnInventory,reportOnBgv
    } = props;
    const disabled = runReport ? !query[index].prompt : query[index].prompt;

    let deleteButton = false
    if (!reportOnEntity && index > 0 ) {
        deleteButton = true
    }else if(reportOnEntity && index >= 0) {
        deleteButton = true
    }

    const getOptions = () => {
        if (reportOnInventory) {
            return (
                <Fragment>
                    <option key="bydefault">Select Attribute</option>
                    <option key="start_date" value="start_date">Start Date</option>
                    <option key="end_date" value="end_date">End Date</option>
                </Fragment>
            )
        } 
        if (reportOnBgv) {
            return (
                <Fragment>
                    <option key="bydefault">Select Attribute</option>
                    <option key="start_date" value="start_date">Start Date</option>
                    <option key="end_date" value="end_date">End Date</option>
                </Fragment>
            )
        } 
        if (reportOnEntity) {
            return (
                <Fragment>
                    <option key="bydefault">Select Attribute</option>
                    <option key="activeOn" value="activeOn">Active On</option>
                    <option key="deletedAfter" value="deletedAfter">Deleted After</option>
                    <option key="deletedBefore" value="deletedBefore">Deleted Before</option>
                </Fragment>
            )
        }
        return (
            <Fragment>
                <option key="bydefault">Select Attribute</option>
                <option key="finishedAfter" value="finishedAfter">Finished  After</option>
                <option key="finishedBefore" value="finishedBefore">Finished Before</option>
                <option key="startedAfter" value="startedAfter">Started After</option>
                <option key="startedBefore" value="startedBefore">Started Before</option>
            </Fragment>
        )
    }
    
    return (
        <Fragment>
        {!reportOnEntity || query.length
        ?(
        <Fragment>
            <div>
                <select
                    disabled={runReport}
                    required
                    key="type"
                    name="type"
                    className="form-control"
                    value={query && query[index] !== undefined && query[index].type && query[index].type}
                    onChange={(e) => handleAttribute(e, index)}
                >
                    {((report_type === "custom"|| report_type === "common") && (!typeDecision||reportOnEntity)) 
                        ?<option key="common" value="common">Common</option> : ""
                    }
                    <option key="processSpecific" value="processSpecific">Process Specific</option>
                </select>
            </div>
            <div>
                {query && query[index] !== undefined
                    && query[index].type && query[index].type === "common"
                    && (
                        <select
                        disabled={!!(runReport && !(query[index].attribute===""||query[index].attribute==="Select Attribute"))}
                            value={query[index].attribute}
                            required
                            key="attribute"
                            name="attribute"
                            className="form-control query-decision"
                            onChange={(e) => handleAttribute(e, index)}
                        >
                            {getOptions()}
                        </select>
                        
                    )}
                {query && query[index] !== undefined
                    && query[index].type && query[index].type === "processSpecific" && (
                        <select
                            disabled={!!(runReport && !(query[index].attribute===""||query[index].attribute==="Select Attribute"))}
                            value={query[index].attribute}
                            required
                            key="attribute"
                            name="attribute"
                            className="form-control query-decision"
                            onChange={(e) => handleAttribute(e, index, formFields)}
                        >
                            <option key="bydefault">Select Attribute</option>
                            {formFields && formFields.map(option => (
                                <option key={option.key} value={option.key}>
                                    {option.name}
                                </option>
                            ))}
                        </select>
                    )}
            </div>
            <div>
                {query && query[index] !== undefined
                    && query[index].type && query[index].type === "common"
                    && (
                        <select
                            disabled={runReport}
                            value={query[index].comparision}
                            required
                            key="comparision"
                            name="comparision"
                            className="form-control"
                            onChange={(e) => handleAttribute(e, index)}
                        >
                            <option key="isEqualTo" value="isEqualTo">Is equal to</option>
                        </select>
                    )}
                {query && query[index] !== undefined
                    && query[index].type && query[index].type === "processSpecific"
                    && (
                        <DecisionSelect
                            runReport={runReport}
                            value={query[index].attribute}
                            query={query}
                            index={index}
                            handleAttribute={handleAttribute}
                            formFields={formFields}
                        />
                    )}
            </div>

            <div className="form-group-container" style={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap:'10px'}}>

            <div className="">
                {query && query[index] !== undefined
                    && query[index].type && query[index].type === "processSpecific"
                    && (
                        <DecisionComponent
                            disabled={disabled}
                            value={query[index].attribute}
                            query={query}
                            index={index}
                            handleAttribute={handleAttribute}
                            formFields={formFields}
                        />
                    )}

                {query && query[index] !== undefined
                    && query[index].type && query[index].type === "common"
                    && (
                        <input
                            className="form-control query-decision"
                            disabled={disabled}
                            required={!disabled}
                            type="date"
                            name="value"
                            value={(!runReport && query[index].prompt) ? "" : query[index].value}
                            onChange={(e) => handleAttribute(e, index)}
                        />
                    )}
            </div>
            {report_type === "custom" ? (
            <Fragment>    
              <div style={{
display: 'flex', flexDirection: 'row', alignItems: 'center', position: 'relative', gap:"10px"
}}
              >       
                <input
                    className="prompt-for-vars"
                    onChange={(e) => handleAttribute(e, index)}
                    checked={query[index].prompt || false}
                    type="checkbox"
                    name="prompt"
                    style={{
                         width: 30, height: 30, display: runReport ? 'none' : 'block' 
                        }}
                />

                {!runReport && (
                    <span className="">Prompt user</span>
                )}
              </div>
            </Fragment>
          ) : ""}
            <div>
                {(deleteButton && !runReport)
                    && (
                        <div className="report-query-row-delete" >
                            <Button
                                onClick={() => { props.delete(index) }}
                                variant="lists-option-row-delete btn btn-disabled btn-circle"
                                >
                                <CancelOutlined />
                            </Button>
                        </div>
                    )}
            </div>
            </div>
        </Fragment>
        )
        :null
        }
        </Fragment>
    )
}


export const DecisionComponent = ({
    disabled, query, formFields, index, value, handleAttribute
}) => {

    let Inputvalue = "";
    if (query && query[index]) {
        Inputvalue = query[index].value
    }

    let data = formFields.filter(field => field.key === value);
    let [element] = data;
    let queryReq = true
    if(value === "" || value === undefined || value === "Select Attribute") {
        queryReq = false
    }
    if (value !== "" && value !== undefined) {
        if (data.length) {
            let InputType = "text";
            if (element.type === "long") {
                InputType = "number";
            }
            if (element.type === "date") {
                InputType = "date";
            }
            return (
                <input
                    className="form-control query-decision"
                    disabled={disabled}
                    required={!!(!disabled && queryReq)}
                    name="value"
                    value={Inputvalue}
                    type={InputType}
                    onChange={(e) => handleAttribute(e, index)}
                />
            )
        }
    }
    return (
        <input
            className="form-control query-decision"
            disabled={disabled}
            required={!!(!disabled && queryReq)}
            name="value"
            value={Inputvalue}
            type="text"
            onChange={(e) => handleAttribute(e, index)}
        />
    )
}


export const DecisionSelect = (props) => {
    const {
        value, formFields, runReport, query, index, handleAttribute
    } = props;
    if (value !== "" && value !== undefined) {
        let data = formFields.filter(field => field.key === value);
        let [element] = data;
        if (data.length) {
            return (
                <select
                    disabled={runReport}
                    value={query[index].comparision}
                    required
                    key="comparision"
                    name="comparision"
                    className="form-control"
                    onChange={(e) => handleAttribute(e, index)}
                >
                    {element.type === "string" && (
                        <Fragment>
                            <option key="EQUALS" value="EQUALS">Is equal to</option>
                            <option key="NOT_EQUALS" value="NOT_EQUALS">Not equal to</option>
                            <option key="NOT_EQUALS_IGNORE_CASE" value="NOT_EQUALS_IGNORE_CASE" hidden >Not equal to ignore case</option> 
                            {/* it is hidden so that it won't affect the UI for old queries but also restrict the user to not select "not equals to ignore case" */}
                            <option key="EQUALS_IGNORE_CASE" value="EQUALS_IGNORE_CASE">Equal to ignore case</option>
                            <option key="LIKE" value="LIKE">Like</option>
                            <option key="LIKE_IGNORE_CASE" value="LIKE_IGNORE_CASE">Like ignore case</option>
                        </Fragment>
                    )}
                    {(element.type === "date" || element.type === "long") && (
                        <Fragment>
                            <option key="EQUALS" value="EQUALS">Is equal to</option>
                            <option key="NOT_EQUALS" value="NOT_EQUALS">Not equal to</option>
                            <option key="GREATER_THAN" value="GREATER_THAN">Greater than</option>
                            <option key="GREATER_THAN_OR_EQUALS" value="GREATER_THAN_OR_EQUALS">Greater than equal to</option>
                            <option key="LESS_THAN" value="LESS_THAN">Less than</option>
                            <option key="LESS_THAN_OR_EQUALS" value="LESS_THAN_OR_EQUALS">Less than equal to</option>
                        </Fragment>
                    )}
                </select>
            )
        }
    }
    return (
        <select
            disabled={runReport}
            value={query[index].comparision}
            required
            key="comparision"
            name="comparision"
            className="form-control"
            onChange={(e) => handleAttribute(e, index)}
        >
            <option key="isEqualTo" value="isEqualTo">Is equal to</option>
        </select>
    )
}
