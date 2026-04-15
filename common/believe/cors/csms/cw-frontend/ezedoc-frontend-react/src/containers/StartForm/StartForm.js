/* eslint-disable react-hooks/exhaustive-deps */

import React, {
    useRef,
    Fragment,
    useState,
    useEffect,
} from 'react'
import axios from 'axios'
import { connect } from 'react-redux'
import { useLocation, useParams } from 'react-router-dom'
import {
    SeparateFiles,
    StorageFileRemover,
    FormCommonOnChange,
} from 'ezereactcomponents/utils/FormioFileDeletionUtils'

import { addToast } from 'components/Toast/actions'
import Spinner from 'components/UI/Spinner/Spinner'
import {
    filterPayloadData,
    submissionTransformer,
    parseQueryString,
} from '../utils'
import CommonStartForm from './CommonStartForm'

import './startForm.css'

const APP_URL = process.env.REACT_APP_APP_URL;
const API_URL = process.env.REACT_APP_API_URL;

const StartForm = props => {
    const [showLoader, setLoader] = useState(false)
    const [formDetails, setFormDetails] = useState({})
    const [keyTypePair, setKeyTypePair] = useState([])
    const [languageData, setLanguageData] = useState();
    const [filesUploaded, setFilesUploaded] = useState(new Set())
    const [fileComponentKeys, setFileComponentKeys] = useState([])
    const [isChangedByUser, setIsChangedByUser] = useState(false)
    const [formKey, setFormKey] = useState();

    const filesUploadedRef = useRef()
    const fileComponentKeysRef = useRef();
    const isChangedByUserRef = useRef()

    const { uuid: orgId } = useParams();

    // eslint-disable-next-line no-return-assign
    const changeFileUploaded = (value) => filesUploadedRef.current = value;
    // eslint-disable-next-line no-return-assign
    const changeFileUploadedKeys = (value) => fileComponentKeysRef.current = value;


    useEffect(() => {
        isChangedByUserRef.current = isChangedByUser

        return () => {
            if(window?.videoStream){
                window?.videoStream?.getTracks()?.[0]?.stop();
            }
        }
    }, [isChangedByUser])

    const location = useLocation()
    const processId = props.match.params.processId

    const {
        txnId = null, // TRANSACTION ID
        // jobId = null,
        eventId = null,
        gap = null,
        // role = null,
        // workLocation = null,
        formOpenSource = null,
        // IsResumeRequired = null,
        next = null
    } = parseQueryString(location.search)

    const closeStartForm = (data = null, isSubmission = false) => {
        let redirectionRoute = `/custom-workflow/org/${orgId}/process`
        if (next && location.pathname.includes('start-new-embedded-process')) {
            redirectionRoute = window.location.search.slice(window.location.search.indexOf("=") + 1)
        }
        else if (location.state) {
            redirectionRoute = isSubmission
                ? location.state.redirectTo
                : location.state.returnBackTo
        }
        // Async file deletion after 'Submit' the form
        if (data && filesUploadedRef.current) {
            const { fileSetToBeDeleted } = SeparateFiles(fileComponentKeysRef.current, filesUploadedRef.current, data)
            StorageFileRemover(fileSetToBeDeleted)
        }
        if (next && location.pathname.includes('start-new-embedded-process')) {
            window.location.href = window.location.origin + '/' + redirectionRoute
        } else props.history.push(redirectionRoute)
    }

    const updateSubmissionData = (data, newData) => {
        return {
            data: {
                ...data,    
                ...newData,
            }
        }
    }

    const fetchFormData = () => {
        setLoader(true)
        let url = `${APP_URL}/${orgId}/apps/start-form/${processId}`
        // let url = `http://localhost:5000/form_mock`
        if (txnId && txnId !== '') url += `?transactionId=${txnId}`
        axios.get(url)
            .then(response1 => {
              let submissionData = response1.data.data
                setFormKey(submissionData.formkey);
                // axios.get(`http://localhost:5000/form_version_mock`)
                axios.get(`${APP_URL}/${orgId}/forms/formversionwrapper?form_key_version=${submissionData.formkey}&transaction_id=${submissionData.data.transaction_id}&get_keytype=true`)
                    .then(response2 => {
                      const formData = response2.data.data
                        const keyTypePairData = response2.data.data.keytypepair
                        let langData = response2.data.data.language_option
                        if(typeof langData === "string"){
                            try {
                              langData = JSON.parse(langData);
                            } catch {
                              langData = {};
                            }
                          }
                        if (langData) {
                            setLanguageData(langData);
                        }

                        const newData = location.state?.data ? { ...location.state?.data } : {};
                        newData.client_info = formData.client_info
                        newData.API_URL = API_URL;
                        newData.tenantId = orgId;
                        // if (jobId) newData.job = jobId
                        if (eventId) newData.hiring_event = eventId
                        // if (role) newData.role = role
                        // if (workLocation) newData.workLocation = workLocation

                        if (gap) {
                            newData.total_positions = gap
                            newData.available_positions = gap
                        }
                        if(formOpenSource) newData.form_open_source = formOpenSource
                        // if(IsResumeRequired !== null) newData.IsResumeRequired = IsResumeRequired
                        submissionData = updateSubmissionData(submissionData.data, newData)

                        let formDetail = {
                            formName: formData.name,
                            formContent: formData.content,
                            formSubmissionData: submissionData,
                            formDescription: formData.description,
                        }
                        setFormDetails(formDetail)
                        setKeyTypePair(keyTypePairData)
                        let appName = null
                        try {
                            appName = location.state.appName || null
                        } catch (err) {
                            // No code
                        }
                        if (appName) props.addToast('info', 'Info', `Starting ${appName}`)
                    })
                    .catch(() => props.addToast('error', 'Error', 'Failed to retrieve form details'))
                    .finally(() => setLoader(false))
            })
            .catch(error => {
                if (error.response) {
                    if (error.response.status === 400) {
                        const appData = processId.length === 36 ? {
                            id: processId
                        } : {
                                app_key: processId
                            }
                        axios.post(`${APP_URL}/${orgId}/apps/${processId}/launch_process`, appData)
                            .then(response => props.addToast('success', 'Success', response.data.message))
                            .catch(() => props.addToast('error', 'Error', 'Something Went Wrong!'))
                    } else if (error.response.data) {
                        if (error.response.data.message) props.addToast('error', 'Error', error.response.data.message)
                    }
                }
                closeStartForm()
                setLoader(false)
            })
    }

    const cleanUpFunction = () => {
        // Async file deletion will be performed only user confirm the prompt when 
        // 1. navigating to other page
        // 2. pressing 'Cancel' button
        if (isChangedByUserRef.current) {
            StorageFileRemover(filesUploadedRef.current)
        }
    }

    // This useEffect only works at the component mount & un-mount
    useEffect(() => {
        fetchFormData()
        return () => cleanUpFunction()
    }, [])
    
    const handleFormSubmission = (data) => {
        setLoader(true)
        const formData1 = data.data
        const submissionData1 = { ...formData1 }
        const filteredVariables = submissionTransformer(formData1, 'start_form')
        const appData = processId.length === 36 ? {
            id: processId,
            variables: filterPayloadData(filteredVariables, keyTypePair)
        } : {
                app_key: processId,
                variables: filterPayloadData(filteredVariables, keyTypePair)
            }

        axios.post(`${APP_URL}/${orgId}/apps/${processId}/launch_process`, appData)
            .then(response => {
                    window.sendEvent(`Hire_${formKey.split('::')[0]}_request`,{
                    Job_Role:appData.variables.role,
                    Job_Location_City:appData.variables.work_city,
                    Vacancies:JSON.stringify(appData.variables.job_work_location),
                    Vendors:JSON.stringify(appData.variables.vendor_work_location)
                })

                props.addToast('success', 'Success', response.data.message)
                setLoader(false)
                setIsChangedByUser(false)
                closeStartForm(appData.variables, true)
            })
            .catch(error => {
                axios.get(`${APP_URL}/${orgId}/apps/start-form/${processId}`)
                    .then(response1 => {
                        let submissionData = response1.data.data
                        axios.get(`${APP_URL}/${orgId}/forms/formversionwrapper?form_key_version=${submissionData.formkey}&transaction_id=${submissionData.data.transaction_id}&get_keytype=true`)
                            .then(response2 => {
                                const formData = response2.data.data
                                const keyTypePairData = response2.data.data.keytypepair
                                submissionData = {
                                    'data': submissionData1
                                }
                                let formDetail = {
                                    formName: formData.name,
                                    formContent: formData.content,
                                    formSubmissionData: submissionData,
                                    formDescription: formData.description,
                                }
                                setFormDetails(formDetail)
                                setKeyTypePair(keyTypePairData)
                            })
                            .catch(() => props.addToast('error', 'Error', 'Failed to retrieve form details'))
                    })
                    .catch(() => props.addToast('error', 'Error', 'Failed to retrieve start-form details'))

                if (error.response && error.response.data.error_code && error.response.data.error)
                    props.addToast('error', 'Error', error.response.data.error.exception)
                else props.addToast('error', 'Error', 'Something Went Wrong!')

                setLoader(false)
            })
    }

    const onChange = e => {
        const isChanged = e.changed
        if (isChanged) {
            const isAutoModified = e.changed.flags.autoModified
            if (!isAutoModified) isChangedByUserRef.current = true;
        }

        FormCommonOnChange(
            e,
            null,
            filesUploaded,
            fileComponentKeys,
            changeFileUploaded,
            changeFileUploadedKeys
        )
    }   

    return (
        <Fragment>
            {showLoader && (<Spinner />)}
            {
                Object.keys(formDetails).length !== 0
                    ? (
                        <CommonStartForm
                            onChange={onChange}
                            close={() => closeStartForm()}
                            handleSubmit={handleFormSubmission}
                            name={formDetails.formName || null}
                            form={formDetails.formContent || null}
                            description={formDetails.formDescription || null}
                            submissionData={formDetails.formSubmissionData || null}
                            languageData={languageData}
                        />
                    ) : null
            }
        </Fragment>
    )
}

const mapDispatchToProps = {
    addToast
}

export default connect(null, mapDispatchToProps)(StartForm)
