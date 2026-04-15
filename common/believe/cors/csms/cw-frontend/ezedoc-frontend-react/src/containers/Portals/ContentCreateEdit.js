/* eslint-disable no-console */
/* eslint-disable react-hooks/exhaustive-deps */

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { connect } from 'react-redux'
import axios from 'axios'

// import routes from 'urls'
import Spinner from 'components/UI/Spinner/Spinner'
import { addToast } from 'components/Toast/actions'
import { validator, getRegexErrorMessage } from 'containers/utils'
import { HasAccess } from '../../platformDataStoreContext'
import UnauthorizedPage from '../UnauthorizedPage'
import Quill from './Quil_Editor'
import ContentPreview from './contentPreview'
import { CW_SERVICE_CONTENT_CREATE, CW_SERVICE_CONTENT_UPDATE } from '../../Data/constants'

const APP_URL = process.env.REACT_APP_APP_URL;

const ContentCreateEdit = (props) => {
    const [preview, setPreview] = useState(false)
    const [loader, setLoader] = useState(false)
    const [content, setContent] = useState('')
    const [message, setMessage] = useState('')
    const [heading, setHeading] = useState('')
    const [description, setDescription] = useState('')
    const headingValidatorRef = useRef(false)
    
    const { uuid: orgId } = useParams();
    const location = useLocation()
    const isNewContent = useMemo(() => {
        return location.pathname.includes('/create');
    }, [location?.pathname])

    useEffect(() => {
        if (!isNewContent && orgId) {
            setLoader(true)
            const fetchUrl = `${APP_URL}/${orgId}/portal/content/${props.match.params.id}`
            axios.get(fetchUrl)
                .then(response => {
                    const resData = response.data.data
                    setHeading(resData.name)
                    setDescription(resData.description)
                    setContent(resData.content)
                })
                .catch(err => console.log(err))
                .finally(() => setLoader(false))
        }
    }, [orgId])

    const headingChangeHandler = e => {
        setHeading(e.target.value)
        message.length && checkEmptyFields();
        headingValidatorRef.current = validator(e.target.value.trim())
    }

    const checkEmptyFields = () => {
        if (heading === '' || description === '' || content.replaceAll('<p>', '').replaceAll('</p>', '').replaceAll('<br>', '').trim() === '') {
            setMessage('Please make sure all fields are filled');
            window.scrollTo(0, 0)
            return true;
        } else {
            setMessage('')
            return false;
        }
    }

    const closeHandler = () => props.history.push(`/custom-workflow/org/${orgId}/config/contents`)

    const saveHandler = (toPublish = false) => {
        if (checkEmptyFields()) return
        else if (isNewContent) {
            setLoader(true)
            const createUrl = `${APP_URL}/${orgId}/portal/content`
            const payload = {
                'name': heading.trim(),
                'content': content,
                'is_published': toPublish,
                'description': description,
            }
            axios.post(createUrl, payload)
                .then(response => {
                    props.addToast('success', 'Success', response.data.message)
                    closeHandler()
                })
                .catch(error => {
                    props.addToast('error', 'Error', error.response.data.message)
                })
                .finally(() => setLoader(false))
        } else {
            setLoader(true)
            const putUrl = `${APP_URL}/${orgId}/portal/content/${props.match.params.id}`
            const payload = {
                'name': heading,
                'content': content,
                'description': description,
            }
            axios.put(putUrl, payload)
                .then(response => {
                    props.addToast('success', 'Success', response.data.message)
                    closeHandler()
                })
                .catch(error => props.addToast('error', 'Error', error.response.data.message))
                .finally(() => setLoader(false))
        }
    }

    return (
        <div>
            <HasAccess
                permissions={isNewContent ? [CW_SERVICE_CONTENT_CREATE] : [CW_SERVICE_CONTENT_UPDATE]}
                yes={() => (
                    <div>
                            {loader && <Spinner />}
                            
                            {
                                preview && (
                                    <ContentPreview
                                        text={content}
                                        preview={preview}
                                        close={() => setPreview(false)}
                                        heading={heading}
                                        description={description}
                                    />
                                )
                            }
                            {!preview &&
                                    (<div className='main_changable_container'>
                                        <div className='portal_text_editor_container'>
                                            <div className='app_error_msg'>
                                                {message}
                                                {headingValidatorRef.current ? getRegexErrorMessage('heading') : null}
                                            </div>
                                            <div className='portal_text_editor_box'>
                                                <div className='portal_text_editor_heading'>
                                                    <p>{isNewContent ? 'Add New Content' : 'Edit Content'}</p>
                                                </div>
                                                <div className='portal_text_editor_body'>
                                                    <div className='text_editor_input'>
                                                        <input
                                                            type='text'
                                                            value={heading}
                                                            onChange={headingChangeHandler}
                                                            placeholder='Heading e.g., Message, Fun at Work, Policies, Images'
                                                        />
                                                    </div>
                                                    <div className='text_editor_input second'>
                                                        <input
                                                            type='text'
                                                            value={description}
                                                            placeholder='Description'
                                                            onChange={e => {
                                                                message.length && checkEmptyFields();
                                                                setDescription(e.target.value)
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Quill
                                                            text={content}
                                                            preview={preview}
                                                            close={props.close}
                                                            handleChange={value => {
                                                                setContent(value)
                                                                message.length && checkEmptyFields();
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='text_editor_btn_cont'>
                                                <button
                                                    type='button'
                                                    onClick={closeHandler}
                                                    className='fancy_btn cancel_button'
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type='button'
                                                    onClick={() => saveHandler()}
                                                    className='fancy_btn save_button active'
                                                    disabled={headingValidatorRef.current}
                                                >
                                                    Save
                                                </button>
                                                {
                                                    isNewContent
                                                        ? (
                                                            <button
                                                                type='button'
                                                                className='fancy_btn save_button active'
                                                                onClick={() => saveHandler(true)}
                                                                disabled={headingValidatorRef.current}
                                                            >
                                                                Save & Publish
                                                            </button>
                                                        ) : null
                                                }
                                                <button
                                                    type='button'
                                                    className='fancy_btn'
                                                    onClick={() => setPreview(true)}
                                                >
                                                    Preview
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            }
                        </div>
                )}
                no={() => (
                    <UnauthorizedPage />
                )}
            />
        </div>
    )
}

const mapDispatchToProps = {
    addToast
}

export default connect(null, mapDispatchToProps)(ContentCreateEdit)