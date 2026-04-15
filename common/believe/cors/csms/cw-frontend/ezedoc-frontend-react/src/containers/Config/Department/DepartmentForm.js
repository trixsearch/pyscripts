/* eslint-disable no-shadow */
import React, { Component } from "react";
import { connect } from "react-redux";
import { NavLink, withRouter } from 'react-router-dom';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Axios from "axios";
import AsyncSelect from 'react-select/async';
import Select from 'react-select';

import { SPECIAL_CHARACTERS_ERROR_REGEX } from "Data/constants";
import { getRegexErrorMessage, parseQueryString } from "containers/utils";
import { handleUserSearch, DropdownIndicator } from '../Utils/ConfigUtils';
import { portalPageStyles } from '../Utils/ReactSelectStyles';
import Spinner from '../../../components/UI/Spinner/Spinner';
import FormikInput from "../../../components/UI/FormikInput";
import ErrorPage from "../../ErrorPage";
import { addToast } from '../../../components/Toast/actions';
import getValidationSchema from "../Utils/SchemaGenerator";
import '../Users/css/user.css';
import { mapCustomAttribs, reduceCustomAttribs } from "../Utils/CustomAttribsUtils";

const APP_URL = process.env.REACT_APP_APP_URL;

class DepartmentForm extends Component {
    constructor(props) {
        super(props);
        this.head = React.createRef();
        this.state = {
            name: "",
            head: "",
            error: false,
            editLoader: false,
            validationSchema: {
                name: Yup.string().required(`Department Name can't be empty`)
                    .matches(SPECIAL_CHARACTERS_ERROR_REGEX, { message: getRegexErrorMessage('department name'), excludeEmptyString: true }),
                head: Yup.string().required('Select Department Head').nullable()
            },
            components: [],
            lists: {},
            extra_fields: {},
            custom_attribs_loader: false,
            custom_attribs_list_loader: false
        }
    }

    componentDidMount() {
        const { id, edit, match } = this.props;
        const orgId = match?.params?.uuid;

        this.setState({
            custom_attribs_loader: true
        });

        Axios.get(`${APP_URL}/${orgId}/config/custom_attribute/get_attribute?type=departments`)
            .then(res => {
                let schema = getValidationSchema(res.data.data.components);

                const listComponents = res.data.data.components
                    .reduce((acc, component) => {
                        if (component.list_type) {
                            return {
                                ...acc,
                                // component.list_type is listID, initializing it with an empty array to it.
                                [component.list_type]: []
                            }
                        }
                        return acc
                    }, {})

                if (Object.keys(listComponents).length) {
                    this.setState({
                        custom_attribs_list_loader: true
                    })
                }

                Object.keys(listComponents).map(listId => {
                    Axios.get(`${APP_URL}/${this.props.orgId}/lists/${listId}`)
                        .then(res => {
                            this.setState(prevState => ({
                                lists: {
                                    ...prevState.lists,
                                    [listId]: res.data.data.list.map(item => ({ label: item.value, value: item.key }))
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
                if (err && err.response && err.response.data)
                    this.props.addToast('error', 'Error', err.response.data.message)
                this.props.addToast('error', 'Error', 'Something went wrong, please try after sometime.')
            })
            .finally(() => {
                this.setState({
                    custom_attribs_loader: false
                })
            })

        if (edit && id) {
            this.setState({ editLoader: true })
            Axios.get(`${APP_URL}/${this.props.orgId}/departments/${this.props.id}`).then(response => {
                this.setState({
                    name: response.data.data.name,
                    head: { value: response.data.data.head.id, label: response.data.data.head.email },
                    extra_fields: mapCustomAttribs(response.data.data.extra_fields)
                })
            })
                .catch(() => this.setState({ error: true })).finally(() => {
                    this.setState({ editLoader: false })
                })
        }

    }

    handleSubmit = (name, head, extra_fields) => {
        if (this.state.name === name) {
            this.props.saveData("", head, extra_fields);
        } else {
            this.props.saveData(name, head, extra_fields);
        }
    }

    render() {
        const {
            lists, name, head, error, editLoader, validationSchema,
            components, custom_attribs_loader, custom_attribs_list_loader,
            extra_fields
        } = this.state;

        const { loader, match } = this.props;
        const orgId = match?.params?.uuid;


        const { next = 1 } = parseQueryString(this.props.history.location.search);

        const custom_attribs_values = components.reduce((acc, comp) => {
            return {
                ...acc,
                [comp.key]: extra_fields[comp.key] || ''
            }
        }, {})


        if (error) {
            return (<ErrorPage />);
        }

        return (
            <Formik
                enableReinitialize
                initialValues={{ name, head, ...custom_attribs_values }}
                onSubmit={(values) => {
                    const { name, head, ...extra_fields } = values;

                    this.handleSubmit(name.trim(), head.value, reduceCustomAttribs(extra_fields))
                }}
                validationSchema={Yup.object().shape({ ...validationSchema })}
            >
                {props => {
                    const {
                        values, touched, errors, handleChange, handleBlur, handleSubmit,
                        setFieldValue
                    } = props;
                    return (
                        <form>
                            {(loader || editLoader || custom_attribs_loader || custom_attribs_list_loader) && (<Spinner />)}
                            <div className="edit_app_detils_form_cont config-section-form">
                                <div className="form_up_box row ">
                                    <FormikInput
                                        name="name"
                                        label="Department Name"
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        handleChange={handleChange}
                                        handleBlur={handleBlur}
                                        className="col-md-6 mb-10"
                                        autoComplete="off"
                                    />
                                    <div className="floating-label col-md-6 displayBlock" >
                                        <AsyncSelect
                                            noOptionsMessage={() => null}
                                            components={{ DropdownIndicator }}
                                            value={values.head}
                                            name="head"
                                            placeholder='Search for users by email id'
                                            styles={portalPageStyles}
                                            loadOptions={(text) => handleUserSearch(this.props.orgId, text)}
                                            onInputChange={this.handleInputChange}
                                            onBlur={handleBlur}
                                            classNamePrefix={(errors.head && touched.head) ? "Invalid " : ''}
                                            ref={this.head}
                                            isClearable
                                            openMenuOnFocus
                                            onFocus={() => {
                                                if (this.head && this.head.current) {
                                                    this.head.current.select.state.inputValue = values.head && values.head.label
                                                }
                                            }}
                                            onChange={option => setFieldValue('head', option)}
                                        />
                                        <label className="react-select-label">Department Head</label>
                                        {(errors.head && touched.head) && (
                                            <span
                                                style={{ color: 'red', marginTop: '.15rem', marginLeft: '.25rem' }}
                                            >
                                                {errors.head}
                                            </span>
                                        )}
                                    </div>
                                    {components.map(component => {
                                        if (['string', 'date', 'number'].some(type => type === component.type)) {
                                            let type = component.type === 'string' ? 'text' : component.type
                                            return (
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
                                        }
                                        if (component.type === 'list' && Object.keys(lists).length && lists[component.list_type]) {
                                            return (
                                                <div key={component.label} className="floating-label col-md-6 mb-15 displayBlock">
                                                    <Select
                                                        name={component.key}
                                                        isClearable
                                                        isMulti={!!component.isMulti}
                                                        value={values[component.key] || ''}
                                                        classNamePrefix={(errors[component.key] && touched[component.key]) ? "Invalid " : ''}
                                                        noOptionsMessage={() => null}
                                                        styles={portalPageStyles}
                                                        placeholder={component.label}
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
                                        return null;
                                    })}
                                </div>
                            </div>
                            <div className="cancel_publish_btn">
                                <NavLink to={`/custom-workflow/org/${orgId}/config/department?page=${next}`}>
                                    <button
                                        type="button"
                                        className="fancy_btn"
                                    >
                                        Cancel
                                    </button>
                                </NavLink>
                                <button
                                    type="button"
                                    className="fancy_btn active"
                                    onClick={handleSubmit}
                                >
                                    {this.props.edit ? 'Save' : 'Create'}
                                </button>
                            </div>
                        </form>
                    );
                }}
            </Formik>
        )
    }
}
const mapStateToProps = (state) => ({
    loader: state.department.loader
})

const mapDispatchToProps = dispatch => ({
    addToast: (type, title, message, duration) => dispatch(addToast(type, title, message, duration))
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(DepartmentForm));
