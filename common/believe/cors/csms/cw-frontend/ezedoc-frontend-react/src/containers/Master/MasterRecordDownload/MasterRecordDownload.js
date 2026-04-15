import React, { Component, Fragment } from 'react';

import Modal from '../../../components/Modal';
import Spinner from '../../../components/UI/Spinner/Spinner';
import { Button } from "../../../components/UI/AppButton/AppButton";

import '../../Process/AdvProcessFilter/AdvProcessFilter.css';
// TODO: This modal uses a css from advanced process filter model and these model needed to be refactor as both modal have the common functionality.
class MasterRecordDownload extends Component {
  state = {
    loader: false,
    MasterRecordData: []
  }

  componentDidMount() {
    let MasterRecordData = []
    MasterRecordData = this.pushEmptyObj(MasterRecordData)
    this.setState({
      MasterRecordData,
    })
  }

  pushEmptyObj = (arr) => {
    let emptyQuery = {
      attribute: '',
      value: ''
    }
    arr.push(emptyQuery)
    return arr
  }

  removeEmptyObj = (arr) => {
    let modifiedArr = [];
    if (arr.length > 0) {
      modifiedArr = arr.filter(item => item.attribute !== '' && item.value !== '')
    }
    return modifiedArr
  }

  handleChange = (e, index) => {
    let value;
    if (e.target.type === 'checkbox') {
      value = e.target.checked
    } else {
      value = e.target.type === 'number'
        ? Number(e.target.value)
        : e.target.value
    }
    let key = e.target.name
    let { MasterRecordData } = this.state;
    MasterRecordData[index][key] = value

    if (e.target.tagName.toLowerCase() === 'select'
      && (value === '' || MasterRecordData[index].value !== '')) {
        MasterRecordData[index].value = ''
    }

    this.setState({
      MasterRecordData,
    })
  }

  queryHandler = (action, index = 0) => {
    let { MasterRecordData } = this.state;

    if (action === 'add') {
      MasterRecordData = this.pushEmptyObj(MasterRecordData)
    } else if (action === 'delete') {
      MasterRecordData.splice(index, 1);
    }

    this.setState({
      MasterRecordData,
    })
  }

  updateFilterQuery = (filter_query) => {
    let MasterRecordData = []
    MasterRecordData = this.pushEmptyObj(MasterRecordData)
      this.setState({
        MasterRecordData,
        loader: false
      }, () => {
        this.props.updateQuery(filter_query);
      })
  }

  clearFilter = () => {
    let { MasterRecordData } = this.state
    MasterRecordData.splice(0, MasterRecordData.length)
    this.setState({
      MasterRecordData,
    }, () => {
      this.updateFilterQuery({})
    })
  }

  applyFilter = () => {
    let { MasterRecordData } = this.state

    let filter_query = {}

    MasterRecordData = this.removeEmptyObj(MasterRecordData)

    MasterRecordData.map(item => {
      filter_query[item.attribute] = item.value
      return null
    })

    this.updateFilterQuery(filter_query)
  }

  handleClose = () => {
    let MasterRecordData = []
    MasterRecordData = this.pushEmptyObj(MasterRecordData)
      this.setState({
        MasterRecordData,
        loader: false
      }, () => {
        this.props.hideRecordDownload()
      })
  }

  render() {
    const {
      loader,
      MasterRecordData
    } = this.state;

    const {
    showRecordDownloadModel,
      selectedAppAllProcessVars,
    } = this.props;

    return (
      <Fragment>
        {loader && <Spinner />}
        <Modal
          title='Master Record Download'
          show={showRecordDownloadModel}
          customClassName='adv-process-filter-modal'
          onClose={() => this.handleClose()}
          secondaryBtn={{
            text: 'Close', className: 'fancy_btn', onClick: () => this.handleClose()
          }}
          primaryBtn={{
            text: 'Download', className: 'fancy_btn active', onClick: this.applyFilter
          }}
        >
          <div className='adv-filter-sub-title'>Select one or more variables and assign a value to download record</div>

          <div className='adv-filter-query-container'>
            {
              MasterRecordData
              && Array.isArray(MasterRecordData)
              && MasterRecordData.map((item, index) => (
                <div key={`query-row-${index + 1}`} className='query-row' id={`query-row-${index + 1}`}>
                  <div className='query-column'>
                    <span>Attribute</span>
                    <select
                      required
                      key='attribute'
                      name='attribute'
                      value={item.attribute}
                      className='form-control'
                      onChange={e => this.handleChange(e, index)}
                    >
                      <option key='' value=''>Select Attribute</option>
                      {
                        selectedAppAllProcessVars
                        && Array.isArray(selectedAppAllProcessVars)
                        && selectedAppAllProcessVars.map(processVarObj => (
                          <option
                            key={processVarObj.key}
                            value={processVarObj.key}
                          >
                            {processVarObj.name}
                          </option>
                        ))
                      }
                    </select>
                  </div>
                  {
                    item.attribute !== ''
                    && (
                      <div className='query-column'>
                        <span>Value</span>
                        <input
                          required
                          name='value'
                          value={item.value}
                          className='form-control'
                          onChange={e => this.handleChange(e, index)}
                          type={selectedAppAllProcessVars.filter(
                            processVarObj => processVarObj.key === item.attribute
                          )[0].type}
                        />
                      </div>
                    )
                  }
                  {
                    index > 0
                    && (
                      <Button
                        icon="glyphicon glyphicon-remove"
                        variant="btn btn-disabled query-row-remove-btn"
                        onClick={() => this.queryHandler('delete', index)}
                      />
                    )
                  }
                </div>
              ))
            }

            <Button
              variant="primary"
              onClick={() => this.queryHandler('add')}
            >
              Add Query
            </Button>
          </div>
        </Modal>
      </Fragment>
    )
  }
}

export default MasterRecordDownload;