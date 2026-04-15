/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import ReactTooltip from 'react-tooltip';

const AdvancedFilterComponent = (props) => {
    return (
        <div className="" >
              <div className="row" style={{padding:"15px 0px",}}>
                    <div className="col advanced-filter-user-container" style={{display: 'flex' ,flexDirection: 'row'}}>
                        <span><p style={{margin:"5px 15px"}}>User Filter:</p></span>
                        <select 
                            className="form-control"
style={{width:"300px"}} 
                            value={props.userFilter ? props.userFilter[0] || "": ""} 
                            onChange={props.handleUserFilter}
                            disabled={props.report_type !== 'custom'}
                        >
                            <option key="none" value="">None</option>
                            {props.userFilterChoices && props.userFilterChoices.map(choice => (
                                <option key={choice.key} value={choice.key}>
                                    {choice.label}
                                </option>
                            ))}
                        </select>
                        <div className="report_filter_info" data-tip data-for="open">
                            <i className="glyphicon glyphicon-question-sign filter_help" aria-hidden="true" />
                        </div>
                        <ReactTooltip id="open" place='bottom' delayShow={1000} aria-haspopup='true' className="app_btn_bg_color">
                            <h6 className="entity_name-text">Apply user specific filter criteria like User's Location, Department or Custom attribute</h6>
                        </ReactTooltip>
                    </div>
                    {!props.typeDecision?(
                    <div className="col advanced-filter-process-container" style={{display: 'flex' ,flexDirection: 'row'}}>
                        <span><p style={{margin:"5px 15px"}}>Process Type:</p></span>
                        <select className="form-control" style={{width:"300px"}} value={props.processType || ""} onChange={props.handleProcessType}>   
                            <option key="all" value="">All</option>  
                            <option key="ongoing" value="ONGOING">Ongoing</option>
                            <option key="completed" value="COMPLETED">Completed</option>
                            <option key="withdrawn" value="WITHDRAWN">Withdrawn</option>     
                        </select>
                    </div>
                    ):null} 
              </div>
              <div className="row">
                {!props.typeDecision?(
                <div className="col-12" style={{marginBottom:"15px", display: 'flex', flexDirection: 'row'}}>
                    <input 
                        className="checkbox" 
                        style={{margin:"-7px 7px 8px 7px"}} 
                        checked={props.isInvolved || false} 
                        type="checkbox" 
                        onChange={props.handleIsInvolved}
                        disabled={props.report_type !== 'custom'}
                    />
                    <p>Show only my participating processes</p>
                </div>
                ):null} 
              </div>
                
        </div>
    );
} 

export default AdvancedFilterComponent;