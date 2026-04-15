import React, { Component } from 'react';
import { connect } from 'react-redux';
import { NavLink } from 'react-router-dom';

import { getMasterModelById, getModelFields } from '../../store/actions';
import Spinner from '../../components/UI/Spinner/Spinner';
import { Button } from '../../components/UI/AppButton/AppButton';
import Modal from '../../components/Modal';
import { toCamelCase } from '../utils';
import WarningIcon from '../../assets/images/warning.png';

class CreateFields extends Component {
    constructor(props) {
        super(props);
        this.state = {
            prompted_once: false,
            modalOpen: false,
            list: [{
                name: "",
                key: "",
                field_type: "CharField",
                is_editable: false,
                is_unique: false,
                disabled: false,
                dirty: false,
                unique_is_editable: true
            }],
            saveButton: false
        }
    }

    componentDidMount() {
        const { edit, id } = this.props
        if (edit && id) {
            this.props.getModelFields(id)
                .then(res => {
                    this.setState(() => ({
                        list: res.data.data.map(field => {
                            return {
                                ...field,
                                disabled: true,
                                dirty: false,
                                unique_is_editable: field.is_unique
                            }
                        })
                    }))
                })
                .catch(() => {
                })
        }

    }

    setCount = () => {
        this.setState(prevState => ({
            list: [...prevState.list, {
                name: "",
                key: "",
                field_type: "CharField",
                is_editable: false,
                is_unique: false,
                disabled: false,
                dirty: false,
                unique_is_editable: true
            }]
        }))
    }

    handleChange = (index, event) => {
        const { target: { name }, target: { value } } = event

        this.setState(prevState => {
            let UpdatedList = [...prevState.list];

            let fieldKey = {};
            let fieldValue = value;

            if (name === 'name') {
                if (!UpdatedList[index].disabled) {
                    fieldKey.key = toCamelCase(value);
                }
            } else if (name === "key") {
                fieldValue = fieldValue.replace(/ /g, '')
            }
            return {
                list: [...UpdatedList].map((field, fieldIndex) => {
                    if (index === fieldIndex) {
                        return {
                            ...field,
                            [name]: fieldValue,
                            dirty: true,
                            ...fieldKey
                        }
                    }
                    return field
                })
            }
        }, () => {
            this.setSave()
        })
    }

    setSave = () => {
        if(this.state.list.some(field => (field.dirty))) {
            this.setState({
                saveButton: true
            })
        }
    }

    deleteField = (index) => {
        this.setState(prevState => ({
            list: [...prevState.list.filter((item, itemIndex) => (index !== itemIndex))]
        }))
    }

    handleCheck = (index, event) => {
        const { target: { name }, target: { checked } } = event;

        this.setState(prevState => ({
            list: [...prevState.list.map((item, itemIndex) => {
                if (index === itemIndex) {
                    return {
                        ...item,
                        [name]: checked,
                        dirty: true,
                    }
                }
                return item
            })]
        }), () => {
            this.setSave()
        })
    }

    handleSubmit = () => {
        this.props.saveData(this.state.list)
    }

    handleFieldsSave = () => {
        if (this.state.prompted_once) {
            this.handleSubmit()
        } else {
            this.setState({
                modalOpen: true
            })
        }
    }

    closePromptModal = () => {
        this.setState({
            modalOpen: false,
            prompted_once: true
        })
    }

    render() {
        const { 
            list, modalOpen, prompted_once, saveButton 
        } = this.state;
        return (
            <div className="config_add_group_form">
                {this.props.loader && (<Spinner />)}
                <div className="app_category_head">
                    <p>Add Fields</p>
                </div>
                {(modalOpen && !prompted_once) && (
                    <Modal
                        show={modalOpen}
                        onClose={this.closePromptModal}
                        title="Master Record Fields"
                        primaryBtn={{ className: "fancy_btn active", text: "Accept", onClick: this.handleSubmit }}
                        secondaryBtn={{ text: "Close", className: "fancy_btn", onClick: this.closePromptModal }}
                    >
                        <div className="master-fields-prompt">
                            <img className="warning-icon" src={WarningIcon} alt="Warning icon" />
                            <div className="master-fields-prompt-body">
                                <p>
                                    Unique to non-unique constraint is allowed however,
                                    non-unique to unique constraint is not permitted.
                                </p>
                                <p>
                                    Hence this action can not be rolled back in future.
                                </p>
                            </div>
                            <p>
                                Please make sure that you understand, this change.
                            </p>

                        </div>
                    </Modal>
                )}
                <div className="edit_app_detils_form_cont">
                    <div className="form_up_box" style={{ width: '95%' }}>
                        {list.map((entry, index) => (
                            <div key={`${index + 1}____`} className="master-container-row">
                                <div className="floating-label col-md-3">
                                    <input
                                        placeholder=" "
                                        name="name"
                                        onChange={(e) => { this.handleChange(index, e) }}
                                        className="floating-input"
                                        value={entry.name}
                                    />
                                    <label>Field Name</label>
                                </div>
                                <div className="floating-label col-md-2">
                                    <input
                                        placeholder=" "
                                        name="key"
                                        onChange={(e) => { this.handleChange(index, e) }}
                                        className="floating-input"
                                        value={entry.key}
                                        disabled={entry.disabled}
                                    />
                                    <label>Field Key</label>
                                </div>
                                <div className="floating-label col-md-2">
                                    <select
                                        name="field_type"
                                        onChange={(e) => { this.handleChange(index, e) }}
                                        className="floating-select"
                                        value={entry.field_type}
                                        disabled={entry.disabled}
                                    >
                                        <option value="CharField">String</option>
                                        <option value="IntegerField">Integer</option>
                                        <option value="DateField">Date</option>
                                        <option value="BooleanField">Boolean</option>
                                        <option value="ArrayField">Array Field</option>
                                        <option value="TextField">Text Area</option>
                                        <option value="DateTimeField">Date and Time</option>
                                    </select>
                                    <label>{entry.disabled ? '' : 'Field Type'}</label>
                                </div>
                                <div className="col-md-2 master-db-checkbox">
                                    <input
                                        name="is_editable"
                                        type="checkbox"
                                        checked={entry.is_editable}
                                        onChange={(e) => { this.handleCheck(index, e) }}
                                    />
                                    <p>Editable ?</p>
                                </div>
                                <div className="col-md-2 master-db-checkbox">
                                    <input
                                        name="is_unique"
                                        type="checkbox"
                                        checked={entry.is_unique}
                                        disabled={!entry.unique_is_editable}
                                        onChange={(e) => { this.handleCheck(index, e) }}
                                    />
                                    <p>Unique ?</p>
                                </div>
                                <div className="col-md-1 master-db-row-delete">
                                    <Button
                                        onClick={() => { this.deleteField(index) }}
                                        variant="master-db-row-delete-btn btn btn-disabled btn-circle"
                                        icon="glyphicon glyphicon-remove"
                                        disabled={entry.disabled}
                                    />

                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="master-db-add-btn">
                        <Button
                            variant="table-row-edit"
                            onClick={this.setCount}
                        >
                            +  Add
                        </Button>
                    </div>
                </div>
                <div className="cancel_publish_btn">
                    <NavLink
                        to="/master"
                    >
                        <button
                            type="button"
                            className="fancy_btn"
                        >
                            Cancel
                        </button>
                    </NavLink>
                    <Button
                        variant="primary"
                        onClick={this.handleFieldsSave}
                        disabled={!list.length || !saveButton}
                    >
                        Save
                    </Button>
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state) => ({
    loader: state.master.loader
});

const mapDispatchToProps = (dispatch) => ({
    getMasterModelById: (id) => dispatch(getMasterModelById(id)),
    getModelFields: (id) => dispatch(getModelFields(id))
});


export default connect(mapStateToProps, mapDispatchToProps)(CreateFields);    