import React, {
    Fragment,
    useEffect,
} from 'react'
import { connect } from 'react-redux'
import { 
    NavLink,
    Redirect, Route, Switch, useLocation, useParams
} from 'react-router-dom'
import moment from 'moment'

import { Item } from 'containers/utils'
import {
    getJob,
    clearCandidates,
} from 'store/actions/index'

import Applicants from './Applicants'
import Slots from './Slots'
// import JobViewTab from './JobViewTab'

import '../hiring-routes-common.css'
import './jobView.css'
import routes from '../../../urls'

const tabList = [
    {label: 'Applicants', to: 'applicants'},
    {label: 'Slots', to: 'slots'},
]

const JobView = props => {

    const {
        jobDetail,
        jobFeature,
        getJobDetail,
        clearCandidateList,
        match,
    } = props

    const urlParamJobId = props.match.params.id
    const { uuid: orgId } = useParams();
    const location = useLocation();

    const {
        job_id: jobId,
        role_name: jobRole,
        // job_title: jobTitle,
        work_location: jobLocation,
        work_city:jobCity,
        available_positions: availablePosition,
        target_date_to_finish_hiring: targetDate,
    } = jobDetail
    const currentDate = moment()
    const lastDate = moment(targetDate)
    const remainingDays = lastDate.diff(currentDate, 'days')

    let loc=jobLocation?.map((l)=>l.work_location).join(', ')

    useEffect(() => {
        if (jobFeature) getJobDetail(orgId, urlParamJobId)
        return () => clearCandidateList()
    }, [orgId, urlParamJobId])

    return (
        <Fragment>
            <div className='main_changable_container' style={{ height: window.innerHeight - 59 }}>
                <div className='process_details_tab_cont job-view'>
                    <div className='job-view-other-desc'>
                        <div id='job-id-container'>
                            REQUEST ID:
                            &nbsp;
                            {jobId}
                        </div>
                        <div id='job-other-details'>
                            <div>
                                Role:&nbsp;
                                <Item type='text' data={jobRole} id='job-role' name='job-view' />
                            </div>
                            {/* <div>
                                Title:&nbsp;
                                <Item type='text' data={jobTitle} id='job-title' name='job-view' />
                            </div> */}
                            <div>
                                City:&nbsp;
                                <Item type='text' data={jobCity} id='job-city' name='job-view' />
                            </div>
                            <div>
                                Location:&nbsp;
                                <Item type='text' data={loc} id={loc} name='job-view' />   
                            </div>
                            <div>
                                Total Openings:&nbsp;
                                <Item type='text' data={availablePosition} id='job-total-openings' name='job-view' />
                            </div>
                            <div>
                                Target Date:&nbsp;
                                <Item type='text' data={moment(targetDate).format('DD MMM YYYY')} id='job-target-date' name='job-view' />
                            </div>
                            <div className={remainingDays < 0 ? 'negative_value' : ''} >
                                Days to Hire:&nbsp;
                                <Item type='text' data={remainingDays + 1} id='job-remaining-days' name='job-view' />
                            </div>
                        </div>
                    </div>

                    <div className="lists_pages">
                        <ul className="nav nav-tabs process_tab_ongoing_comp_ul document_details_tabs" role="tablist">
                        { tabList.map((item)=> (
                            <li
                                role="presentation"
                                className={location.pathname.includes(item.to) ? "nav-item active" : "nav-item"}
                            >
                                <NavLink
                                    role="tab"
                                    data-toggle="tab"
                                    aria-selected="true"
                                    className="nav-link"
                                    to={`${match.url}/${item.to}${location.search}`}
                                >
                                    {item.label}
                                </NavLink>
                            </li>
                          ))}
                        </ul>
                    </div>
                    <Switch>
                        <Redirect
                            exact
                            from={match.url}
                            to={`${match.url}/applicants${location.search}`}
                        />
                        <Route
                            exact
                            path={routes.APPLICANTS.path}
                            render={(compProps) => (
                                <Applicants {...compProps} />
                            )}
                        />
                        <Route
                            exact
                            path={routes.SLOTS.path}
                            render={(compProps) => (
                                <Slots {...compProps} />
                            )}
                        />
                    </Switch>
                </div>
            </div>
        </Fragment>
    )
}

const mapStateToProps = ({ jobView, auth }) => ({
    jobDetail: jobView.job,

    jobFeature: auth.uiFeatures.job.view,
})

const mapDispatchToProps = {
    getJobDetail: getJob,
    clearCandidateList: clearCandidates,
}

export default connect(mapStateToProps, mapDispatchToProps)(JobView)
