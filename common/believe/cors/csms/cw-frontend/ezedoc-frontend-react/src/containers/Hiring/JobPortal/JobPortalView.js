/* eslint-disable react-hooks/exhaustive-deps */
import React, {
    useEffect,
} from 'react'
import { connect } from 'react-redux'
import { NavLink, useLocation, useParams } from 'react-router-dom'
import parse from 'html-react-parser'

import routes from 'urls'
import { parseQueryString } from 'containers/utils'
import Spinner from 'components/UI/Spinner/Spinner'

import {
    fetchJob,
} from 'store/actions/index'

import './JobPortal.css'

const JobPortalView = props => {
    const locationInfo = useLocation()
    const { next = 1 } = parseQueryString(locationInfo.search)
    const urlParamJobId = props.match.params.id
    const { uuid: orgId } = useParams();

    const href = window.location.href
    const protocol = window.location.protocol
    const hostName = window.location.hostname

    const {
        job,
        loader,
        getJob,
    } = props

    useEffect(() => {
        getJob(orgId, urlParamJobId)
    }, [
        orgId,
        getJob,
        urlParamJobId,
    ])

    const navigate = (referral = false) => {
        const jobId = job.job_id
        const role = job.role_name
        const workLocation = job.work_location_name
        const isResumeRequired = job.IsResumeRequired
        let url = `${protocol}//${hostName}/candidate/forms/hire_candidate`
        url += `?next=${href}`
        if (referral) url += '&referral=true'
        if (jobId) url += `&job=${jobId}`
        if (role) url += `&role=${role}`
        if (workLocation) url += `&workLocation=${workLocation}`
        url += `&IsResumeRequired=${isResumeRequired}`
        window.open(url, '_self')
    }

    return (
        <div className='job-portal-view'>
            {loader && <Spinner />}
            <div className='job-portal-view-container' id='container1'>
                <h3 className='text-over-flow-ellipsis job-title'>{job?.role_name}</h3>
                <div className='text-over-flow-ellipsis job-location'>{job?.work_location_name}</div>
                {
                    job.status === "Open" ? (
                        <button
                            type='button'
                            onClick={() => navigate(true)}
                            className='fancy_btn referral-btn'
                        >
                            Employee Referral
                        </button>
                    ) : null
                }
            </div>
            <div className='job-portal-view-container' id='container2'>
                <div className='sub-container'>
                    <div className='section-title'>JOB DESCRIPTION</div>
                    <div className='section-desc'>{parse(job?.description || 'No Description')}</div>
                </div>
                <div className='button-container'>
                    <NavLink to={routes.JOB_PORTAL_LIST.to(orgId, next)}>
                        <button
                            type='button'
                            className='fancy_btn'
                        >
                            Back
                        </button>
                    </NavLink>
                    {
                        job.status === "Open" ? (
                            <button
                                type='button'
                                onClick={() => navigate()}
                                className='fancy_btn active'
                            >
                                Apply Now
                            </button>
                        ) : null
                    }
                </div>
            </div>
        </div>
    )
}

const mapStateToProps = ({ jobPortal }) => ({
    job: jobPortal.job,
    loader: jobPortal.loader,
})

const mapDispatchToProps = {
    getJob: fetchJob,
}

export default connect(mapStateToProps, mapDispatchToProps)(JobPortalView)
