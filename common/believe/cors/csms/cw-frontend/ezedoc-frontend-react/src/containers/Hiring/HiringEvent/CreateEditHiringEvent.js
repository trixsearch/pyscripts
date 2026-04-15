import React, {
    useState,
    useEffect,
} from 'react'
import { connect } from "react-redux";
import axios from "axios";
import { NavLink, useLocation, useParams } from 'react-router-dom'
import Select from 'react-select';
import routes from 'urls'
import moment from "moment"
import Datetime from 'react-datetime'

import { DATE_FORMAT } from "Data/constants";
import { parseQueryString } from "containers/utils";
import { portalPageStyles } from '../../Config/Utils/ReactSelectStyles'
import {
    createHiringEvent,
    editHiringEvent,
} from '../../../store/actions/Hiring/HiringEvent';
import Spinner from '../../../components/UI/Spinner/Spinner';
import { addToast } from '../../../components/Toast/actions';
import EventPreviewer from './EventPreviewer/EventPreviewer'

import "react-datetime/css/react-datetime.css"
import '../../Inventory/InventoryComponent/react-datetime-tweak.css'

import './HiringEvent.css';

const APP_URL = process.env.REACT_APP_APP_URL;

const CreateEditHiringEvent = props => {
    const [loader, setLoader] = useState(false)
    const [eventTitle, setEventTitle] = useState('')
    const [eventDescription, setDescription] = useState('')
    const [eventId, setEventId] = useState(null)
    const [lastDateToApply, setLastDateToApply] = useState('')
    const [eventStartDate, setEventStartDate] = useState('')
    const [eventEndDate, setEventEndDate] = useState('')
    const [reportingDate, setReportingDate] = useState('')
    const [reportingTime, setReportingTime] = useState('')
    const [interviewLocation, setInterviewLocation] = useState('')
    const [jobDetails, setJobDetails] = useState([])
    const [newData, setNewData] = useState({})
    const [templateData, setTemplateData] = useState({})
    const [openPreviewModal, setOpenPreviewModal] = useState(false)
    const [jobOptions, setJobOptions] = useState([])

    const currentEventId = props.match.params.id || null
    const location = useLocation()
    const { next = 1 } = parseQueryString(location.search)
    const {
        eventLoader,
        history
    } = props
    const { uuid: orgId } = useParams();

    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
        if (currentEventId) {
            setLoader(true)
            axios.get(`${APP_URL}/${orgId}/jobs/hiring_event/${currentEventId}`)
                .then(res => res.data.data)
                .then(data => {
                    const {
                        title,
                        description,
                        last_date_to_apply,
                        event_start_date,
                        event_end_date,
                        reporting_date,
                        reporting_time,
                        interview_location,
                        job,
                        event_id,
                    } = data
                    let reportingDateTime = `${reporting_date}T${reporting_time}Z`
                    setEventId(event_id)
                    setEventTitle(title)
                    setEventStartDate(moment(event_start_date).local())
                    setEventEndDate(moment(event_end_date).local())
                    setLastDateToApply(moment(last_date_to_apply).local())
                    setReportingDate(moment(reportingDateTime).local())
                    setReportingTime(moment(reportingDateTime).local())
                    setInterviewLocation(interview_location)
                    setDescription(description)
                    const jobList = job.map(jobData => ({
                        value: jobData.id,
                        label: jobData.job_id,
                        name: 'event',
                        role_name: jobData.role_name,
                    }))
                    setJobDetails(jobList)
                    const templateData1 = {
                        event_jobs: [...job],
                        event_title: title,
                        event_description: description,
                        event_last_date_to_apply: moment(last_date_to_apply).format('Do MMM YYYY'),
                        event_reporting_date: moment(`${reporting_date} ${reporting_time}`).add(330, 'minutes').format('Do MMM YYYY'),
                        event_reporting_time: moment(reporting_time, ['HH:mm:ss']).add(330, 'minutes').format('h:mm A'),
                        event_location: interview_location,
                    }
                    setTemplateData(templateData1)
                })
                .catch((error) => {
                    if (error.response) props.addToast('error', 'Error', error.response.data.message);
                    else props.addToast('error', 'Error', "Something went wrong");
                })
                .finally(() => setLoader(false))
        }
        
        axios.get(`${APP_URL}/${orgId}/jobs/`)
        .then(res => res.data.data)
        .then(data => {
            let options = data.map(job => ({
                value: job.id,
                label: job.job_id,
                name: "job",
                role_name: job.role_name,
            }))
            setJobOptions(options)
        })
        .catch((error) => {
            if (error.response) props.addToast('error', 'Error', error.response.data.message);
            else props.addToast('error', 'Error', "Something went wrong");
        })
    }, [orgId])

    const getValidDates = selectedDate => {
        let now = moment().local().subtract(1, 'day')
        if (selectedDate.isBefore(now)) {
            return false
        }
        return true
    }

    const handleDatetimeChange = (data, name) => {
        if (name === 'eventStartDate') {
            setEventStartDate(data)
            let testData = newData
            let backendKey = 'event_start_date'
            setNewData({
                ...testData,
                [backendKey]: data.toISOString(),
            })
        }
        if (name === 'eventEndDate') {
            setEventEndDate(data)
            let testData = newData
            let backendKey = 'event_end_date'
            setNewData({
                ...testData,
                [backendKey]: data.toISOString(),
            })
        }
        if (name === 'reportingDate') {
            setReportingDate(data)
            setReportingTime(data)
            let testData = newData
            let dateBackendKey = 'reporting_date'
            let dateValue = data.toISOString().substring(0, 10)
            let timeBackendKey = 'reporting_time'
            let timeValue = data.toISOString().substring(11, 19)
            setNewData({
                ...testData,
                [timeBackendKey]: timeValue,
                [dateBackendKey]: dateValue
            })
            setTemplateData({
                ...templateData,
                event_reporting_date: moment(data).format('Do MMM YYYY'),
                event_reporting_time: moment(data).format('h:mm A'),
            })
        }
        if (name === 'lastDateToApply') {
            setLastDateToApply(data)
            let testData = newData
            let backendKey = 'last_date_to_apply'
            setNewData({
                ...testData,
                [backendKey]: data.toISOString(),
            })
            setTemplateData({
                ...templateData,
                event_last_date_to_apply: moment(data).format('Do MMM YYYY'),
            })
        }
    }

    const handleStartDate = (data) => {
        handleDatetimeChange(data, 'eventStartDate')
    }

    const handleEndDate = (data) => {
        handleDatetimeChange(data, 'eventEndDate')
    }

    const handleReportingDate = (data) => {
        handleDatetimeChange(data, 'reportingDate')
    }

    const handleLastDateToApply = (data) => {
        handleDatetimeChange(data, 'lastDateToApply')
    }

    const handleJobChange = (data) => {
        if (data) {
            setJobDetails(data)
            let testData = newData
            let backendKey = 'job'
            let value = data.map(job => job.value)
            setNewData({
                ...testData,
                [backendKey]: value
            })
            setTemplateData({
                ...templateData,
                event_jobs: data,
            })
        }
    }

    const handleChange = (data) => {
        let name = null
        let value = null
        if (data.target) {
            name = data.target.name
            value = data.target.value
            if (name === 'eventTitle') {
                setEventTitle(value)
                let testData = newData
                let backendKey = 'title'
                setNewData({
                    ...testData,
                    [backendKey]: value
                })
                setTemplateData({
                    ...templateData,
                    event_title: value,
                })
            }
            if (name === 'description') {
                setDescription(value)
                let testData = newData
                let backendKey = 'description'
                setNewData({
                    ...testData,
                    [backendKey]: value
                })
                setTemplateData({
                    ...templateData,
                    event_description: value,
                })
            }
            if (name === 'interviewLocation') {
                setInterviewLocation(value)
                let testData = newData
                let backendKey = 'interview_location'
                setNewData({
                    ...testData,
                    [backendKey]: value
                })
                setTemplateData({
                    ...templateData,
                    event_location: value,
                })
            }
        }
    }

    const handleSubmit = () => {
        if (currentEventId) {
            if (Object.keys(newData).length > 0) {
                props.editHiringEvent(orgId, currentEventId, newData, history, next)
            } else {
                props.addToast('error', 'Error', 'No changes detected')
            }

        } else {
            props.createHiringEvent(orgId, newData, history, next)
        }
    }

    return (
        <div>
            {(eventLoader || loader) && (<Spinner />)}
            <div className="main_changable_container create-event-page">
                <div className="config_add_group_form">
                    <div className="app_category_head">
                        <p>{currentEventId ? "Edit Event" : "Create Event"}</p>
                    </div>
                    <div className="edit_app_detils_form_cont">
                        <form action="" className="form_up_box">
                            <div className="row col-md-12 m-0" style={{ height: 'auto' }}>
                                <div className="floating-label col-md-6" style={{ display: 'block' }} >
                                    <input
                                        name='eventTitle'
                                        type='text'
                                        placeholder=" "
                                        value={eventTitle}
                                        onChange={handleChange}
                                        className='floating-input'
                                    />
                                    <label>Event Title <span aria-hidden="true" style={{color:'red'}}> *</span></label>
                                </div>
                                <div className="floating-label col-md-6" style={{ display: 'block' }} >
                                    <input
                                        name='description'
                                        type='text'
                                        placeholder=" "
                                        value={eventDescription}
                                        onChange={handleChange}
                                        className='floating-input'
                                    />
                                    <label>Description <span aria-hidden="true" style={{color:'red'}}> *</span></label>
                                </div>
                                <div className="floating-label col-md-12" style={{ display: 'block' }}>
                                    <Select
                                        isClearable
                                        noOptionsMessage={() => null}
                                        name="job"
                                        isMulti
                                        value={jobDetails}
                                        placeholder='Job Id'
                                        styles={portalPageStyles}
                                        options={jobOptions}
                                        backspaceRemovesValue={false}
                                        onChange={handleJobChange}
                                    />
                                    <label className="react-select-label">JOB ID <span aria-hidden="true" style={{color:'red'}}> *</span></label>
                                </div>
                                <div className="floating-label col-md-6 inventory_datetime" style={{ display: 'block' }} >
                                    <span className='datetime-text'>Start Date <span aria-hidden="true" style={{color:'red'}}> *</span></span>
                                    <Datetime
                                        isValidDate={getValidDates}
                                        dateFormat={DATE_FORMAT}
                                        timeFormat={false}
                                        closeOnSelect
                                        value={eventStartDate}
                                        onChange={handleStartDate}
                                    />
                                </div>
                                <div className="floating-label col-md-6 inventory_datetime" style={{ display: 'block' }} >
                                    <span className='datetime-text'>End Date <span aria-hidden="true" style={{color:'red'}}> *</span></span>
                                    <Datetime
                                        isValidDate={getValidDates}
                                        dateFormat={DATE_FORMAT}
                                        timeFormat={false}
                                        closeOnSelect
                                        value={eventEndDate}
                                        onChange={handleEndDate}
                                    />
                                </div>
                                <div className="floating-label col-md-6 inventory_datetime" style={{ display: 'block' }} >
                                    <span className='datetime-text'>Reporting Date <span aria-hidden="true" style={{color:'red'}}> *</span></span>
                                    <Datetime
                                        isValidDate={getValidDates}
                                        dateFormat={DATE_FORMAT}
                                        timeFormat={false}
                                        closeOnSelect
                                        value={reportingDate}
                                        onChange={handleReportingDate}
                                    />
                                </div>
                                <div className="floating-label col-md-6 inventory_datetime" style={{ display: 'block' }} >
                                    <span className='datetime-text'>Reporting Time <span aria-hidden="true" style={{color:'red'}}> *</span></span>
                                    <Datetime
                                        isValidDate={getValidDates}
                                        dateFormat={false}
                                        closeOnSelect
                                        value={reportingDate}
                                        onChange={handleReportingDate}
                                    />
                                </div>
                                <div className="floating-label col-md-6 inventory_datetime" style={{ display: 'block' }} >
                                    <span className='datetime-text'>Last Date To Apply <span aria-hidden="true" style={{color:'red'}}> *</span></span>
                                    <Datetime
                                        isValidDate={getValidDates}
                                        dateFormat={DATE_FORMAT}
                                        timeFormat={false}
                                        closeOnSelect
                                        value={lastDateToApply}
                                        onChange={handleLastDateToApply}
                                    />
                                </div>
                                <div className="floating-label col-md-6" style={{ display: 'block' }} >
                                    <input
                                        name='interviewLocation'
                                        type='text'
                                        placeholder=" "
                                        value={interviewLocation}
                                        onChange={handleChange}
                                        className='floating-input'
                                    />
                                    <label>Interview Location<span aria-hidden="true" style={{color:'red'}}> *</span></label>
                                </div>

                            </div>
                        </form>
                    </div>
                    <div className="cancel_publish_btn">
                        <NavLink to={routes.HIRING_EVENT_LIST.to(orgId, next)}>
                            <button type='button' className="fancy_btn cancel_button">Cancel</button>
                        </NavLink>
                        <button
                            type="button"
                            className="fancy_btn preview_button active"
                            onClick={() => setOpenPreviewModal(true)}
                        >
                            Preview
                        </button>
                        <button
                            type="button"
                            disabled={!(eventTitle && eventDescription && interviewLocation && jobDetails && eventStartDate && eventEndDate && reportingDate && reportingTime && lastDateToApply)}
                            className="fancy_btn active"
                            onClick={handleSubmit}
                        >
                            {currentEventId ? "Save" : "Add"}
                        </button>
                    </div>
                </div>
                {
                    openPreviewModal
                        ? (
                            <EventPreviewer
                                eventId={eventId}
                                payloadData={templateData}
                                openPreviewModal={openPreviewModal}
                                closeModalHandler={() => setOpenPreviewModal(false)}
                            />
                        ) : null
                }
            </div>
        </div>
    )
}

const mapStateToProps = (hiringEvent) => ({
    eventLoader: hiringEvent.loader
})

const mapDispatchToProps = {
    editHiringEvent,
    createHiringEvent,
    addToast
}

export default connect(mapStateToProps, mapDispatchToProps)(CreateEditHiringEvent);