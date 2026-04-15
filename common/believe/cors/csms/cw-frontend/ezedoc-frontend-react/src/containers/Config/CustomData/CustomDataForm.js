import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';
import { connect } from 'react-redux';
import Axios from "axios";

import {
 toCamelCase, getRegexErrorMessage, validator, parseQueryString, escCharValidator, getEscCharRegexErrorMessage
} from "containers/utils";
import { CloseOutlined } from '@ant-design/icons';
import { Button } from '../../../components/UI/AppButton/AppButton';
import ErrorPage from '../../ErrorPage';
import Spinner from '../../../components/UI/Spinner/Spinner';
import { addToast } from '../../../components/Toast/actions';

const APP_URL = process.env.REACT_APP_APP_URL;

const getDuplicateValues = (object = []) => {
    let values = object.reduce((acc, value) => {
        acc[value.key] = acc[value.key] + 1 || 1;
        return acc
    }, {});

    let result = [];

    Object.keys(values).map(key => {
        if(values[key] > 1) {
            result.push(key)
        }
        return key
    })

    return result;
}

class CustomDataForm extends Component {
    constructor(props) {
        super(props);
        this.state = {
            ...props.initialState,
            isAutoGenerate: true,
            error: false,
            changed: false,
        }
    }

    componentDidMount() {
        let { id, edit, orgId } = this.props

        if (edit) {

            Axios.get(`${APP_URL}/${orgId}/lists/${id}`)
            .then(res => {
                const data = res.data.data;
                if (data) {
                    this.setState({
                        id,
                        name: data.name,
                        key: data.key,
                        list: [...data.list],
                        listValue: data?.list[0]?.value,
                        listKey: data?.list[0]?.key,
                        changed: false
                    })
                } else {
                    this.setState({
                        error: true
                    })
                }
            }).catch(() => {
                this.setState({
                    error: true
                })
            });
        }
    }

    handleChange = ({ target: { name , value } }) => {
        let listKey = value.replace(/ /g, '')
        if (name === 'name') {
            this.setState(() => ({
                name: value,
                key: toCamelCase(value),
                changed: true
            }))
        } else {
            this.setState(() => ({
                key: listKey,
                changed: true
            }))
        }
    }

    handleDelete = (index) => {
        this.setState(prevState => ({
            list: prevState.list.filter((entry, entryIndex) => entryIndex !== index)
        }))
    }


    handleValueChange = (index, event) => {
        let value = event.target.value;
        this.setState({listValue:value, changed: true})
        this.setState(prevState => ({
            list: prevState.list.map((entry, entryIndex) => {
                if (index === entryIndex) {
                    return prevState.isAutoGenerate
                    ? {
                        ...entry,
                        value,
                        key: toCamelCase(value)
                    }
                    : {
                        ...entry,
                        value
                    }
                }
                return entry
            })
        }))
    }

    handleKeyChange = (index, event) => {
        let key = event.target.value.replace(/ /g, '')
        this.setState({listKey:event.target.value, changed: true})
        this.setState(prevState => ({
            list: prevState.list.map((entry, entryIndex) => {
                if (index === entryIndex) {
                    return {
                        ...entry,
                        key
                    }
                }
                return entry
            })
        }))
    }

    addField = () => {
        this.setState(prevState => ({
            list: [...prevState.list, { value: "", key: "" }],
            changed: true
        }))
    }

    handleSubmit = () => {
        let submit = true
        let duplicate = false

        let elements = Array.from(document.getElementsByClassName('floating-input'))
        // eslint-disable-next-line no-restricted-syntax
        for (let element of elements) {
            if (!element.value) {
                element.style.border = "2px solid #dc3545";
                submit = false;
            } else element.style.border = "1px solid var(--main-input-boder-color)";
        }
        if (submit) {
            let duplicateValues = getDuplicateValues(this.state.list)
            // eslint-disable-next-line no-restricted-syntax
            for (let element of elements) {
                if (duplicateValues.includes(element.value)) {
                    element.style.border = "2px solid #dc3545";
                    duplicate = true;
                    this.props.addToast('error', 'Error', 'Please add Unique keys.')
                } else element.style.border = "1px solid var(--main-input-boder-color)";
            }
        } else {
            this.props.addToast('error', 'Error', 'Please fill all the fields, before submitting.')
        }
        if (submit && !duplicate) {
            this.props.saveData(this.props.orgId, this.state, this.props.history)
        }
    }

    handleCheckboxChange = () => {
        this.setState( prevState => ({
            isAutoGenerate: !prevState.isAutoGenerate
        }))
    }

    render() {
        const { 
            list, name, key, error, isAutoGenerate, listValue, listKey, changed
        } = this.state;

        const {next = 1} = parseQueryString(this.props.history.location.search);

        let validatorList = []
        list.map(item => validatorList.push(escCharValidator(item.value)))
        const hasErrorInOptions = validatorList.includes(true)
        const nameValidator = validator(name)
        let elements = Array.from(document.getElementsByClassName("floating-input"));
        // eslint-disable-next-line no-restricted-syntax
        for (let element of elements) {
            element.style.border = "1px solid var(--main-input-boder-color)";
        }
        if (error) {
            return <ErrorPage />
        }
        return (
            <div className="custom-data-container">
                {this.props.loader && <Spinner />}
                <h5>List</h5>
                <div className="form_up_box">
                    <div className="floating-label col-md-4 pl-0">
                        <input 
                            name="name" 
                            value={name} 
                            onChange={this.handleChange} 
                            onBlur={this.handleBlur} 
                            placeholder=" " 
                            className="floating-input"
                            style={nameValidator ? {borderColor: '#d0021b', color: '#d0021b'} : {}}
                        />
                        <label>
List Name
<span aria-hidden="true" style={{color:'red'}}> *</span>
                        </label>
                        {
                            nameValidator
                            ? (<span className='error-message-element' style={{color: 'red', fontSize: '14px'}}>{getRegexErrorMessage('list name')}</span>)
                            : null
                        }
                    </div>
                    <div className="floating-label col-md-4 pl-0">
                        <input name="key" value={key} onChange={this.handleChange} placeholder=" " className="floating-input" />
                        <label>
List Key
<span aria-hidden="true" style={{color:'red'}}> *</span>
                        </label>
                    </div>
                </div>
                <div className='form-checkbox'>
                    <input 
                        type='checkbox'
                        name='auto-key'
                        id='auto-key-option'
                        checked={isAutoGenerate}
                        onChange={() => this.handleCheckboxChange()}
                    />
                    <label 
                        htmlFor='auto-key'
                        role='presentation'
                        onClick={() => this.handleCheckboxChange()}
                    >
                        Auto generate key for the options
                    </label>
                </div>
                <div className="lists-options-header">
                    <h5 style={{ marginRight: 32 }}>Options</h5>
                    <Button
                        variant="table-row-edit"
                        onClick={this.addField}
                    >
                        + Add
                    </Button>
                </div>
                <div className="custom-data-create-container">
                    <div className="form_up_box">
                        {list.map((entry, index) => (
                            <div key={`${index + 1}___${index + 1}`} className="body">
                                <div className="floating-label col-md-4 pl-0 ">
                                    <input
                                        value={entry.value}
                                        onChange={(e) => {
                                            this.handleValueChange(index, e)
                                        }}
                                        className="floating-input"
                                        placeholder=" "
                                        style={validatorList[index] ? {borderColor: '#d0021b', color: '#d0021b'} : {}}
                                    />
                                    <label>
Label
<span aria-hidden="true" style={{color:'red'}}> *</span>
                                    </label>
                                    {
                                        validatorList[index]
                                        ? (<span className='error-message-element' style={{color: 'red', fontSize: '14px'}}>{getEscCharRegexErrorMessage('list option')}</span>)
                                        : null
                                    }
                                </div>
                                <div className="floating-label col-md-4 pl-0">
                                    <input
                                        value={entry.key}
                                        onChange={(e) => {
                                            this.handleKeyChange(index, e)
                                        }}
                                        className="floating-input"
                                        placeholder=" "
                                    />
                                    <label>
Key
<span aria-hidden="true" style={{color:'red'}}> *</span>
                                    </label>
                                </div>
                                <div className="floating-label col-md-3">
                                    <div className="delete-button-container">
                                        <CloseOutlined
                                            onClick={() => { this.handleDelete(index) }}
                                            variant="lists-option-row-delete btn btn-disabled btn-circle"
                                            className='cancelIcon'
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <NavLink to={`/custom-workflow/org/${this.props.orgId}/config/lists?page=${next}`}>
                            <button
                                type="button"
                                className="fancy_btn cancel_button"
                            >
                                Cancel
                            </button>
                        </NavLink>
                        <Button
                            disabled={((nameValidator || hasErrorInOptions || !(isAutoGenerate ? (name && key && listValue) : (name && key && listValue && listKey))) || !changed)}
                            onClick={this.handleSubmit}
                            variant="primary"
                        >
                            Save
                        </Button>
                    </div>
                </div>
            </div>
        );
    }
}

export default connect(null, { addToast })(CustomDataForm);
