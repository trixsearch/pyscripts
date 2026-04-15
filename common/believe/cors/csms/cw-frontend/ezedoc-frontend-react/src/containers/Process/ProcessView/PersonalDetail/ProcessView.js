/* eslint-disable react/no-unused-state */
import React, {
    lazy,
    Suspense,
    Component
} from 'react'
import axios from 'axios'
import { connect } from "react-redux";
import { withRouter } from 'react-router-dom';

import Spinner from 'components/UI/Spinner/Spinner'
import {
    showScrollArrows, isNumber, FormHandler, DocumentFetchHandler
} from '../../../utils'
import { email_test } from '../../ProcessComponents'

const APP_URL = process.env.REACT_APP_APP_URL;

const LazyCommonView = lazy(() => import('../../../Entities/CommonView'))

class ProcessView extends Component {
    constructor(props) {
        super(props)
        this.tabRef = React.createRef()
        this.state = {
            docData: [],
            auditLog: [],
            formNames: [],
            allFormData: [],
            historySize: 10,
            historyStart: 0,
            showArrow: false,
            currentFormId: 0,
            submissionData: '',
            currentFormData: '',
            viewAllHistoryShow: true,
            currentTab: 'processStats',
        }
    }

    componentDidMount() {
        const orgId = this.props.match?.params?.uuid;
        let data = {}
        this.props.data.variables.map((e) => {
            try {
                data[e.name] = isNumber(e.value) ? e.value : JSON.parse(e.value)
            } catch (err) {
                data[e.name] = e.value
            }
            return e
        })

        if (this.props.data.id) {
            this.props.setLoader(true)
            const FORMS_FETCH_API = `${APP_URL}/${orgId}/apps/get_process_forms?processInstanceId=${this.props.data.id}&processFinished=${this.props.isProcessFinished}&processDefinitionKey=${this.props.processKey}`
            axios.get(FORMS_FETCH_API)
                .then(response1 => {
                    const formNames = response1.data.data.forms
                    const allFormData = new Array(formNames.length).fill(null) || []
                    this.setState({
                        formNames,
                        allFormData,
                        submissionData: {
                            data: data
                        }
                    }, () => {
                        if (formNames.length > 0) {
                            this.handleForms(formNames[0], 0, this.props.processKey)
                        }
                    })
                })
                .catch(() => this.props.setLoader(false))
        } else {
            this.showArrows()
        }
    }

    showArrows = (delay) => {
        setTimeout(() => {
            let showArrow = showScrollArrows(this.tabRef.current)
            this.setState({
                showArrow
            })
        }, delay || 50)
    }

    handleProcessStats = () => {
        this.showArrows()
        this.setState({
            currentFormId: null,
            currentTab: 'processStats',
        })
    }

    viewAllHistoryHandler = () => {
        if (this.props.data.id) {
            const AUDIT_HISTORY_FETCH_API = `${APP_URL}/${this.orgId}/proxy-bpm/history/historic-activity-instances?processInstanceId=${this.props.data.id}&start=${this.state.historyStart}&size=${this.state.historySize}`
            axios
                .get(AUDIT_HISTORY_FETCH_API)
                .then(res => {
                    this.setState((prevState) => ({
                        auditLog: [...prevState.auditLog, ...res.data.data.data],
                        viewAllHistoryShow: false
                    }))
                })
        }
    }

    handleForms = (formName, id, processDefinitionKey) => FormHandler(this, this.props.match?.params?.uuid, this.props.setLoader, formName, id, this.props.current_task_owner, 'process', processDefinitionKey)

    handleAttachments = () => DocumentFetchHandler(this, this.props.match?.params?.uuid, this.props.setLoader, false, this.props.data.id, this.props.processKey)

    handleHistory = () => {
        const orgId = this.props.match?.params?.uuid;
        if (this.state.auditLog.length === 0) {
            if (this.props.data.id) {
                this.props.setLoader(true)
                const AUDIT_HISTORY_FETCH_API = `${APP_URL}/${orgId}/proxy-bpm/history/historic-activity-instances?processInstanceId=${this.props.data.id}&start=${this.state.historyStart}&size=${this.state.historySize}`
                axios.get(AUDIT_HISTORY_FETCH_API)
                    .then(res => {
                        this.setState({
                            auditLog: res.data.data.data,
                            historySize: res.data.data.total,
                            historyStart: res.data.data.total > 10 ? 10 : 0,
                            viewAllHistoryShow: res.data.data.total > 10,
                            currentFormId: null,
                            currentTab: 'history'
                        })
                    })
                    .catch(() => {
                        this.setState({
                            currentFormId: null,
                            currentTab: 'history'
                        })
                    })
                    .finally(() => {
                        this.showArrows()
                        this.props.setLoader(false)
                    })
            }
        } else {
            this.showArrows()
            this.setState({
                currentFormId: null,
                currentTab: 'history'
            })
        }
    }

    render() {
        let {
            currentTab,
            formNames,
            showArrow,
            currentFormId,
            submissionData,
            currentFormData,
            docData,
            auditLog,
            historySize,
            viewAllHistoryShow
        } = this.state

        let auditLogData = [...auditLog]
        auditLogData.forEach(auditData => {
            let auditObj = auditData
            let assignee = email_test(auditData.assignee) ? 'Candidate User' : auditData.assignee
            auditObj.assignee = assignee
        })
        auditLog = auditLogData

        return (
            <Suspense fallback={<Spinner />}>
                <LazyCommonView
                    doc_data={docData}
                    tabRef={this.tabRef}
                    auditData={auditLog}
                    showArrow={showArrow}
                    formNames={formNames}
                    tabStatus={currentTab}
                    historySize={historySize}
                    processData={this.props.data}
                    currentFormId={currentFormId}
                    handleForms={this.handleForms}
                    submissionData={submissionData}
                    currentFormData={currentFormData}
                    handleHistory={this.handleHistory}
                    viewAllHistoryShow={viewAllHistoryShow}
                    handleAttachments={this.handleAttachments}
                    handleProcessStats={this.handleProcessStats}
                    viewAllHistoryHandler={this.viewAllHistoryHandler}
                    currentId={this.props.processKey}
                />
            </Suspense>
        )
    }
}

const mapStateToProps = state => {
    return {
        current_task_owner : state.auth.current_task_owner
    }
}

export default withRouter(connect(mapStateToProps, null)(ProcessView));