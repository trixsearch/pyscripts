import React, { Component } from 'react';
import { connect } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { Formik } from 'formik';
import * as Yup from 'yup';
import AsyncSelect from 'react-select/async';
import Axios from 'axios';
import Select from "react-select";

import { parseQueryString } from 'containers/utils';
import * as actions from '../../../store/actions/index';
import Spinner from '../../../components/UI/Spinner/Spinner';
import ErrorPage from '../../ErrorPage';
import FormikInput from '../../../components/UI/FormikInput';
import { addToast } from '../../../components/Toast/actions';
import { 
handleUserSearch, handleLocnSearch, DropdownIndicator
} from '../Utils/ConfigUtils';
import { portalPageStyles } from '../Utils/ReactSelectStyles';
import getValidationSchema from '../Utils/SchemaGenerator'

import './css/user.css';
import { mapCustomAttribs, reduceCustomAttribs } from '../Utils/CustomAttribsUtils';
import { HasAccess } from '../../../platformDataStoreContext';
import UnauthorizedPage from '../../UnauthorizedPage';
import { CW_SERVICE_USER_CREATE, CW_SERVICE_USER_UPDATE } from '../../../Data/constants';

const APP_URL = process.env.REACT_APP_APP_URL;

class User extends Component {
    constructor(props) {
        super(props);
        this.dept = React.createRef();
        this.locn = React.createRef();
        this.manager = React.createRef();
        this.part = React.createRef();
        this.state = {
            roles: '',
            email: '',  
            manager: '', 
            userType: '',
            location: '', 
            lastName: '', 
            firstName: '', 
            department: '', 
            status: 'inActive',
            initialStatus: "",
            // roleName: '',
            loader: false,
            password: "",
            confirmPassword: "",
            // partner: '',
            validationSchema: {
                firstName: Yup.string().required(`This Field can't be empty`).min(1),
                lastName: Yup.string().required(`This Field can't be empty`).min(1),
                email: Yup.string().email().required(`This Field can't be empty`),
                // roles: Yup.string().required(`Select atleast one role`)
            },
            passwordSchema: {
                password: Yup.string().when('status', {
                    is: 'active',
                    then: Yup.string().required("Password can't be empty")
                    .min(8, "Password must be atleast 8 characters"),
                    otherwise: Yup.string().nullable(),
                }),
                confirmPassword: Yup.string().when('status', {
                    is: 'active',
                    then: Yup.string().required("Confirm Password can't be empty")
                    .min(8, "Confirm Password must be atleast 8 characters")
                    .oneOf([Yup.ref('password'), ''], "Confirm Password does not match."),
                    otherwise: Yup.string().nullable(),
                })
            },
            components: [],
            lists: {},
            extra_fields: {},
            custom_attribs_loader: false,
            custom_attribs_list_loader: false,
            phoneNumber:'',
            phoneNumberSchema: {
                phoneNumber: Yup.string()
                .test('len', 'Please enter a valid 10 digit phone number', val => { 
                    let valid = true;
                    let phoneno = /^\d{10}$/;
                    if(val) {
                        valid = (val.match(phoneno))
                    }
                    return valid;
                })    
                .nullable()
            }
        }
    }

    componentDidMount() {
        const orgId = this.props.match?.params?.uuid;
        // this.props.getRoles(orgId);
        
        this.setState({
            custom_attribs_loader: true
        })
        Axios.get(`${APP_URL}/${orgId}/config/custom_attribute/get_attribute?type=users`)
        .then(res => {
            let schema = getValidationSchema(res.data.data.components);

            const listComponents = res.data.data.components
            .reduce((acc, component) => {
                if(component.list_type) {
                    return {
                        ...acc,
                        // component.list_type is listID, initializing it with an empty array to it.
                        [component.list_type]: []
                    }
                }
                return acc
            }, {})
            
            if(Object.keys(listComponents).length) {
                this.setState({
                    custom_attribs_list_loader: true
                })
            }

            Object.keys(listComponents).map(listId => {
                Axios.get(`${APP_URL}/${orgId}/lists/${listId}`)
                    .then(resp => {
                        this.setState(prevState => ({
                            lists: {
                                ...prevState.lists,
                            [listId]: resp.data.data.list.map(item => ({label: item.value, value: item.key}))   
                            }
                        }))
                    })
                    .catch(() => { })
                    .finally(() => {
                        this.setState({
                            custom_attribs_list_loader: false
                        })
                    })
                return listId
            })
            this.setState(prevState => ({
                components: res.data.data.components,
                validationSchema: {
                    ...prevState.validationSchema,
                    ...schema
                }
            }))
        })
        .catch(err => {
            if(err && err.response && err.response.data)
                this.props.addToast('error', 'Error', err.response.data.message)
            this.props.addToast('error', 'Error', 'Something went wrong, please try after sometime.')
        })
        .finally(() => {
            this.setState({
                custom_attribs_loader: false
            })
        })
        
        if(this.props.match.params.id !== undefined) {
            this.setState({ userType: 'old', loader: true })
            Axios.get(`${APP_URL}/${orgId}/users/org_users/${this.props.match.params.id}`).then(res => {
                const {
                    email, last_name, first_name, is_active, manager, location, department,
                    extra_fields, mobile
                } = res?.data?.data ?? {};
                let phone_number= mobile && mobile.substring(3);
                this.setState((prevState) => ({
                    email: email,
                    lastName: last_name,
                    firstName: first_name,
                    status: is_active ? 'active' : 'inActive',
                    initialStatus:  is_active, // boolean value
                    manager: manager ? {value: manager.id, label: manager.email} : null,
                    location: location ? {value: location.id, label: location.name} : null,
                    department: department ? { value: department.id, label: department.name} : null,
                    loader: false,
                    passwordSchema: is_active ? {} : prevState.passwordSchema,
                    extra_fields: mapCustomAttribs(extra_fields),
                    phoneNumber:phone_number,
                }))
            })
            .catch(() => this.setState({ error: true, loader: false }))
        }else this.setState({ userType: 'new' })
    }

    setPhoneNumber = (value) => {
        this.setState({
            phoneNumber : value
        })
    }

    createUser = (values, next) => {
        const { 
            firstName, lastName, email, status, manager, department, location, phoneNumber,
            password, confirmPassword, ...custom_attribs
        } = values
        const orgId = this.props.match?.params?.uuid;
        let phone_number = phoneNumber ? `+91${phoneNumber}` : "";
        this.props.createUser(orgId, {
            groups: [],
            email: email.toLowerCase(),
            // roles: [roles],
            middle_name: '',
            employee_id: null,
            last_name: lastName,
            first_name: firstName,
            manager: manager ? manager.value : null,
            location: location ? location.value : null,
            department: department ? department.value : null,
            is_active: status === 'active',
            password,
            extra_fields: reduceCustomAttribs(custom_attribs),
            mobile: phone_number,
            // partner: partner ? partner.value : null
         }, next, this.props.history)
    }

    updateUser = (values, next) => {
        const { 
            firstName, lastName, email, status, manager, department, location, phoneNumber,
            password, confirmPassword, ...custom_attribs
        } = values
        let phone_number = phoneNumber ? `+91${phoneNumber}` : "";
        let updatedUserData = {
            id: this.props.match.params.id,
            data: {
                email: email.toLowerCase(),
                // roles: [roles],
                middle_name: '',
                last_name: lastName,
                first_name: firstName,
                manager: manager ? manager.value : null,
                location: location ? location.value : null,
                department: department ? department.value : null,
                is_active: status === 'active',
                extra_fields: reduceCustomAttribs(custom_attribs),
                mobile: phone_number,
            }
        }
        if(password && status === 'active') {
            updatedUserData.data.password = password;
        }
        
        this.props.editUser(this.props.match?.params?.uuid, updatedUserData, next, this.props.history);
    }

    renderUserForm = () => {
        const { next = 1 } = parseQueryString(this.props.history.location.search)

        const { 
            firstName, lastName, email, status, manager, location, department, roles, loader,
            validationSchema, phoneNumberSchema, components, custom_attribs_loader, custom_attribs_list_loader,
            password, confirmPassword, lists, userType, passwordSchema, phoneNumber
        } = this.state;
        if (this.state.error) {
            return (<ErrorPage/>)
        }  
        
        const custom_attribs_values = components.reduce((acc, comp) => {
            return {
                ...acc,
                [comp.key]: this.state.extra_fields[comp.key] || ''
            }
        }, {});

        let showSetPassword = false;
        const orgId = this.props.match?.params?.uuid;

        return (
            <div id='right_side'>
                {(this.props.loader || loader || custom_attribs_loader || custom_attribs_list_loader) && (<Spinner />)}
                <div className='main_changable_container'>
                    <div className='config_add_user_form config-section-user-form'>
                        <Formik
                            enableReinitialize
                            initialValues={{ 
                                firstName, 
                                lastName, 
                                email,
                                status,
                                manager, 
                                location, 
                                department, 
                                roles,
                                password, 
                                confirmPassword, 
                                phoneNumber, 
                                ...custom_attribs_values
                            }}
                            onSubmit={(values, { setSubmitting }) => {
                                if(this.state.userType === 'new')
                                    this.createUser(values, next);
                                if(this.state.userType === 'old')
                                    this.updateUser(values, next);
                                setSubmitting(false);
                            }}
                            validationSchema={Yup.object().shape({ ...validationSchema, ...passwordSchema, ...phoneNumberSchema })}
                        >
                        {props => {
                            const { 
                                values, touched, errors, isSubmitting, handleChange, handleBlur, 
                                handleSubmit, setFieldValue 
                            } = props;

                            if(userType === 'new') {
                                if(values.status === "active") {
                                    showSetPassword = true;
                                } else {
                                    showSetPassword = false;
                                }
                            } else if(userType === 'old' && !this.state.initialStatus && values.status === "active") {
                                    showSetPassword = true;
                            } else {
                                showSetPassword = false;
                            }

                            return (
                                <div>
                <div className='app_category_head'>
                                <span>{this.state.userType === 'new' ? 'Add Users': 'Edit Users'}</span>
                            </div>
                            <div className='edit_app_detils_form_cont'>
                                <form className='form_up_box row'>
                                    <FormikInput
                                        name='firstName' 
                                        label='First Name'
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        handleChange={handleChange}
                                        handleBlur={handleBlur}
                                        autoComplete="off"
                                        className="col-md-6 mb-10"
                                        disabled={userType === 'old'}
                                    />
                                    <FormikInput
                                        name='lastName' 
                                        label='Last Name'
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        handleChange={handleChange}
                                        handleBlur={handleBlur}
                                        autoComplete="off"
                                        className="col-md-6 mb-10"
                                        disabled={userType === 'old'}
                                    />
                                    {/* <FormikInput
                                        type="email"
                                        name='email'
                                        label='Company Email ID'
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        handleChange={handleChange}
                                        handleBlur={handleBlur}
                                        autoComplete="off"
                                        className="lowercase col-md-6 mb-0"
                                        disabled={userType === 'old'}
                                    /> */}
                                    <FormikInput
                                        name='phoneNumber' 
                                        label='Phone Number'
                                        type="tel"
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        handleChange={(e) => {
                                            handleChange(e);
                                            setFieldValue('phoneNumber', e.target.value.replace(/[^\d]/g, ''));
                                        }}
                                        handleBlur={handleBlur}
                                        autoComplete="off"
                                        className="col-md-6 mb-10"
                                        disabled={userType === 'old'}
                                    />
                                    {/* <div className="floating-label col-md-6 select-role" style={{display: 'block'}}>
                                        <select
                                            className={(errors.roles && touched.roles) ? 'floating-select Invalid' : 'floating-select'}
                                            name="roles"
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            value={values.roles || 'none'}
                                            disabled={this.state.roleName === "Owner"}
                                        >
                                            {!(this.state.roleName === "Owner") 
                                            ? (
                                            <>
                                                <option disabled value="none">Select a Role</option>
                                                {this.props.roles && this.props.roles.map(role => (
                                                    <option key={role.id} value={role.id}>
                                                        {role.name}
                                                    </option>
                                                ))}
                                            </>
                                            ) : <option>Owner</option>}
                                        </select>
                                        <label className="react-select-label">Roles</label>
                                        {(errors.roles && touched.roles)
                                            ? <span className="errorStyle">{errors.roles}</span>
                                            : <span className="errorStyle">&nbsp;</span>
                                        }
                                    </div> */}
                                    <div className="floating-label col-md-6">
                                        <select 
                                            name="status" 
                                            className="floating-select" 
                                            value={values.status} 
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            disabled={(userType === 'old' && this.state.initialStatus)}
                                        >
                                            {(userType === "old" && this.state.initialStatus) ? (
                                                <option>{values.status === 'active' ? "Active" : "Inactive"}</option>
                                            ) : (
                                                <>
                                                    <option value="inActive">Inactive</option>
                                                    <option value="active">Active</option>
                                                </>
                                            )}
                                        </select>
                                        <label className="react-select-label">Status</label>
                                    </div>
                                     {showSetPassword && (
                                        <> 
                                            <FormikInput
                                                name='password' 
                                                label='Password'
                                                type="password"
                                                values={values}
                                                errors={errors}
                                                touched={touched}
                                                handleChange={handleChange}
                                                handleBlur={handleBlur}
                                                autoComplete="off"
                                                className="col-md-6 mb-10"
                                            />
                                            <FormikInput
                                                name='confirmPassword'
                                                type="password"
                                                label='Confirm Password'
                                                values={values}
                                                errors={errors}
                                                touched={touched}
                                                handleChange={handleChange}
                                                handleBlur={handleBlur}
                                                autoComplete="off"
                                                className="col-md-6 mb-10"
                                            />
                                        </>
                                    )}
                                    <div className="floating-label col-md-6">
                                        <AsyncSelect
                                            noOptionsMessage={() => null}
                                            components={{ DropdownIndicator}}
                                            value={values.manager}
                                            placeholder='Search for managers'
                                            styles={portalPageStyles}
                                            loadOptions={(text) => handleUserSearch(orgId, text)}
                                            onChange={option => setFieldValue('manager', option)}
                                            ref={this.manager}
                                            isClearable
                                            openMenuOnFocus       
                                            onFocus={() => {
                                                if(this.manager && this.manager.current ) {
                                                    this.manager.current.select.state.inputValue = values.manager && values.manager.label
                                                }
                                            }}
                                        />
                                        <label className="react-select-label">Manager</label>
                                    </div>
                                    <div className="floating-label col-md-6">
                                        <AsyncSelect
                                            noOptionsMessage={() => null}
                                            components={{ DropdownIndicator}}
                                            value={values.location}
                                            placeholder='Search for locations'
                                            styles={portalPageStyles}
                                            loadOptions={(text) => handleLocnSearch(orgId, text)}
                                            onChange={option => setFieldValue('location', option)}
                                            ref={this.locn}
                                            isClearable
                                            openMenuOnFocus       
                                            onFocus={() => {
                                                if(this.locn && this.locn.current ) {
                                                    this.locn.current.select.state.inputValue = values.location && values.location.label
                                                }
                                            }}
                                        />
                                        <label className="react-select-label">Location</label>
                                    </div>
                                    {/* <div className="floating-label col-md-6">
                                        <AsyncSelect
                                            noOptionsMessage={() => null}
                                            components={{ DropdownIndicator}}
                                            value={values.department}
                                            placeholder='Search for departments'
                                            styles={portalPageStyles}
                                            loadOptions={(text) => handleDeptSearch(orgId, text)}
                                            onChange={option => setFieldValue('department', option)}
                                            ref={this.dept}
                                            isClearable
                                            openMenuOnFocus
                                            onFocus={() => {
                                                let departmentValue = values.department 
                                                if(this.dept && this.dept.current) {
                                                    this.dept.current.select.state.inputValue = departmentValue  
                                                    && departmentValue.label
                                                }
                                            }}
                                        />
                                        <label className="react-select-label">Department</label>
                                    </div> */}
                                    {/* <div className="floating-label col-md-6">
                                        <AsyncSelect
                                            noOptionsMessage={() => null}
                                            components={{ DropdownIndicator}}
                                            value={values.partner}
                                            placeholder='Search for partners'
                                            styles={portalPageStyles}
                                            loadOptions={(text)=>handlePartnerSearch(orgId, text)}
                                            onChange={option => setFieldValue('partner', option)}
                                            ref={this.part}
                                            isClearable
                                            openMenuOnFocus       
                                            onFocus={() => {
                                                let partnerValue = values.partner 
                                                if(this.part && this.part.current) {
                                                    this.part.current.select.state.inputValue = partnerValue  
                                                    && partnerValue.label
                                                }
                                            }}
                                        />
                                        <label className="react-select-label">Partner</label>
                                    </div> */}
                                    {components.map(component => {
                                        let extra_component = null;
                                if(['string', 'date', 'number'].some(type => type === component.type)) {
                                    let type = component.type === 'string' ? 'text' : component.type
                                    extra_component = (
                                        <FormikInput
                                            key={component.label} 
                                            name={component.key}
                                            label={component.label}
                                            type={type}
                                            values={values}
                                            errors={errors}
                                            touched={touched}
                                            handleChange={handleChange}
                                            handleBlur={handleBlur}
                                            autoComplete="off"
                                            className="col-md-6 mb-10"
                                        />
                                    )
                                } else if(component.type === 'list' && Object.keys(lists).length && lists[component.list_type]) {
                                    extra_component = (
                                        <div key={component.label} className="floating-label col-md-6 mb-15 displayBlock">
                                            <Select
                                                name={component.key}
                                                isClearable
                                                isMulti={!!component.isMulti}
                                                value={values[component.key] || ''}
                                                classNamePrefix={(errors[component.key] && touched[component.key]) ? "Invalid " : ''}
                                                noOptionsMessage={() => null}
                                                styles={portalPageStyles}
                                                placeholder=""
                                                onChange={option => setFieldValue(component.key, option)}
                                                onBlur={handleBlur}
                                                options={lists[component.list_type] || []}
                                            />
                                            <label className="react-select-label">{component.key}</label>
                                            {(errors[component.key] && touched[component.key])
                                                ? <span className="errorStyle">{errors[component.key]}</span>
                                                : <span className="errorStyle">&nbsp;</span>
                                            }
                                        </div>
                                    )
                                }
                                return extra_component;
                            })}
                                </form>
                            </div>
                            {(values.status === 'active' && userType !== 'old') && (
                                <span className="user-create-active-alert">
                                    Note: This is not a recommended mode to create user. Please make sure that email ID is correct, as we wont able to reset this user&apos;s password if email ID is not valid.
                                </span>
                            )}
                            <div className='cancel_publish_btn'>
                                <NavLink to={`/custom-workflow/org/${orgId}/config/users?page=${next}`}>
                                    <button type="button" className='fancy_btn'>Cancel</button>
                                </NavLink>
                                <button 
                                    disabled={isSubmitting} 
                                    onClick={handleSubmit} 
                                    type='submit' 
                                    className='fancy_btn active'
                                >
                                    {this.state.userType === 'new' ? `Create` : `Save`}
                                </button>
                            </div>
                            <div>&nbsp;</div>
            </div>
                            );
                        }}
                        </Formik>                        
                    </div>
                </div>
            </div>
        )
    }


    render() {

        return (
            <div>
                {this.state.userType === 'new' && (
                    <HasAccess
                        permissions={[CW_SERVICE_USER_CREATE]}
                        yes={() => (
                            <div>
                                {this.renderUserForm()}
                            </div>
                        )}
                        no={() => (
                            <UnauthorizedPage />
                        )}
                    />
                )}
                {this.state.userType !== 'new' && (
                    <HasAccess
                        permissions={[CW_SERVICE_USER_UPDATE]}
                        yes={() => (
                            <div>
                                {this.renderUserForm()}
                            </div>
                        )}
                        no={() => (
                            <UnauthorizedPage />
                        )}
                    />
                )}
            </div>
        )
    }
}

const mapStateToProps = (state) => ({
    roles: state.users.roles,
    loader: state.users.loader
})

const mapDispatchToProps = {
    addToast,
    getRoles: actions.getRoles,
    editUser: actions.editUser,
    createUser: actions.createUser,
}

export default connect(mapStateToProps, mapDispatchToProps)(User);
