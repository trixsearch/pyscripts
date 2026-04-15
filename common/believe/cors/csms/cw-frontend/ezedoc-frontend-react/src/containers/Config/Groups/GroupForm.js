import React, { Component } from 'react';
import { NavLink, withRouter } from 'react-router-dom';
import Axios from 'axios';
import { Formik } from 'formik';
import * as Yup from 'yup';
import AsyncSelect from 'react-select/async';

import { getRegexErrorMessage } from 'containers/utils';
import ErrorPage from '../../ErrorPage';
import { DropdownIndicator, handleGroupSearch, handleUserSearch } from '../Utils/ConfigUtils';
import { GROUP_FILTER_FIELDS, SPECIAL_CHARACTERS_ERROR_REGEX } from "../../../Data/constants"
import { reactSelectStyles, copyUsersStyles } from '../Utils/ReactSelectStyles';
import FormikInput from '../../../components/UI/FormikInput';
import '../Users/css/user.css';
import { Button } from '../../../components/UI/AppButton/AppButton';
import Spinner from '../../../components/UI/Spinner/Spinner';
import './Group.css'

const APP_URL = process.env.REACT_APP_APP_URL;

class GroupForm extends Component {
    constructor(props) {
        super(props)
        this.state = {
            name: "",
            users: [],
            copyGroups: [],
            loader: false,
            error: false,
            filterBy: "",
            choices: []
        }
    }

    componentDidMount() {
        const { edit, id, match } = this.props;
        const orgId = match?.params?.uuid;
        const keyChoice = GROUP_FILTER_FIELDS
        this.setState({
            choices: keyChoice
        })

        // Axios.get(`${APP_URL}/${orgId}/config/custom_attribute/get_attribute?type=users`)
        //     .then(res => {
        //         const listComponents = res.data.data.components
        //         if (listComponents.length) {
        //             const keyData = listComponents.map(attrib => {
        //                 return { "key": attrib.key, "label": attrib.label }
        //             })
        //             this.setState({
        //                 choices: [...keyChoice, ...keyData]
        //             })
        //         } else {
        //             this.setState({
        //                 choices: keyChoice
        //             })
        //         }
        //     }).catch(() => {
        //         this.setState({ error: true })
        //     })

        if (edit && id) {
            this.setState({
                loader: true
            })
            Axios.get(`${APP_URL}/${orgId}/groups/${id}`)
                .then(res => {
                    this.setState({
                        name: res.data.data.name,
                        filterBy: res.data.data.filter_by,
                        users: res.data.data.users.map(user => (
                            { value: user.id, label: user.email }
                        )),
                        loader: false
                    })
                })
                .catch(() => {
                    this.setState({ error: true, loader: false })
                })
        }
    }

    handleSubmit = (values) => {
        const { 
            name, users, copyGroups, filterBy 
        } = values;
        let groupUsers = [
            // To get users id, who are selected by email id
            ...users.map(user => (user.value))];

        if (copyGroups.length) {
            let allUsers = [
                ...groupUsers,

                // To get users id, from existing groups 
                // => (a group can be created with users of one or more existing groups)
                ...copyGroups.reduce((acc, value) => (
                    [...acc, ...value.users.map(user => (user.id))]
                ), [])]

            groupUsers = [...new Set(allUsers)]
            this.props.saveGroup({ name: name.trim(), users: groupUsers, filterBy })

        } else {
            this.props.saveGroup({ name: name.trim(), users: groupUsers, filterBy })
        }
    }

    render() {
        const {
            users, copyGroups, name, loader, error, filterBy,
        } = this.state;
        const orgId = this.props.match?.params?.uuid;

        if (error) {
            return (<ErrorPage />)
        }
        return (
            <Formik
                enableReinitialize
                initialValues={{
                    name, users, copyGroups, filterBy 
                }}
                onSubmit={(values) => {
                    this.handleSubmit(values)
                }}
                validationSchema={Yup.object().shape({
                    name: Yup.string()
                        .required(`Group Name can't be empty`)
                        .matches(SPECIAL_CHARACTERS_ERROR_REGEX, { message: getRegexErrorMessage('group name'), excludeEmptyString: true }),
                    users: Yup.array().when('copyGroups', {
                        // val is copyGroups array and we check if it is empty
                        is: (val) => val.length,
                        then: Yup.array().nullable(),
                        otherwise: Yup.array().required('A Group must have atleast one user.').nullable() 
                    }),
                    copyGroups: Yup.array().nullable()
                })}
            >
                {props => {
                    const {
                        values, touched, errors, handleChange, handleBlur, handleSubmit,
                        setFieldValue
                    } = props;
                    return (
                        <>
                            <div className="edit_app_detils_form_cont">
                                <form className="form_up_box">
                                    {loader && <Spinner />}
                                    <div className="row col-md-12 m-0" style={{ height: 'auto' }}>
                                        <FormikInput
                                            name="name"
                                            label="Group Name"
                                            values={values}
                                            errors={errors}
                                            touched={touched}
                                            handleChange={handleChange}
                                            handleBlur={handleBlur}
                                            className="col-md-6 mb-15"
                                            autoComplete="off"
                                            disabled={true}
                                        />
                                        <div className="floating-label col-md-6 displayBlock">
                                            <AsyncSelect
                                                noOptionsMessage={() => null}
                                                components={{ DropdownIndicator }}
                                                value={values.copyGroups}
                                                isMulti
                                                name="head"
                                                placeholder='Search to copy users from existing groups'
                                                styles={copyUsersStyles}
                                                loadOptions={(text) => handleGroupSearch(orgId, text)}
                                                onInputChange={this.handleInputChange}
                                                onBlur={handleBlur}
                                                backspaceRemovesValue={false}
                                                onChange={option => setFieldValue('copyGroups', option)}
                                                isDisabled={true}
                                            />
                                            <label className="react-select-label">Groups</label>
                                            {(errors.head && touched.head) && (
                                                <span className="errorStyle">
                                                    {errors.head}
                                                </span>
                                            )}
                                        </div>
                                        <div className="floating-label col-md-12 displayBlock">
                                            <AsyncSelect
                                                noOptionsMessage={() => null}
                                                components={{ DropdownIndicator }}
                                                value={values.users}
                                                isMulti
                                                name="users"
                                                classNamePrefix={(errors.users && touched.users) ? "Invalid " : ''}
                                                placeholder='Search for users using email id'
                                                styles={reactSelectStyles}
                                                loadOptions={(text) => handleUserSearch(orgId, text)}
                                                onInputChange={this.handleInputChange}
                                                onBlur={handleBlur}
                                                backspaceRemovesValue={false}
                                                onChange={option => setFieldValue('users', option)}
                                            />
                                            <label className="react-select-label">Users</label>
                                            {(errors.users && touched.users) && (
                                                <span className="errorStyle">
                                                    {errors.users}
                                                </span>
                                            )}
                                        </div>
                                        <div className="floating-label col-md-6">
                                            <select
                                                name="filterBy"
                                                className="floating-select"
                                                value={values.filterBy || 'none'}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            >
                                                <option disabled value="none">Select a filter</option>
                                                {this.state.choices 
                                                 && this.state.choices.map(choice => (
                                                    <option key={choice.key} value={choice.key}>
                                                        {choice.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <label>Filter By</label>
                                        </div>
                                        <div className="floating-label col-md-6 group-clear-text">
                                            <Button 
                                                onClick={() => setFieldValue('filterBy', null)}
                                                variant="link"
                                            >
                                                Clear Filter
                                            </Button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="cancel_publish_btn">
                                <NavLink to={`/custom-workflow/org/${orgId}/config/groups?page=${this.props.next}`}>
                                    <button
                                        type="button"
                                        className="fancy_btn cancel_button"
                                    >
                                        Cancel
                                    </button>
                                </NavLink>
                                <Button
                                    variant="primary"
                                    onClick={handleSubmit}
                                >
                                    Save
                                </Button>
                            </div>
                        </>
                    )
                }}
            </Formik>
        )
    }
}

export default withRouter(GroupForm);