import React, { Component, Fragment } from 'react';

import Modal from '../../../components/Modal';
import Spinner from '../../../components/UI/Spinner/Spinner';
import { Button } from "../../../components/UI/AppButton/AppButton";

import './AdvProcessFilter.css';

class AdvProcessFilter extends Component {
  state = {
    loader: false,
    btnDisableState: {
      clear: true,
      apply: true
    },
    AdvancedFilterData: [],
  }

  componentDidMount() {
    let AdvancedFilterData = []
    AdvancedFilterData = Object.keys(this.props.advFilterData).length === 0
      ? this.pushEmptyObj(AdvancedFilterData)
      : this.dataPreProcessing(this.props.advFilterData)
    this.setState(prevState => ({
      AdvancedFilterData: this.preDataCheck(AdvancedFilterData),
      btnDisableState: {
        ...prevState.btnDisableState,
        clear: !this.removeEmptyObj(AdvancedFilterData).length
      }
    }))
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
    let modifiedArr;
    if (arr.length > 0) {
      modifiedArr = arr.filter(item => item.attribute !== '' && item.value.trim() !== '')
    }
    return modifiedArr
  }

  checkValueMandatory = (arr) => {
    let isNotValid;
    if (arr.length > 0) {
      isNotValid = arr.some(item => !(item.attribute !== '' && item.value.trim() !== ''))
    }
    return isNotValid
  }

  dataPreProcessing = (obj) => {
    let advFilterArray = Object.keys(obj).map(key => {
      let newObj = {}
      newObj.attribute = key
      newObj.value = obj[key]

      return newObj
    })
    return advFilterArray
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
    let { AdvancedFilterData } = this.state;
    AdvancedFilterData[index][key] = value

    if (e.target.tagName.toLowerCase() === 'select'
      && (value === '' || AdvancedFilterData[index].value !== '')) {
      AdvancedFilterData[index].value = ''
    }

    this.setState({
      AdvancedFilterData,
      btnDisableState: {
        clear: !this.removeEmptyObj(AdvancedFilterData).length,
        apply: (JSON.stringify(this.arrayToObj(this.removeEmptyObj(AdvancedFilterData))) === JSON.stringify(this.props.advFilterData)) || this.checkValueMandatory(AdvancedFilterData)
      }
    })
  }

  queryHandler = (action, index = 0) => {
    let { AdvancedFilterData } = this.state;

    if (action === 'add')
      AdvancedFilterData = this.pushEmptyObj(AdvancedFilterData)
    else if (action === 'delete')
      AdvancedFilterData.splice(index, 1);

    this.setState({
      AdvancedFilterData,
      btnDisableState: {
        clear: !this.removeEmptyObj(AdvancedFilterData).length,
        apply: (JSON.stringify(this.arrayToObj(this.removeEmptyObj(AdvancedFilterData))) === JSON.stringify(this.props.advFilterData)) || this.checkValueMandatory(AdvancedFilterData)
      }
    })
  }

  updateFilterQuery = (filter_query) => {
    if (JSON.stringify(this.props.advFilterData) !== JSON.stringify(filter_query)) {
      this.props.updateAdvancedFilterHandler(this.props.selectedApp, filter_query);
    }
    this.props.advFilterModalStateChanger(false);
  }

  clearFilter = () => {
    let { AdvancedFilterData } = this.state
    AdvancedFilterData.splice(0, AdvancedFilterData.length)
    this.setState({
      AdvancedFilterData,
      btnDisableState: {
        clear: true,
        apply: true
      }
    }, () => {
      this.updateFilterQuery({})
    })
  }

  applyFilter = () => {
    let { AdvancedFilterData } = this.state
    this.updateFilterQuery(this.arrayToObj(AdvancedFilterData))
  }

  preDataCheck = (AdvancedFilterData) => {
    let advFilterArray = this.removeEmptyObj(AdvancedFilterData)
    if (advFilterArray.length > 0) {
      let statusArray = advFilterArray.map(query => this.props.selectedAppAllProcessVars.some(item => item.key === query.attribute))
      let isFalsePresent = statusArray.some(item => !item)
      if (isFalsePresent) {
        this.props.addToast('error', 'Error', 'Current filter that you are trying to apply is no longer applicable. Clear the current filter and apply a new filter.')
        advFilterArray.splice(0, advFilterArray.length)
        this.pushEmptyObj(advFilterArray)
      }
    } else {
      this.pushEmptyObj(advFilterArray)
    }
    return advFilterArray
  }

  arrayToObj = (arr) => {
    let obj = {}

    if (arr && Array.isArray(arr)) {
      let array = this.removeEmptyObj(arr)

      if (array && Array.isArray(array)) {
        array.map(item => {
          obj[item.attribute] = item.value.trim()
          return null
        })
      }
    }

    return obj
  }

  render() {
    const {
      loader,
      btnDisableState,
      AdvancedFilterData
    } = this.state;

    const {
      isAdvFilterModalOpen,
      selectedAppAllProcessVars,
      advFilterModalStateChanger,
    } = this.props;

    return (
      <Fragment>
        {loader && <Spinner />}
        <Modal
          title='Advanced Filter'
          show={isAdvFilterModalOpen}
          customClassName='adv-process-filter-modal'
          onClose={() => advFilterModalStateChanger(false)}
          secondaryBtn={{
            text: 'Close', className: 'fancy_btn', onClick: () => advFilterModalStateChanger(false)
          }}
          primaryBtn={{
            text: 'Clear Filter', disabled: btnDisableState.clear, className: 'fancy_btn active', onClick: this.clearFilter
          }}
          extraButtonData={(
            <Button
              variant="primary"
              onClick={this.applyFilter}
              disabled={btnDisableState.apply}
            >
              Apply Filter
            </Button>
          )}
        >
          <div className='adv-filter-sub-title'>Select one or more process variables and assign a value to search</div>

          <div className='adv-filter-query-container'>
            {
              AdvancedFilterData
              && Array.isArray(AdvancedFilterData)
              && AdvancedFilterData.map((item, index) => (
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
                        && selectedAppAllProcessVars.map((processVarObj, optionIndex) => (
                          <option
                            key={`option-${optionIndex + 1}`}
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
                        <span>
                          Value&nbsp;
                          <span className='required-star'>*</span>
                        </span>
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

export default AdvProcessFilter;