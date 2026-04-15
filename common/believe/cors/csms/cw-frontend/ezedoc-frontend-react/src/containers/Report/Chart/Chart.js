import React, { useState } from "react";
import ReactTooltip from 'react-tooltip';
import QueryBuilder from "./QueryBuilder";
import { Button } from "../../../components/UI/AppButton/AppButton";

const Chart = (props) => {
    const [query, setQuery] = useState(1);
    const addQuery = () => {
        props.count(query);
        setQuery(query + 1);
    }
    const {showShadowCard=true}=props
    return (
        <div className="reports_detals_box">
            <div className="report_total_loction_graph_box">
                <div className="total_report_graph_box pr-0">
                    <div className={props.runReport ? `${showShadowCard && 'edit_app_detils_form_cont'} reports-query-modal` : `${showShadowCard && 'edit_app_detils_form_cont'}`} style={{ margin: '4px' }}>
                        {/* Style attribute below is added because, when user comes from dashboard 
                        to report page some styles are overridden, if user visits reports first, 
                        then styles are applied normally.
                        */}
                        {props.hideFilter ? <SelectReport {...props} /> : ""}
                        <div className="graph_cont_heading" style={{ flexDirection: 'column' }}>
                            {props.query.map((e, i) => (
                                <div key={`row_${i + 1}`} className="query_builder">
                                    <QueryBuilder
                                        report_type={props.report_type}
                                        handleAttribute={props.handleAttribute}
                                        index={i}
                                        formFields={props.config}
                                        query={props.query}
                                        delete={props.delete}
                                        runReport={props.runReport}
                                        typeDecision={props.typeDecision}
                                        reportOnEntity={props.reportOnEntity}
                                        reportOnInventory={props.reportOnInventory}
                                        reportOnBgv={props.reportOnBgv}
                                    />
                                </div>
                            ))}
                            <div
                                style={{ paddingLeft: 9, paddingBottom: 16 }}
                                className={props.reportOnEntity && props.query.length === 0 ? 'entity-query-button' : ''}
                            >
                                {!props.runReport && (
                                    <Button variant="primary" onClick={addQuery}>
                                        Add Query
                                    </Button>
                                )}
                                {props.reportOnEntity
                                    ? (
                                        <>
                                            <div className="report_filter_info" data-tip data-for="entity_help_text" style={{ display: 'inline' }}>
                                                <i className="glyphicon glyphicon-question-sign filter_help" aria-hidden="true" />
                                            </div>
                                            <ReactTooltip id="entity_help_text" place='bottom' delayShow={1000} aria-haspopup='true' className="app_btn_bg_color">
                                                <h6 className="entity_name-text">
                                                    1. The &quot;Active On&quot; filter will provide you the data till the given date up to 11:59 PM.
                                                    <br />
                                                    &nbsp;&nbsp;&nbsp;&nbsp;For example, &quot;Active On 31st October 2020&quot; means all active profiles till 31st Octorber 23:59:59.
                                                    <br />
                                                    2. The &quot;Deleted After&quot; filter will provide you the data from the next day at 12:00 AM. 
                                                    <br />
                                                    &nbsp;&nbsp;&nbsp;&nbsp;For example, &quot;Deleted After 31st October 2020&quot; means all deleted profiles from 1st Nov 2020 00:00:00.
                                                    <br />
                                                    3. The &quot;Deleted Before&quot; filter will provide you the data till 11:59 PM of the previous day. 
                                                    <br />
                                                    &nbsp;&nbsp;&nbsp;&nbsp;For example, &quot;Deleted Before 1st Nov 2020&quot; means all deleted profiles till 31st October 23:59:59.
                                                </h6>
                                            </ReactTooltip>
                                        </>
                                    )
                                    : null}
                            </div>
                            {props.reportOnEntity
                                ? (
                                    <p className="entity-report-text">
                                        1. To get an active entity only choose a common filter attribute `Active On`.
                                        <br />
                                        2. To get a deleted entity only choose common filter attribute `Deleted After`.
                                        <br />
                                        3. If you do not provide a query you will get data of all the Entities.
                                    </p>
                                ) : null
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const SelectReport = (props) => {
    let disabled = !props.show
    return (
        <div style={{ display: 'flex', width: '100%', padding: 15 }}>
            <div style={{ width: 100, paddingTop: 5 }}>Date range : </div>
            <select disabled={disabled} style={{ width: 300 }} value={props.report_type} required key="report_type" name="report_type" className="form-control" onChange={props.checkType}>
                <option key="day" value="day">Daily</option>
                <option key="week" value="week">Weekly</option>
                <option key="month" value="month">Monthly</option>
                <option key="custom" value="custom">Custom</option>
            </select>
        </div>
    )
}

export default Chart;