import React from 'react'
import AttachmentCondition from '../Process/ProcessView/PersonalDetail/AttachmentCondition'
import TabComponent from './TabComponent'
import { arrowButtons } from '../utils'

import './components.css';

const activeTabWidth = {
    maxWidth: window.innerWidth / 2
}

const CommonView = props => {
    
    // TODO: bgv tab to be shown conditionally based on 
    // bgvEnabled flag, pending from backend => DONE

    // static tabs first, dynamic tabs are appended last => DONE
    const bgvEnabled = props.bgv_enabled;
    return (
        <div className='onboarding_personal_details_row'>
            <div className='app_category_cont top_first_containent'>
                <div className='tab-content tab_content ezedox_main_form'>
                    <div className='tab-pane active'>
                        <ul
                            ref={props.tabRef}
                            className='nav nav-tabs process_tab_ongoing_comp_ul process_details_tab'
                            role='tablist'
                        >
                            {bgvEnabled && (
                                <>
                                    <TabComponent
                                        key={`form_data_${'profileDetails'}`}
                                        onClick={()=>{
                                            window.sendEvent("Hire_Actions_of_applicant_profile ",{
                                                Clickson_Document:false,
                                                Clickson_Application_details:true,
                                                Clickson_Statistics:false
                                            })
                                            props.handleProfileDetails()
                                        }}
                                        TabClassName={
                                            props.tabStatus === 'profileDetails'
                                                ? 'nav-item active process_details_active_tab'
                                                : 'nav-item'
                                        }
                                        id='profle_details_tab_id'
                                        name='Details'
                                        TabStyle={props.tabStatus === 'profileDetails' ? activeTabWidth : {}}
                                    />
                                    {/* <TabComponent
                                        key={`form_data_${'bgv'}`}
                                        onClick={props.handleBgvInfo}
                                        TabClassName={
                                            props.tabStatus === 'bgv'
                                                ? 'nav-item active process_details_active_tab'
                                                : 'nav-item'
                                        }
                                        id='bgv_tab_id'
                                        name='BGV'
                                        TabStyle={props.tabStatus === 'bgv' ? activeTabWidth : {}}
                                    /> */}
                                </>
                            )}
                            <TabComponent
                                key={`form_data_${'documents'}`}
                                onClick={()=>{
                                    window.sendEvent("Hire_Actions_of_applicant_profile ",{
                                        Clickson_Document:true,
                                        Clickson_Application_details:false,
                                        Clickson_Statistics:false
                                    })
                                    props.handleAttachments()
                                }}
                                TabClassName={
                                    props.tabStatus === 'documents'
                                        ? 'nav-item active process_details_active_tab'
                                        : 'nav-item'
                                }
                                id='documents_tab_id'
                                name='Documents'
                                TabStyle={props.tabStatus === 'documents' ? activeTabWidth : {}}
                            />
                            <TabComponent
                                key={`form_data_${'Statistics'}`}
                                onClick={()=>{
                                    window.sendEvent("Hire_Actions_of_applicant_profile",{
                                        Clickson_Document:false,
                                        Clickson_Application_details:false,
                                        Clickson_Statistics:true
                                    })
                                    props.handleProcessStats()
                                }}
                                TabClassName={
                                    (props.tabStatus === 'processStats' || props.tabStatus === 'entityStats')
                                        ? 'nav-item active process_details_active_tab'
                                        : 'nav-item'
                                }
                                id='Statistics_tab_id'
                                name='Statistics'
                                TabStyle={
                                    props.tabStatus === 'processStats' || props.tabStatus === 'entityStats' ? activeTabWidth : {}
                                }
                            />
                            {props.type === 'entity' ? null : (
                                <TabComponent
                                    key={`form_data_${'History'}`}
                                    onClick={props.handleHistory}
                                    TabClassName={
                                        props.tabStatus === 'history'
                                            ? 'nav-item active process_details_active_tab'
                                            : 'nav-item'
                                    }
                                    id='History_tab_id'
                                    name='History'
                                    TabStyle={props.tabStatus === 'history' ? activeTabWidth : {}}
                                />
                            )}
                            {
                                props.formNames
                                && Array.isArray(props.formNames)
                                && props.formNames.map((formName, tabId) => (
                                    <TabComponent
                                        key={`form_data_${tabId + 1}`}
                                        onClick={() => props.handleForms(formName, tabId, props.currentId)}
                                        TabClassName={
                                            props.tabStatus === 'form' && props.currentFormId === tabId
                                                ? 'nav-item active process_details_active_tab'
                                                : 'nav-item'
                                        }
                                        id={tabId}
                                        name={formName}
                                        TabStyle={props.currentFormId === tabId ? activeTabWidth : {}}
                                    />
                                ))
                            }
                        </ul>
                    </div>
                </div>
                <div
                    className='edit_app_detils_form_cont edit_app_details_tab'
                    style={{
                        borderTopLeftRadius: props.currentFormId === 0 ? '0px' : 'initial',
                        borderTopRightRadius: props.showArrow ? '0px' : null
                    }}
                >
                    <AttachmentCondition
                        formScroll
                        doc_data={props.doc_data}
                        form={props.currentFormData}
                        auditData={props.auditData}
                        historySize={props.historySize}
                        viewAllHistoryHandler={props.viewAllHistoryHandler}
                        viewAllHistoryShow={props.viewAllHistoryShow}
                        tabType={props.tabStatus}
                        submission={props.submissionData}
                        options={{ readOnly: true }}
                        type={props.type}
                        processData={props.processData}
                        entityData={props.entity_statistics_data}
                        bgvInfo={props.bgvInfo}
                        profileInfo={props.profileInfo}
                        partner_profile_id={props.partner_profile_id}
                    />
                </div>
            </div>
            {props.showArrow ? arrowButtons(props.tabRef.current) : null}
        </div>
    );
}

export default CommonView