import React, { lazy, Suspense } from "react";
import ReactTooltip from 'react-tooltip';
import moment from 'moment';
import DrishtiButton from 'components/UI/DrishtiButton/DrishtiButton';
import Spinner from "components/UI/Spinner/Spinner";

import WithdrawReason from "./WithdrawReason";
import { 
    EntityPhoto, ProcessText, SelectedProcessVars, getEntityDetails,email_test
} from "../ProcessComponents";
import DocUpload from "./DocUpload";
import {isMobile} from '../../utils';
import {CANDIDATE_USER, PROCESS_DATETIME_FORMAT} from "../../../Data/constants"
import './ProcessOverlayPage.css'
import './PersonalDetail/personDetails.css'

const LazyView = lazy(() => import('./PersonalDetail/ProcessView'))

const ProcessCompleted = (props) => {
    const {
        selected_form_fields,
        data,
        selectedView,
        processKey,
        viewDetailsToggler,
        withdrawn,
        setLoader,
        uploadDocPermission
      } = props;
    const { 
        variables, id, deleteReason, startTime, endTime 
    } = data;
    
    let [initiator, entity_name, entity_photo, displayVars] = getEntityDetails(
        variables,
        selected_form_fields
      );
    if(initiator && email_test(initiator.value)) {
        initiator = CANDIDATE_USER
    }else if(initiator && !email_test(initiator.value)) {
        initiator = initiator.value
    } else {
        initiator = '-'
    }

    let ContainerClassName = id === selectedView
        ? `completed_process_details_cont ${!!withdrawn && `withdrawn_process`} active_process`
        : `completed_process_details_cont ${!!withdrawn && `withdrawn_process`}`;
    let isProcessOverlayClass = id === selectedView ? 'processOverlayPage in' : '';
    
    return (
        <>
            <div className={isProcessOverlayClass}>
                <div className={ContainerClassName}>
                    <EntityPhoto url={entity_photo} />
                    <div style={{ width: '75%' }}>
                        <div className="completed_process_card">
                            <ProcessText heading="Name" value={entity_name ? entity_name.value : "-"} />
                            <ProcessText heading="Started by">
                                <h6 data-cy="initiator" data-tip data-for={`initiator${id}`} className="process-ongoing-overflow">{initiator}</h6>
                                {!isMobile() ? (
                                    <ReactTooltip id={`initiator${id}`} place='bottom' aria-haspopup='true' className="app_btn_bg_color">
                                        <h6 className="entity_name-text">{initiator}</h6>
                                    </ReactTooltip>
                                ) : null}
                            </ProcessText>
                            <ProcessText heading="Started at" value={moment(startTime).format(PROCESS_DATETIME_FORMAT)} />
                            <ProcessText heading="Completed at" value={moment(endTime).format(PROCESS_DATETIME_FORMAT)} />
                        </div>
                        <SelectedProcessVars displayVars={displayVars}/>
                    </div>
                    <DrishtiButton processId={id} tenantId={props.data?.tenantId} />
                    <div 
                        className="btn-group process_details_text user_button"
                        style={{ display: deleteReason ? 'flex' : null, flexDirection: deleteReason ? 'column' : 'row' }}
                    >
                        <button
                            type="button"
                            className="process_show_details_btn fancy_btn active"
                            onClick={(event) => viewDetailsToggler(event, id)}
                            style={{width: '117px', padding: 0, minWidth: 'unset'}}
                        >
                            {id === selectedView ? 'Hide Details' : 'Show Details'}
                        </button>
                        {(!deleteReason && uploadDocPermission && !isMobile()) && (
                            <div role="group">
                                <button
                                    type="button"
                                    style={{ fontSize: "12px" }}
                                    className="btn btn-default dropdown-toggle actions"
                                    data-toggle="dropdown"
                                    aria-haspopup="true"
                                    aria-expanded="false"
                                >
                                    <span className="caret actions-caret" />
                                </button>
                                <ul className="dropdown-menu actions-list">
                                    <li>
                                        <DocUpload id={id} setLoader={setLoader} />
                                    </li>
                                </ul>
                            </div>
                        )}
                        {deleteReason ? (
                            <div className="withdraw-reason">
                                <WithdrawReason deleteReason={deleteReason} />
                            </div>
                        ) : <div />
                        }
                    </div>
                </div>
                <Suspense fallback={<Spinner />}>
                    {id === selectedView 
                        ? (
                            <LazyView
                                typeofprocess="true" 
                                data={data} 
                                key={endTime} 
                                setLoader={setLoader}
                                processKey={processKey}
                                isProcessFinished
                            />
                        ) : null
                    }
                </Suspense>
            </div>
        </>
    )
}

export default ProcessCompleted;