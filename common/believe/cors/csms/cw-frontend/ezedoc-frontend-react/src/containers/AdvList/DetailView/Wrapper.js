/* eslint-disable */
import React, { Component } from 'react';
import { NavLink, Prompt } from 'react-router-dom';
import { connect } from "react-redux";
import Axios from 'axios';
import * as R from 'ramda';
import PropTypes from 'prop-types';
import update from 'react-addons-update';

import * as util from '../util';
import * as Schema from '../Schema';
import { PropTypes as Props } from '../constants';
import { ObjectEditor, ArrayEditor } from '../Editor';
import Spinner from '../../../components/UI/Spinner/Spinner';
import routes from '../../../urls';
import { addToast } from '../../../components/Toast/actions';
import { HasAccess } from '../../../platformDataStoreContext';
import UnauthorizedPage from '../../UnauthorizedPage';

import './Wrapper.css';
import { CW_SERVICE_LIST_UPDATE } from '../../../Data/constants';

const APP_URL = process.env.REACT_APP_APP_URL;

// Sets the element at idx to updated
function updateArray(updated, idx, callback = null) {
  this.setState({
    object: update(
      this.state.object,
      {
        [idx]: {
          $set: updated
        }
      }
    )
  }, () => {
    if (typeof callback === 'function') callback()
  })
}

// A test wrapper around Editor that keeps track of state
class Wrapper extends React.Component {
  static displayName = 'Wrapper';

  static propTypes = {
    // Initial object to edit
    initialObject: PropTypes.any.isRequired,

    // Schema to use
    type: Props.Schema.isRequired,

    // [optional] handler to use when the object is updated
    onUpdate: PropTypes.func,
  };

  constructor(props) {
    super(props);

    // Initialize state to empty object
    this.state = {
      object: props.initialObject,
      initialArrayObject: props.initialObject,
      showDataPreviewer: false,
      isSaving: false,
      searchedQuery: '',
      searchResult: null,
      searchItemsIndex: null,
      oldSearchObject: null
    };

    // If update handler was specified in props, use that -- otherwise,
    // use the function updateArray
    this.change = (this.props.onUpdate && this.props.onUpdate.bind(this)) ||
      updateArray.bind(this);
  }

  fillEmptyData = (newObject) => {
    let completeObject;
    completeObject = {...this.props.emptyValues, ...newObject}
    Object.keys(this.props.type).map(item => {
      if (this.props.type[item]._type === 'arrayOf' && typeof this.props.type[item]._elementType === 'object') {
        completeObject[item].map((obj, index) => {
          completeObject[item][index] = {...this.props.emptyValues[item][0], ...obj}
          return null
        })
      }
      return null
    })
    return completeObject
  }

  // Handler called when a new object is added.
  // Just adds the object to the end of the array.
  add(newObject) {
    let completeNewData = this.fillEmptyData(newObject)
    this.setState({ 
      object: [...this.state.object, completeNewData]
    },() => {
      this.searchCallback(this.state.oldSearchObject, true);
    });
    return true;
  };

  // Handler called when an element is removed.
  remove(removedIndices) {
    const wasRemovedByIndex = util.keyBy(R.identity, removedIndices)
    this.setState({
      object: R.addIndex(R.reject)(
        (__, idx) => idx in wasRemovedByIndex,
        this.state.object
      )
    });
  };

  handleSave = () => {
    this.setState({
      isSaving: true
    })
    this.props.handleLoader(true);
    Axios.put(
      `${APP_URL}/${this.props.orgId}/lists/advanced/${this.props.id}`,
      {
        lists: this.state.object
      }
    )
    .then(response => {
      this.props.addToast('success', 'Success', response.data.message)
    })
    .catch(() => {
      this.props.addToast('error', 'Error', 'Something went wrong!')
    })
    .finally(() => {
      this.props.handleLoader(false);
      this.props.history.push(routes.ADVANCED_LIST.to(this.props.orgId))
    })
  }

  handleDataPreviewer = (showDataPreviewer) => {
    this.setState({
      showDataPreviewer
    })
  }

  searchCallback = (searchObject, isNewArrival = false) => {
    let searchResult;
    let searchItemsIndex;
    let searchedQuery = '';
    let flag = true;
    if(JSON.stringify(this.state.oldSearchObject) !== JSON.stringify(searchObject) || isNewArrival) {
      if(searchObject !== null){
        if(Object.keys(searchObject).length !== 0) {
          searchResult = null;
          let modifiedSearchObject = searchObject;
          Object.keys(modifiedSearchObject).map(i => {
            if(modifiedSearchObject[i] === "" || String(modifiedSearchObject[i]) === "NaN"){
              delete modifiedSearchObject[i];
            }
          })
          if(Object.keys(modifiedSearchObject).length !== 0) {
            searchItemsIndex = []
            searchResult = [];
            searchResult = this.state.object.filter((data, dataIndex) => {
              let checkerArr = Object.keys(modifiedSearchObject).map((item, index) => {
                if(flag)
                  searchedQuery += `${index === 0 ? '' : ', '}${item}: ${modifiedSearchObject[item]}`
                if(typeof(data[item]) === "string")
                  return data[item].toLowerCase().includes(modifiedSearchObject[item].toLowerCase())
                else if(typeof(data[item]) === "number")
                  return data[item].toString().includes(modifiedSearchObject[item].toString())
              })
              flag = false;
              if(checkerArr.length === Object.keys(modifiedSearchObject).length) {
                let checkerValue = checkerArr.reduce((total, boolValue) => total && boolValue)
                if(checkerValue) {
                  searchItemsIndex.push(dataIndex)
                  return data
                }
              }
            })
          }
        } else {
          searchResult = null
          searchItemsIndex = null
        }

        this.setState({
          searchResult,
          searchedQuery,
          searchItemsIndex,
          oldSearchObject: searchObject
        })
      }
    }
  }

  updateSearchResult = () => {
    let searchResult = []
    searchResult = this.state.object.filter((data, dataIndex) => {
      if (this.state.searchItemsIndex.includes(dataIndex))
        return data
    })

    this.setState({
      searchResult
    })
  }

  render() {
    // Choose between object and array components based on whether
    // the object in state is an array.
    const EditorComponent = Array.isArray(this.state.object)
      ? ArrayEditor
      : ObjectEditor;

    let isDirtyObject = JSON.stringify(this.state.initialArrayObject) !== JSON.stringify(this.state.object)

    return (
      <HasAccess
        permissions={[CW_SERVICE_LIST_UPDATE]}
        yes={() => (
          <div 
            className='WrapperContainer'
            style={{maxHeight: window.innerHeight - 165}}
          >
            <EditorComponent
              // defaultRowsPerPage={10}
              className='editor--outside'
              object={this.state.searchResult ? this.state.searchResult : this.state.object}
              type={this.props.type}
              advListName={this.props.advListName}
              onUpdateElement={this.change.bind(this)}
              onAddElement={this.add.bind(this)}
              onRemoveElements={this.remove.bind(this)} 
              totalElements={this.state.object.length}
              SearchCallback={this.searchCallback}
              searchedQuery={this.state.searchedQuery}
              SearchItemsIndex={this.state.searchItemsIndex}
              updateSearchResult={this.updateSearchResult}
              searchResultCount={this.state.searchResult ? this.state.searchResult.length : null}
              showSearch
            />
    
            <div 
              className='final_data_previewer_wrapper'
              style={this.state.showDataPreviewer ? { width: "400px" } : {}}
            >
              <div className='final_data_previewer'>
                <div>
                  <h4>Data</h4>
                  <span 
                    onClick={() => this.handleDataPreviewer(false)} 
                    role="presentation" 
                    style={{color: "rgb(0, 0, 0, 0.8)", fontSize: "12px", marginRight: "10px", cursor: "pointer"}}
                  >
                    <i className="icon-close"></i>
                  </span>
                </div>
                <pre className="final_json_data">
                  {JSON.stringify(this.state.object, null, '   ')}
                </pre>
              </div>
            </div>
    
            <div className="extra_buttons">
              <button
                  type="button"
                  className="fancy_btn"
                  onClick={() => this.handleDataPreviewer(true)}
              >
                  Preview
              </button>
            </div>
    
            <div className="footer_buttons">
              <NavLink to={routes.ADVANCED_LIST.to(this.props.orgId)}>
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
                onClick={this.handleSave}
                disabled={!isDirtyObject}
              >
                Save
              </button>
            </div>
            <Prompt
              when={isDirtyObject && !this.state.isSaving}
              message="Unsaved work will be lost"
            />
          </div>
        )}
        no={() => (
          <UnauthorizedPage />
        )}
      />
    )
  }
}

class ObjectEditorWrapper extends Component {
  constructor(props) {
    super(props);
    this.state = {
      schema: {},
      loader: false,
      emptyValues: {},
      initialLoad: true,
      id: this.props.match.params.id,
    }
  }

  componentDidMount() {
    const orgId = this.props.match?.params?.uuid;

    Axios.get(`${APP_URL}/${orgId}/lists/advanced/${this.state.id}`)
      .then(response => {
          let data = response.data.data;
          this.schemaGenerator(data.schema, false);
          this.setState({
            data
          })
      })
      .catch(() => {
        this.props.addToast('error', 'Error', 'Something went wrong!')
      })
      .finally(() => {
          this.setState({
              initialLoad: false
          })
      })
  }

  schemaGenerator = (schemaData, returnData, emptyValuesObj = {}) => {
    let schema = {};
    let emptyValues = emptyValuesObj;

    const emptyValuesCreator = (key, value) => {
      emptyValues[key] = value
      return null
    }

    schemaData
    && Array.isArray(schemaData)
    && schemaData.map(item => {

      const isItemRequired = item.required || false;
      const isItemDisabled = item.disabled || false;

      switch(item.type) {
        case 'any':
          emptyValuesCreator(item.name, '')
          schema[item.name] = Schema.SchemaTypes.any({ required: isItemRequired, disabled: isItemDisabled })
          break;
        case 'string':
          emptyValuesCreator(item.name, '')
          schema[item.name] = Schema.SchemaTypes.string({ required: isItemRequired, disabled: isItemDisabled })
          break;
        case 'boolean':
          emptyValuesCreator(item.name, '')
          schema[item.name] = Schema.SchemaTypes.boolean({ required: isItemRequired, disabled: isItemDisabled })
          break;
        case 'number':
          emptyValuesCreator(item.name, '')
          schema[item.name] = Schema.SchemaTypes.number({ required: isItemRequired, disabled: isItemDisabled })
          break;
        case 'date':
          emptyValuesCreator(item.name, '')
          schema[item.name] = Schema.SchemaTypes.date({ required: isItemRequired, disabled: isItemDisabled })
          break;
        case 'arrayof':
          if(item.data.type === 'any') {
            emptyValuesCreator(item.name, [''])
            schema[item.name] = Schema.SchemaTypes.arrayOf(Schema.SchemaTypes.any({ disabled: isItemDisabled }))({ required: isItemRequired })
          }
          else if(item.data.type === 'string') {
            emptyValuesCreator(item.name, [''])
            schema[item.name] = Schema.SchemaTypes.arrayOf(Schema.SchemaTypes.string({ disabled: isItemDisabled }))({ required: isItemRequired })
          }
          else if(item.data.type === 'boolean') {
            emptyValuesCreator(item.name, [''])
            schema[item.name] = Schema.SchemaTypes.arrayOf(Schema.SchemaTypes.boolean({ disabled: isItemDisabled }))({ required: isItemRequired })
          }
          else if(item.data.type === 'number') {
            emptyValuesCreator(item.name, [''])
            schema[item.name] = Schema.SchemaTypes.arrayOf(Schema.SchemaTypes.number({ disabled: isItemDisabled }))({ required: isItemRequired })
          }
          break;
        case 'arrayofobject':
          emptyValuesCreator(item.name, [{}])
          schema[item.name] = Schema.SchemaTypes.arrayOf(this.schemaGenerator(item.data, true, emptyValues[item.name][0]))({ required: isItemRequired })
          break;
        default:
          break;
      }

      return null;
    })

    if(returnData) {
      return schema;
    }

    this.setState({
      schema,
      emptyValues
    })
  }

  handleLoader = (loader) => {
    this.setState({
      loader
    })
  }

  render() {
    const {
      data,
      loader,
      schema,
      initialLoad,
    } = this.state;

    if(initialLoad) {
      return (initialLoad && <Spinner />)
    }

    return (
      <div style={{marginTop: 20}}>
        {loader && <Spinner />}
        <Wrapper
          type={schema}
          id={this.state.id}
          history={this.props.history}
          addToast={this.props.addToast}
          advListName={data && data.name}
          handleLoader={this.handleLoader}
          initialObject={data && data.lists}
          emptyValues={this.state.emptyValues}
          orgId={this.props.match?.params?.uuid}
        />
      </div>
    )
  }
}

const mapDispatchToProps = dispatch => ({
  addToast: (type, title, message, duration) => dispatch(addToast(type, title, message, duration))
})

export default connect(null, mapDispatchToProps)(ObjectEditorWrapper);
