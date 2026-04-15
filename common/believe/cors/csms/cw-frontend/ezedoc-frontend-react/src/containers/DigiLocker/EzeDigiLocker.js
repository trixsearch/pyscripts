/* eslint-disable react-hooks/exhaustive-deps */
import React, {
    useState, useEffect, useRef, Fragment
} from 'react'
import { useLocation } from 'react-router-dom'
import axios from 'axios'

import { parseQueryString } from 'containers/utils'
import Spinner from 'components/UI/Spinner/Spinner'
import { Button } from 'components/UI/AppButton/AppButton'

import DlBg from '../../assets/images/dl_bg.svg'
import ErrorImg from '../../assets/images/svg/reject.svg'
import Logo from '../../assets/images/ezedox-white.svg'
import WarningImg from '../../assets/images/warning.png'
import SuccessImg from '../../assets/images/svg/success-copy.svg'

import './EzeDigiLocker.css'

const EzeDigiLocker = () => {
    const [time, setTime] = useState(null)
    const [error, setError] = useState(null)
    const [loader, setLoader] = useState(false)
    const [parsedData, setParsedData] = useState(null)
    const [responseData, setResponseData] = useState(null)
    // const [encodedResponse, setEncodedResponse] = useState(null)
    const [dlStyle, setDlStyle] = useState({})

    const countDownTimer = useRef()

    const location = useLocation()
    const {
        code, // DIGILOCKER AUTHORIZATION CODE
        state, // REDIRECTED STATE
        tId, // TASK ID
        txnId, // TRANSACTION ID
        tenant, // TENANT NAME
        formType, // FORM TYPE (START FORM, TASK FORM, ...)
        docType, // TYPES OF DOCUMENTS
        theme, // TENANT THEME
        pan, // Pan No
        drivingLicense, // Driving License No
        entity_name, // Entity Name
        reg_no, // Vehicle Reg No
        chasis_no, // Vehicle Chassis No
        workflowId, // WORKFLOW ID
        error: digiLockerError = null, // ERROR FROM DIGILOCKER
    } = parseQueryString(location.search)

    const handleReturnBackToTask = (sendTxnId = true) => {
        if (parsedData) {
            if (parsedData.tId && parsedData.tenant && parsedData.formType) {
                let url = `${window.location.protocol}//${parsedData.tenant}.${window.location.hostname}/${parsedData.formType}/${parsedData.tId}`

                if (sendTxnId) url += `?txnId=${parsedData.txnId}`

                // Enable the following line or append the enc_res query param with value if Encoded response data is needed
                // url += `&enc_res=${encodedResponse}`

                window.open(url, '_parent')
            }
        }
    }

    const closeTab = () => window.close()

    const timer = () => {
        countDownTimer.current = setInterval(() => {
            if (time <= 0) {
                clearInterval(countDownTimer.current)
                handleReturnBackToTask()
            } else setTime(time - 1)
        }, 1000)
    }

    useEffect(() => {
        timer()
        return () => {
            clearInterval(countDownTimer.current)
        }
    }, [time])

    useEffect(() => {
        if (digiLockerError && state) {
            const decodedRedirectedState = decodeURI(state)
            const parsedRedirectedState = JSON.parse(decodedRedirectedState)

            setParsedData(parsedRedirectedState)
        }

        if (theme) {
            const decodedTheme = decodeURIComponent(theme)
            const parsedTheme = JSON.parse(decodedTheme)
            setDlStyle(parsedTheme)
        }

        if (code) {
            if (state) {
                const decodedRedirectedState = decodeURI(state)
                const parsedRedirectedState = JSON.parse(decodedRedirectedState)

                const payload = {
                    code,
                    transactionId: parsedRedirectedState.txnId || '',
                    tenant_name: parsedRedirectedState.tenant || '',
                    doc_type: parsedRedirectedState.docType.split(',') || [],
                    pan: parsedRedirectedState.pan || '',
                    drivingLicense: parsedRedirectedState.drivingLicense || '',
                    entity_name: parsedRedirectedState.entity_name || '',
                    reg_no: parsedRedirectedState.reg_no || '',
                    chasis_no: parsedRedirectedState.chasis_no || '',
                    workflow_id: parsedRedirectedState.workflowId || '',
                }

                setLoader(true)

                axios.post('/api/proxy-apps/get_dl_info', payload)
                    .then(response => {
                        // const stringifiedResponseData = JSON.stringify(response.data.data)
                        // const encodedResponseData = encodeURIComponent(stringifiedResponseData)

                        setLoader(false)
                        setResponseData(response.data.data)
                        setParsedData(parsedRedirectedState)
                        // setEncodedResponse(encodedResponseData)

                        if (!parsedRedirectedState.workflowId && parsedRedirectedState.tId) {
                            // Start Timer
                            setTime(5)
                        }
                    })
                    .catch(err => {
                        setLoader(false)
                        setError(err.response.data.message)
                    })
            }
        }
    }, [])

    const handleProceedDigiLocker = () => {
        const clientID = process.env.REACT_APP_DIGILOCKER_CLIENT_ID || ''
        const currentHref = window.location.href
        const redirectURI = currentHref.includes('?') ? currentHref.substring(0, currentHref.indexOf('?')) : currentHref

        const redirectStateObj = {
            tId: tId || '',
            txnId: txnId || '',
            tenant: tenant || '',
            formType: formType || '',
            docType: docType || '',
            pan: pan || '',
            drivingLicense: drivingLicense || '',
            entity_name: entity_name || '',
            reg_no: reg_no || '',
            chasis_no: chasis_no || '',
            workflowId: workflowId || '',
        }
        const stringifiedRedirectState = JSON.stringify(redirectStateObj)
        const encodedRedirectState = encodeURI(stringifiedRedirectState)
        const doubleEncodedRedirectState = encodeURI(encodedRedirectState)

        const url = `https://api.digitallocker.gov.in/public/oauth2/1/authorize?response_type=code&dl_flow=signup&client_id=${clientID}&redirect_uri=${redirectURI}&state=${doubleEncodedRedirectState}`

        window.open(url, '_self')
    }

    let currentTenant = ''
    try {
        if (tenant) currentTenant = tenant
        else currentTenant = parsedData.tenant || ''
    } catch {
        // No Code
    }

    const statement = `By proceeding further I hereby authorize ezeDox to pull my documents from DigiLocker and share with ${currentTenant}`

    let content = null
    let isRequest = false
    let status = ''
    let statusImg = null
    let statusStyle = {}

    // Content
    if (digiLockerError) {
        status = 'error'
        isRequest = false
        content = 'Unable to fetch documents'
    } else if (error) {
        status = 'error'
        isRequest = false
        content = error
    } else if ((tId && txnId && tenant && !code) || (workflowId && tenant && !tId && !txnId && !code)) {
        isRequest = true
    } else if (!tId && !txnId && !tenant && code) {
        status = 'success'
        isRequest = false
    } else if (tId === undefined && txnId === undefined && tenant === undefined && code === '') {
        status = 'warn'
        isRequest = false
        content = 'You aren\'t authorized'
    } else if (
        (tId === '' && txnId === '' && tenant === '' && code === undefined)
        || ((tId === undefined && txnId === undefined && tenant === undefined) || code === undefined)
    ) {
        status = 'warn'
        isRequest = false
        content = 'Something went wrong'
    } else {
        status = 'warn'
        isRequest = false
        content = 'Something went wrong'
    }

    // Status
    if (status === 'warn') {
        statusStyle = {
            width: 100
        }
        statusImg = WarningImg
    } else if (status === 'error') {
        statusStyle = {
            width: 100
        }
        statusImg = ErrorImg
    }

    let content1 = null
    let content2 = null
    let content3 = null
    let content4 = null

    if (responseData) {
        if (responseData.aadhaar_response) {
            content1 = (
                <div className='digi-response-status'>
                    <img className='digi-response-status-img' src={responseData.aadhaar_response.success ? SuccessImg : ErrorImg} alt='status' />
                    <div>{responseData.aadhaar_response.message}</div>
                </div>
            )
        }
        if (responseData.pan_response) {
            content2 = (
                <div className='digi-response-status'>
                    <img className='digi-response-status-img' src={responseData.pan_response.success ? SuccessImg : ErrorImg} alt='status' />
                    <div>{responseData.pan_response.message}</div>
                </div>
            )
        }
        if (responseData.dl_response) {
            content3 = (
                <div className='digi-response-status'>
                    <img className='digi-response-status-img' src={responseData.dl_response.success ? SuccessImg : ErrorImg} alt='status' />
                    <div>{responseData.dl_response.message}</div>
                </div>
            )
        }
        if (responseData.rc_response) {
            content4 = (
                <div className='digi-response-status'>
                    <img className='digi-response-status-img' src={responseData.rc_response.success ? SuccessImg : ErrorImg} alt='status' />
                    <div>{responseData.rc_response.message}</div>
                </div>
            )
        }
    }

    const buttonHandler = () => {
        if (parsedData) {
            if (parsedData.workflowId) closeTab()
            else handleReturnBackToTask(false)
        }
    }
    
    const buttonTextFiller = () => {
        let btnText = 'Go back'
        if (parsedData) {
            if (parsedData.workflowId) btnText = 'Close this window'
        }
        return btnText
    }

    const pageContent = (
        <div className='eze-digilocker-container'>
            <div
                className='eze-digilocker-container-left'
                style={dlStyle !== {} ? { backgroundImage: `linear-gradient(116deg, ${dlStyle.first_primary_color}, ${dlStyle.second_primary_color})` } : {}}
            >
                <img src={DlBg} alt='DlBg' />
            </div>
            <div className='eze-digilocker-container-right'>
                <div className='digi-card'>
                    <div className='digi-title'>DigiLocker KYC</div>
                    {
                        isRequest && (
                            <div className='digi-statement'>{statement}</div>
                        )
                    }
                    {
                        !isRequest && status !== 'success' && (
                            <img style={statusStyle} src={statusImg} alt='status' />
                        )
                    }
                </div>
                {
                    isRequest && (
                        <Button
                            variant='primary'
                            onClick={() => handleProceedDigiLocker()}
                            customStyle={dlStyle !== {} ? { backgroundImage: `linear-gradient(116deg, ${dlStyle.first_button_color}, ${dlStyle.second_button_color})` } : {}}
                        >
                            Proceed
                        </Button>
                    )
                }
                {
                    !isRequest && content && (
                        <div className='digi-common-status'>{content}</div>
                    )
                }
                {
                    !isRequest && status === 'success' && responseData
                        ? (
                            <Fragment>
                                {content1}
                                {content2}
                                {content3}
                                {content4}
                            </Fragment>
                        )
                        : null
                }
                {
                    !isRequest && status === 'success' && responseData && parsedData
                        ? !parsedData.workflowId && parsedData.tId && (
                            <div className='digi-timer'>
                                <span>
                                    Redirecting in
                                    &nbsp;
                                <strong>{time}</strong>
                                    &nbsp;
                                    seconds
                                </span>
                            </div>
                        )
                        : null
                }
                {
                    digiLockerError
                        ? (
                            <Button
                                variant='primary'
                                onClick={() => buttonHandler()}
                                customStyle={dlStyle !== {} ? { backgroundImage: `linear-gradient(116deg, ${dlStyle.first_button_color}, ${dlStyle.second_button_color})`, marginTop: 10 } : {}}
                            >
                                {buttonTextFiller()}
                            </Button>
                        )
                        : null
                }
                {
                    !isRequest && responseData && parsedData
                        ? parsedData.workflowId && !parsedData.tId && (
                            <Button
                                variant='primary'
                                onClick={() => closeTab()}
                                customStyle={dlStyle !== {} ? { backgroundImage: `linear-gradient(116deg, ${dlStyle.first_button_color}, ${dlStyle.second_button_color})`, marginTop: 10 } : {}}
                            >
                                Close this window
                            </Button>
                        ) : null
                }
                <div className='eze-digi-logo'>
                    <span>Powered by&nbsp;</span>
                    <img src={Logo} alt='ezedox-logo' />
                </div>
            </div>
        </div>
    )

    return (
        <div className='eze-digilocker-page'>
            {loader && <Spinner />}

            {loader ? null : pageContent}
        </div>
    )
}

export default EzeDigiLocker
