import React, { PureComponent } from 'react'
import { connect } from "react-redux";
import Axios from 'axios';
import AsyncSelect from "react-select/async";

import { CloseOutlined } from '@ant-design/icons';
import Spinner from '../../../components/UI/Spinner/Spinner';
import { Button } from '../../../components/UI/AppButton/AppButton';
import TickCross from '../../../components/UI/TickCross/TickCross';
import ErrorPage from '../../ErrorPage';
import { toCamelCase, getRegexErrorMessage, validator } from '../../utils';
import { portalPageStyles } from "../Utils/ReactSelectStyles";
import { DropdownIndicator } from "../Utils/ConfigUtils";
import { addToast } from '../../../components/Toast/actions';

const APP_URL = process.env.REACT_APP_APP_URL;

const handleListSearch = (orgId, inputText) => {
  return new Promise((resolve, reject) => {
    if (inputText.length > 1) {
        Axios.get(`${APP_URL}/${orgId}/lists/?search=${inputText}`)
        .then(response => {
          let options = response.data.data.map(list => ({
            value: list.id,
            label: list.name,
            name: "List"
          }));
          return resolve(options);
        })
        .catch(() => {
          return reject();
        });
    } else {
      reject();
    }
  });
};

class AttributesForm extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            type: this.props.type,
            components: [],
            displayComponents: [],
            http_method: 'post',
            loader: false,
            error: false
        }
    }

    addAttributes = () => {
        this.setState(prevState => ({
            ...prevState,
            components: [...prevState.components, {
                label: '',
                key: '',
                type: 'string',
                required: false,
                list_type: 'none',
                touched: false,
                isMulti: false,
                list_data : []
            }]
        }))
    }

    deleteAttributes = (attribIndex) => {
        this.setState(prevState => ({
            ...prevState,
            components: prevState.components.filter((field, index) => (index !== attribIndex))
        }))
    }

handleList = (fieldIndex, selected_list) => {
  let attribsLabelKey = {};
  let name ="list_type";
  let value = selected_list ? selected_list.value : null
  this.setState(
      prevState => ({
        ...prevState,
        components: prevState.components.map((field, index) => {
          if (fieldIndex === index)
            return {
              ...field,
              [name]: value,
              list_data : selected_list,
              ...attribsLabelKey,
              touched: true
            };
          return field;
        })
      }),
      () => {
        this.setState(prevState => ({
          ...prevState,
          components: prevState.components.map((field, index) => {
            let isValidLabel = field.touched && !!field.label.length && !!field.key.length;
            let isValidList = true;

            if (fieldIndex === index)
              return {
                ...field,
                isValidLabel,
                isValidList
              };
            return field;
          })
        }));
      }
    );
}

    handleChange = (fieldIndex, { 
        target: { 
            name, type, value, checked 
        } 
    }) => {
        let attribsLabelKey = {}
        if(name === 'label') {
            attribsLabelKey.label = value
            attribsLabelKey.key = toCamelCase(value);
        } else if(name === 'key') {
            attribsLabelKey.key = value;
        }
        this.setState(prevState => ({
            ...prevState,
            components: prevState.components.map((field, index) => {
                if (fieldIndex === index)
                    return {
                        ...field,
                        [name]: type === 'checkbox' ? checked : value,
                        ...attribsLabelKey,
                        touched: true
                    }
                return field
            })
        }), () => {
            this.setState(prevState => ({
                ...prevState,
                components: prevState.components.map((field, index) => {
                    let isValidLabel = field.touched 
                        && (!!field.label.length && !!field.key.length);
                    let isValidList = true

                    if (fieldIndex === index)
                        return {
                            ...field,
                            isValidLabel,
                            isValidList
                        }
                    return field
                })
            }))
        })
    }

    handleSubmit = () => {
        const {type, updateAttribs, attribs: {displayComponents, id}} = this.props;        
        
        this.setState(prevState => ({
            ...prevState,
            components: prevState.components.map(field => {
                return {
                    ...field,
                    touched: true,
                    isValidList: (field.type === 'list' && field.list_type !== 'none')
                }
            })
        }), () => {
            let InvalidFields = this.state.components.filter(field => {
                if(field.type === 'list')
                    return !(field.touched && field.isValidLabel && field.isValidList)
                return !(field.touched && field.isValidLabel)
            })
            let labels = [
                ...this.state.components, 
                ...displayComponents
            ].map(field => field.label.toUpperCase());
            let uniqueLabels = [...new Set(labels)];

            let keys = [
                ...this.state.components, 
                ...displayComponents
            ].map(field => field.label.toUpperCase());
            let uniqueKeys = [...new Set(keys)];
            
            if(labels.length !== uniqueLabels.length || keys.length !== uniqueKeys.length) {
                this.props.addToast('error', 'Error', 'Field labels and keys have to be unique.')
                return;
            }

            if (!InvalidFields.length) {
                let post_Data = {
                    "type": this.state.type,
                    "custom_attribute": {
                        "components": [...this.state.components.map(field => {
                            return {
                                type: field.type,
                                label: field.label,
                                key: field.key,
                                required: field.required,
                                list_type: (field.type === 'list' && field.list_type !== 'none') ? field.list_type : null,
                                isMulti: field.isMulti  
                            }
                        })]
                    }
                }
                if (displayComponents.length) {
                    post_Data = {
                        ...post_Data,
                        custom_attribute: {
                         components: [
                                ...displayComponents, 
                                ...post_Data.custom_attribute.components
                            ]
                        }
                    }
                }
                let attribs_id = this.state.id || id;

                let URL = attribs_id ? `${APP_URL}/${this.props.orgId}/config/custom_attribute/${attribs_id}` : `${APP_URL}/${this.props.orgId}/config/custom_attribute`;
                let http_method = attribs_id ? 'PUT' : 'POST';
                
                this.setState({loader: true})
                Axios({
                    method: http_method,
                    url: URL,
                    data: post_Data
                })
                .then((res) => {
                    this.setState(prevState => ({
                        ...prevState,
                        id: res.data.data.id,
                        components: []
                    }))
                    updateAttribs(type, post_Data.custom_attribute.components)
                })
                .catch(err => {
                    if (err && err.response && err.response.data)
                        this.props.addToast('error', 'Error', err.response.data.message)
                    else this.props.addToast('error', 'Error', 'Something went wrong, please try after sometime.')
                })
                .finally(() => {
                    this.setState({loader: false, components: [], http_method: 'PATCH'})
                })
            } else {
                this.props.addToast('error', 'Error', 'Please fill all the fields before submitting.')
            }
        })
    }


    render() {
        const { components, loader, error } = this.state;
        const { active, attribs, permission} = this.props;

        let validatorList = []
        components.map(item => validatorList.push(validator(item.label)))
        const hasError = validatorList.includes(true)

        if(error) {
            return (<ErrorPage />)
        }
        return (
            <div style={{ display: active ? 'block' : 'none' }}>
                {attribs.displayComponents && attribs.displayComponents.map((field, index) => (
                    <div className="row" key={`${field.label}__${index + 1}`}>
                        <h6 className="col-md-3">{field.label}</h6>
                        <h6 className="col-md-3">{field.key}</h6>
                        <h6 className="col-md-3">{field.type}</h6>
                        <h6 className="col-md-3">
                            {TickCross(field.required)}
                        </h6>
                    </div>
                ))}
                <div className="config_add_group_form">
                    {loader && (<Spinner />)}
                    { permission? (
                        <div className="master-db-add-btn" style={{margin: '10px 0 0 0'}}>
                            <Button
                                variant="table-row-edit"
                                onClick={this.addAttributes}
                            >
                                +  Add
                            </Button>
                        </div>
                        ):null
                    }
                    <div 
                        className="form_up_box" 
                        style={{ 
                            width: '95%', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            margin: 0 
                        }}
                    >
                        {components.map((entry, index) => (
                            <div key={`${index + 1}____`} className="master-container-row row" style={{ width: '100%' }}>
                                <div className="floating-label col-md-3" style={{display: 'flex', flexDirection: 'column'}}>
                                    <input
                                        placeholder=" "
                                        name="label"
                                        onChange={(e) => { this.handleChange(index, e) }}
                                        className={(!entry.isValidLabel && entry.touched) ? 'floating-input Invalid' : 'floating-input'}
                                        value={entry.label}
                                        style={validatorList[index] ? {borderColor: '#d0021b', color: '#d0021b'} : {}}
                                    />
                                    <label>Label</label>
                                    {
                                        validatorList[index]
                                        ? (<span className='error-message-element' style={{color: 'red', fontSize: '14px'}}>{getRegexErrorMessage('label')}</span>)
                                        : null
                                    }
                                </div>
                                <div className="floating-label col-md-2">
                                    <input
                                        placeholder=" "
                                        name="key"
                                        onChange={(e) => { this.handleChange(index, e) }}
                                        className={(!entry.isValidLabel && entry.touched) ? 'floating-input Invalid' : 'floating-input'}
                                        value={entry.key}
                                    />
                                    <label>Key</label>
                                </div>
                                <div className="floating-label col-md-2">
                                    <select
                                        name="type"
                                        onChange={(e) => { this.handleChange(index, e) }}
                                        className='floating-select'
                                        value={entry.type}
                                        disabled={entry.disabled}
                                    >
                                        <option value="string">Text Field</option>
                                        <option value="number">Number</option>
                                        <option value="date">Date</option>
                                        <option value="list">List of options</option>
                                    </select>
                                    <label>Type</label>
                                </div>
                                {entry.type === 'list' && (
                                    <div className="col-md-3">
                                        <div className="floating-label" style={{marginBottom: 5}}>
                                            <AsyncSelect
                                            noOptionsMessage={() => null}
                                            components={{ DropdownIndicator }}
                                            value={entry.list_data}
                                            placeholder="Search for List"
                                            styles={portalPageStyles}
                                            loadOptions={(text) => handleListSearch(this.props.orgId, text)}
                                            onChange={option => this.handleList(index, option)}
                                            ref={this.manager}
                                            isClearable
                                            openMenuOnFocus
                                            />
                                            <label className="react-select-label" style={{left: 9}}>Select a List</label>
                                        </div>
                                        <div>
                                            <input name="isMulti" checked={entry.isMulti} onChange={(e) => { this.handleChange(index, e) }} type="checkbox" id={`isMulti__${index}`} />
                                            <label className="custom-attribs-multi-select-label" htmlFor={`isMulti__${index}`}>Allow Multi Select</label>
                                        </div>
                                    </div>
                                )}
                                <div className="col-md-2" style={{display: 'flex', justifyContent: 'space-between'}}>
                                    <div style={{marginTop: 6}}>
                                        <input 
                                            name="required" 
                                            checked={entry.required} 
                                            onChange={(e) => { this.handleChange(index, e) }} 
                                            type="checkbox" 
                                            id={`required__${index}`} 
                                        />
                                        <label className="custom-attribs-multi-select-label" htmlFor={`required__${index}`}>Required</label>
                                    </div>
                                    <CloseOutlined
                                        onClick={() => { this.deleteAttributes(index) }}
                                        variant="master-db-row-delete-btn btn btn-disabled btn-circle"
                                        className='cancelIcon'
                                        disabled={entry.disabled}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="cancel_publish_btn">
                        <Button
                            variant="primary"
                            onClick={this.handleSubmit}
                            disabled={!components.length || hasError}
                        >
                            Save
                        </Button>
                    </div>
                </div>
            </div>
        )
    }
}

const mapStateToProps = state => ({
    permission: state.auth.uiPermissions.customattribute.add
})

const mapDispatchToProps = dispatch => ({
    addToast: (type, title, message, duration) => dispatch(addToast(type, title, message, duration))
})

export default connect(mapStateToProps, mapDispatchToProps)(AttributesForm);
