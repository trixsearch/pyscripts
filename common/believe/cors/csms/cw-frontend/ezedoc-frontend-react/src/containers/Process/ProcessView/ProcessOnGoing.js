import React, { lazy, Component, Suspense } from "react";
import ReactTooltip from 'react-tooltip';
import axios from "axios";
import moment from 'moment';
import DrishtiButton from 'components/UI/DrishtiButton/DrishtiButton';
import "./notify.css"

import Spinner from "components/UI/Spinner/Spinner";
import UserReassign from "./UserReassign";
import WithdrawProcess from "./WithdrawProcess";
import { GroupUsers } from '../Group'
import { 
    EntityPhoto, ProcessText, SelectedProcessVars, getEntityDetails, email_test 
} from "../ProcessComponents";
import DocUpload from './DocUpload';
import Checkbox from '../../../components/UI/Checkbox/Checkbox'
import {isMobile} from '../../utils';
import {CANDIDATE_USER, PROCESS_DATETIME_FORMAT} from '../../../Data/constants'
import './ProcessOverlayPage.css'
import './PersonalDetail/personDetails.css'

const APP_URL = process.env.REACT_APP_APP_URL;

const LazyView = lazy(() => import('./PersonalDetail/ProcessView'))

class ProcessOnGoing extends Component {
    orgId = this.props.match?.params?.uuid;
    state = {
        showOption: false,
        currentTask: [],
        currentTaskAssignee: []
    }

    componentDidMount() {
        if(!this.props.isProcessOverlayPage) {
            this.stepProgress();
        }
    }

    stepProgress = () => {
        this.props.setLoader(true)
        let url = `${APP_URL}/${this.props.match?.params?.uuid}/apps/step_progress?processDefinitionId=${this.props.data.processDefinitionId}&processInstanceId=${this.props.data.id}&processDefinitionKey=${this.props.processKey}`;
        axios.get(
            url
        )
            .then(response => {
                const currentAssignees = response.data.data.current.map(task => task.assignee);
                const currentOwner = new Set(currentAssignees);
                let owners = [...currentOwner].map(assignee => {
                    let owner = {
                        email: assignee
                    }
                    return owner;
                });
                this.setState({
                    currentTask: response.data.data.current.filter(task => task.assignee),
                    currentTaskAssignee: owners
                })
            })
            .finally(() => this.props.setLoader(false))
    }

    showActions = () => {
        this.setState(prevState => ({
            showOption: !prevState.showOption
        }));
    }

    render() {
        const {
            selected_form_fields,onMouseEnterHandler,onMouseLeaveHandler, data, 
            reassignPermission, withdrawPermission, remindPermission, taskUsers, 
            selectedView, processKey, viewDetailsToggler, offset, 
            selected_id, selected_cards, setLoader, uploadDocPermission, bulkEmailPermission,
            pageSize,
        } = this.props;
        const { 
            id, variables, startTime, endTime 
        } = data;
        let [
            initiator, 
            entity_name,
            entity_photo, 
            displayVars,
            email,
            phone,
        ] = getEntityDetails(variables, selected_form_fields);
        if(initiator && email_test(initiator.value)) {
            initiator = CANDIDATE_USER
        }else if(initiator && !email_test(initiator.value)) {
            initiator = initiator.value
        } else {
            initiator = '-'
        }
        
        let processActions = withdrawPermission 
            || reassignPermission 
            || uploadDocPermission 
            || remindPermission;
        let selected_process = selected_cards.filter((e)=>e.id === id)
        let selected_cards_id = null;
        selected_cards_id = selected_process.length ? selected_process[0].id : null
        let selected_class = "completed_process_details_cont process_parent_notify"
        let isProcessOverlayPage = false
        let isProcessOverlayClass = ""
        if(id === selectedView) {
            selected_class += " active_process"
            isProcessOverlayClass = "processOverlayPage in"
            isProcessOverlayPage = true
            
        }else if (selected_cards_id === id) {
            selected_class += " selected_card_notify"
        }

        let currentTask = [];
        let currentTaskAssignee = [];

      
            currentTaskAssignee = this.state.currentTaskAssignee
            currentTask = this.state.currentTask
    

        return (
            <div className={isProcessOverlayClass}>
                <div 
                    onMouseEnter={()=>!isProcessOverlayPage && !isMobile() && onMouseEnterHandler(id)}
                    onMouseLeave={()=>!isProcessOverlayPage && onMouseLeaveHandler()}
                >

                    <div
                        className={selected_class}
                    >
                        {!isProcessOverlayPage && selected_cards_id !== id && selected_id === id && bulkEmailPermission?(
                            <div className="process_checkbox_notify ">
                                <Checkbox
                                    id={id}
                                    click={() => this.props.clickCard(true,id,email,phone)}
                                    checked={false}
                                />
                            </div> 
                        ):""}
                        {!isProcessOverlayPage && selected_cards_id === id && bulkEmailPermission?(
                            <div className="process_checkbox_notify ">
                                <Checkbox
                                    id={id}
                                    checked
                                    click={() => this.props.clickCard(false,id,email,phone)}
                                />
                            </div>

                        ):""}

                        <EntityPhoto url={entity_photo}>
                            <h6
                                data-cy="entity_name"
                                data-tip
                                data-for={`entity_name${data.id}`}
                                className="entity_name-overflow"
                            >
                                {entity_name ? entity_name.value : "-"}
                            </h6>
                            {!isMobile() ? (
                                <ReactTooltip id={`entity_name${id}`} place='bottom' delayShow={10} aria-haspopup='true' className="app_btn_bg_color">
                                    <h6 className="entity_name-text">{entity_name ? entity_name.value : "-"}</h6>
                                </ReactTooltip>
                            ) : null}
                        </EntityPhoto>
                        <div style={{ width: '75%' }}>
                            <div className="process-cards-static-grid">
                                <ProcessText heading="Started by">
                                    <h6 data-cy="initiator" data-tip data-for={`initiator${id}`} className="entity_name-overflow">{initiator}</h6>
                                    {!isMobile() ? (
                                        <ReactTooltip id={`initiator${id}`} place='bottom' aria-haspopup='true' className="app_btn_bg_color tooltip-text">
                                            <h6 className="process_details_text">{initiator}</h6>
                                        </ReactTooltip>
                                    ) : null}
                                </ProcessText>
                                <ProcessText heading="Started at" value={moment(startTime).format(PROCESS_DATETIME_FORMAT)} />
                                <ProcessText heading="Current Owner">
                                    {currentTaskAssignee.length !== 0 ? (
                                        <div className="current-owner-text">
                                            <GroupUsers 
                                                id={id} 
                                                showTooltip    
                                                users={currentTaskAssignee} 
                                            />
                                        </div>
                                    ) : <p>-</p>
                                    }
                                </ProcessText>
                                <ProcessText heading="Progress" value="-----" />
                            </div>
                            <SelectedProcessVars displayVars={displayVars} />
                        </div>
                        <div className='dristhi-container'>
                            <DrishtiButton processId={id} tenantId={this.orgId} />
                        </div>

                        <div className="btn-group process_details_text user_button" role="group">
                            <button
                                type="button"
                                className="fancy-btn active"
                                onClick={(event) => viewDetailsToggler(event, id)}
                            >
                                {id === selectedView ? 'Hide Details' : 'Show Details'}
                            </button>

                            {withdrawPermission && (
                                <WithdrawProcess 
                                    {...this.props}
                                    id={id} 
                                    page={offset}
                                    pageSize={pageSize}
                                    processKey={processKey}
                                />
                            )}

                            {reassignPermission && (
                                <UserReassign
                                    processInstanceId={this.props.data.id}
                                    currentTask={currentTask}
                                    taskUsers={taskUsers}
                                    stepProgress={this.stepProgress}
                                    setLoader={setLoader}
                                    orgId={this.orgId}
                                />
                            )}
                            {processActions ? (
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
                                            {withdrawPermission && (
                                                <WithdrawProcess 
                                                    {...this.props}
                                                    id={id}
                                                    page={offset}
                                                    pageSize={pageSize}
                                                    processKey={processKey}
                                                />
                                            )}
                                        </li>
                                        <li>
                                            {reassignPermission && (
                                                <UserReassign
                                                    processInstanceId={this.props.data.id}
                                                    currentTask={currentTask}
                                                    taskUsers={taskUsers}
                                                    stepProgress={this.stepProgress}
                                                    setLoader={setLoader}
                                                    orgId={this.orgId}
                                                />
                                            )}
                                        </li>
                                        <li>
                                            {
                                                uploadDocPermission
                                                && <DocUpload id={id} setLoader={setLoader} />
                                            }        
                                        </li>
                                    </ul>
                                </div>
                            ) : <div />}
                        </div>
                    </div>
                    <Suspense fallback={<Spinner />}>
                        {data.id === selectedView && (
                            <LazyView
                                data={data}
                                key={endTime}
                                processKey={processKey}
                                setLoader={setLoader}
                                typeofprocess="false"
                                isProcessFinished={false}
                            />
                        )}
                    </Suspense>
                </div>
            </div>
        )
    }
}

export default ProcessOnGoing;