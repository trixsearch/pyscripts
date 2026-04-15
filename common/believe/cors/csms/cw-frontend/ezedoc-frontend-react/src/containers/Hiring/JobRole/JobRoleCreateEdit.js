import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { connect } from 'react-redux'
import axios from 'axios'
import { Select, Input } from 'antd';
import routes from 'urls'
import Spinner from 'components/UI/Spinner/Spinner'
import { addToast } from 'components/Toast/actions'
import { parseQueryString, getRegexErrorMessage } from 'containers/utils'
import {
    createJobRole,
    editJobRole,
} from 'store/actions/index'
import Quill from '../../Portals/Quil_Editor'
import ContentPreview from '../../Portals/contentPreview';
import { getRoles, getDefaultRoles } from './helpers';

import './JobRole.css'
import TagSearch from '../../../components/TagSearch/TagSearch';
import { SearchOutlined } from '@ant-design/icons';

const APP_URL = process.env.REACT_APP_APP_URL;
const { Option } = Select;
const { TextArea } = Input;


const CreateEditJobRole = props => {
  
    const [loader, setLoader] = useState(false)
    const [content, setContent] = useState('')
    const [preview, setPreview] = useState(false)
    const [roles, setRoles] = useState([]);
    const [defaultRoles, setDefaultRoles] = useState([]);
    const [initialData, setInitialData] = useState();
    const [state, setState] = useState({
        name: '',
        platform_role_id: '',
        default_role: null,
    });
    const headingValidatorRef = useRef(false)

    const currentJobRoleId = props.match.params.id || null
    const location = useLocation()
    const { next = 1 } = parseQueryString(location.search)
    const { uuid: orgId } = useParams();

    const {
        history,
        addToaster,
        createRole,
        updateRole,
        jobRoleLoader,
    } = props

    useEffect(() => {
        fetchDefaultRole();
        if (currentJobRoleId) {
            setLoader(true)
            axios.get(`${APP_URL}/${orgId}/jobs/role/${currentJobRoleId}`)
                .then(res => res.data.data)
                .then(data => {
                    setContent(data.description)
                    setState({ platform_role_id: data.platform_role_id, default_role: data.default_role, name: data.name });
                    const resData = {
                        name: data.name,
                        description: data.description,
                        platform_role_id: data.platform_role_id,
                        default_role: data.default_role,
                    };
                    setInitialData(resData)
                })
                .catch((error) => {
                    const errors = Object.values(error.response.data?.error);
                    if (error.response) addToaster('error', 'Error', errors.length ? errors[0] : error.response.data.message)
                    else addToaster('error', 'Error', 'Something went wrong')
                })
                .finally(() => setLoader(false))
        }
    }, [])

    const closeHandler = () => history.push(routes.JOB_ROLE_LIST.to(orgId, next))

    const payload = {
        name: state.name,
        description: content,
        platform_role_id: state.platform_role_id,
        default_role: state.default_role,
    }
    const isEmpty = !!Object.values(state)?.filter(a => !a)?.length;
    const saveHandler = () => {
        if (currentJobRoleId) updateRole(orgId, currentJobRoleId, payload, history, next)
        else createRole(orgId, payload, history, next)
    }
    const onChange = (value) => {
        setState({ ...state, default_role: value });
        let selectedRole = defaultRoles?.find(a=>a.id==value);
        selectedRole && setContent(selectedRole.description);
    };

    const fetchDefaultRole = async (e) => {
        let response = await getDefaultRoles(orgId, e);
        if (response.length) {
            setDefaultRoles([...response]);
        } else {
            setDefaultRoles([]);
        }
    };

    const searchRole = async (e) => {
        if (!e) return setRoles([]);
        let response = await getRoles(e, orgId);
        if (response.length) {
            setRoles([...response]);
        } else {
            setRoles([]);
        }
    };

    const changeRoles = (e) => {
        if (!e) return setState({ ...state, platform_role_id: null, name: null })
        let role = e.find(a => a.type === 'role');
        if (!role) role = e.find(a => a.type === 'function');
        setState({ ...state, platform_role_id: role?.uuid, name: role?.name })
    };

    return (
        <div>

            {(jobRoleLoader || loader) && <Spinner />}

            {
                preview ? (
                    <ContentPreview
                        text={content}
                        preview={preview}
                        close={() => setPreview(false)}
                    />
                ) : (
                    <div className='main_changable_container'>
                        <div className='job-role-create-edit-page'>
                            {headingValidatorRef.current && <div className='app_error_msg'>
                                {headingValidatorRef.current ? getRegexErrorMessage('heading') : null}
                            </div>}
                            <div >
                                <div className='job-role-edit-heading'>
                                    <p>{currentJobRoleId ? 'Edit roles and responsibilities' : 'Add new roles and responsibilities'}</p>
                                </div>
                                <div className='portal_text_editor_body'>
                                    <div className='form-group'>
                                        <p className='job-role-form-label'>Select platform role</p>
                                        <TagSearch
                                            onChange={changeRoles}
                                            onSearch={searchRole}
                                            data={roles}
                                            size={'large'}
                                            className={'jobRoleSelect'}
                                            label={"Search a role"}
                                            defaultValue={state.name} />
                                    </div>  
                                   
                                    <div className='form-group'>
                                        <p className='job-role-form-label'>Select default role</p>
                                        <Select
                                            showSearch
                                            placeholder="Search a default role"
                                            optionFilterProp="children"
                                            className="job-role-select-2"
                                            onChange={onChange}
                                            onSearch={fetchDefaultRole}
                                            suffixIcon={() => <SearchOutlined />}
                                            value={state.default_role}
                                            size="large"
                                            notFoundContent={null}
                                            disabled={initialData?.platform_role_id===null}
                                        >
                                            {defaultRoles.map((item) => <Option value={item.id}>{item.name}</Option>)}
                                        </Select>
                                    </div>
                                    
                                    <div className='form-group'>
                                        <p className='job-role-form-label'>Add description</p>
                                        <div className='job-role-quill-container'>
                                            <Quill
                                                text={content}
                                                preview={preview}
                                                close={props.close}
                                                handleChange={value => setContent(value)}
                                            />
                                        </div>
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
                                    onClick={() => {
                                        currentJobRoleId ? window.sendEvent("Hire_Complete_job_role_edit",{
                                            Job_role_added:state.name
                                            }) : window.sendEvent("Hire_Completely_added_job_role",{
                                                Job_role_added:state.name
                                                })
                                        saveHandler()
                                    }}
                                    className='fancy_btn save_button active'
                                    disabled={
                                        isEmpty || JSON.stringify(initialData) === JSON.stringify(payload)
                                    }
                                >
                                    Save
                                </button>
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
    )
}

const mapStateToProps = (jobRole) => ({
    jobRoleLoader: jobRole.loader
})

const mapDispatchToProps = {
    createRole: createJobRole,
    updateRole: editJobRole,
    addToaster: addToast,
}

export default connect(mapStateToProps, mapDispatchToProps)(CreateEditJobRole)