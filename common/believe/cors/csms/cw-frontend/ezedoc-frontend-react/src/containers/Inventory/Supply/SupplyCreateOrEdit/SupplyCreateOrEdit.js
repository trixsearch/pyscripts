import React, { Component } from "react";
import { NavLink } from 'react-router-dom';
import { connect } from "react-redux";
import AsyncSelect from 'react-select/async';
import Axios from 'axios'
import moment from "moment"
import Datetime from 'react-datetime'

import { parseQueryString } from "containers/utils";
import { DropdownIndicator } from 'containers/Config/Utils/ConfigUtils'
import {
    editSupply,
    createSupply,
} from '../../../../store/actions/index';
import Spinner from '../../../../components/UI/Spinner/Spinner';
import ErrorPage from "../../../ErrorPage";
import {reactSelectStyles} from '../../../Config/Utils/ReactSelectStyles'
import { addToast } from '../../../../components/Toast/actions';
import { 
    handleAssetLoadOptions,handleLocationLoadOptions,
    handleSupplierLoadOptions
        } from '../../InventoryComponent/KeywordSearch'

import "react-datetime/css/react-datetime.css"
import '../../InventoryComponent/react-datetime-tweak.css'

import * as constants from '../../../../Data/constants'

const APP_URL = process.env.REACT_APP_APP_URL;

class SupplyCreateOrEdit extends Component {
    constructor(props) {
        super(props)
        this.state={
            id:this.props.match.params.id,
            loader: true,
            newData: {},
            quantity:"",
            orderedAt:"",
            arrivedAt:"",
        }
    }

    componentDidMount() {
        if(this.state.id) {
            Axios.get(`/api/inventory/supply/${this.state.id}`)
            .then(response => {
                const data = response.data.data                  
                const orderedAt = moment(data.ordered_at).local()            
                const arrivedAt = moment(data.arrived_at).local()           

                this.setState({
                    asset:{label: data.asset_name, value: data.asset, name:"asset"},
                    location:{label: data.location_detailed.name, value: data.location_detailed.id, name:"location"},
                    quantity: data.quantity,
                    supplier: {label:data.supplier_name, value: data.supplier, name:"supplier"},
                    orderedAt,
                    arrivedAt,
                    checker: {label: data.checker_email, value: data.checker_id, name:"checker"},
                    loader: false
                })
            })
            .catch(() => this.setState({
                error: true,
                loader: false
             }))
        }else{
            let currentTime = moment()

            this.setState((state)=>{
                return{
                    loader:false,
                    arrivedAt: currentTime,
                    newData:{
                        ...state.newData,
                        arrivedAt: currentTime,
                    }
                }
            })
        }       
    }

    handleChange = (data) => {                
        let name=null
        let value=null
        if(data.target) {
            name = data.target.name
            value = data.target.value
            this.setState((state)=>{
                let newData = state.newData
                return{
                    [name]:value,
                    newData:{
                        ...newData,
                        [name]:value
                    }
                }
            })
        }else{
            name = data.name
            value = data.value
            this.setState((state)=>{
                let newData = state.newData
                return{
                    [name]:data,
                    newData:{
                        ...newData,
                        [name]:data.value
                    }
                }
            })
        } 
        return null       
    }

    handleDatetimeChange = (data,name) => {
        if (typeof (data) !== 'string') {
            this.setState((prevState)=>{
                let newData = prevState.newData
                return {
                    [name]:data,
                    newData:{
                        ...newData,
                        [name] : data.toISOString(),
                    }
                }
            })            
        }else {
            this.setState((prevState)=>{
                let newData = prevState.newData
                return {
                    [name] :null,
                    newData:{
                        ...newData,
                        [name] : null,
                    }
                }
            })            
        }
    }

    handleOrderedAt = (data)=>{
        this.handleDatetimeChange(data,'orderedAt')
    }

    handleArrivedAt = (data)=>{
        this.handleDatetimeChange(data,'arrivedAt')
        if (data.isBefore && data.isBefore(this.state.orderedAt)) {
            this.handleDatetimeChange(data,'orderedAt')
        }
    }

    handleSubmit = ()=>{    
        const { next = 1 } = parseQueryString(this.props.location.search)
        if(this.state.id) {
            if(Object.keys(this.state.newData).length >0) {
                this.props.editSupply(this.props.match?.params?.uuid, this.state.id, this.state.newData, this.props.history, next)
            }else{
                this.props.addToast('error', 'Error', 'No changes detected')
            }
        }else{
            this.props.createSupply(this.props.match?.params?.uuid, this.state.newData,this.props.history, next)
        }   
    }

    handleOrgUsersLoadOptions = (inputText) => {
        return new Promise((resolve, reject) => {
            if (inputText.length > 1) {
                Axios.get(`${APP_URL}/${this.props.match?.params?.uuid}/users/org_users?search=${inputText}`).then(response => {
                    let options = response.data.data
                    .filter(checker => checker.id !== this.props.userId)
                    .map(checker => ({ value: checker.id, label: checker.email, name: "checker" }))
                    return resolve(options)
                }).catch(() => {
                    return reject()
            })
        } else{
            reject()
    }
    })
}

    getPastDates = selectedDate => {
        let now = moment().local()
        if (selectedDate.isAfter(now)) {
            return false
        }
        return true
    }

    getValidDates = selectedDate => {
       let arrivedAt=moment(this.state.arrivedAt)
        return arrivedAt.isAfter(selectedDate)
    }

    render() {                
        const { next = 1 } = parseQueryString(this.props.location.search)
    let {
        id, error, loader, arrivedAt, orderedAt 
    } = this.state
          
    if(error) { return ( <ErrorPage /> ) }
    
    arrivedAt = moment(arrivedAt)
    orderedAt = moment(orderedAt)
    let isValidDatetime = arrivedAt.isAfter(orderedAt) || arrivedAt.isSame(orderedAt)
    const orgId=this.props.match?.params?.uuid; 

    return(
        <div>
            {(this.props.loader || loader) && (<Spinner />)}
            <div className="main_changable_container">
                <div className="config_add_group_form">
                    <div className="app_category_head">
                        <p>{id?"Edit Supply":"Add Supply"}</p>
                    </div>
                    <div className="edit_app_detils_form_cont">
                        <form action="" className="form_up_box">
                            <div className="row col-md-12 m-0" style={{height: 'auto'}}>

                                <div className="floating-label col-md-6" style={{ display: 'block' }} >
                                    <AsyncSelect
                                        noOptionsMessage={() => null}
                                        components={{ DropdownIndicator}}
                                        value={this.state.asset}
                                        placeholder='Search for asset'
                                        styles={reactSelectStyles}
                                        loadOptions={handleAssetLoadOptions}
                                        onChange={this.handleChange}
                                    />
                                    <label className="react-select-label">Asset</label>
                                </div>
                                <div className="floating-label col-md-6" style={{ display: 'block' }} >
                                    <input
                                        name='quantity'
                                        type='number'
                                        min='1'
                                        value={this.state.quantity}
                                        onChange={this.handleChange}
                                        className='floating-input'
                                    />
                                    <label>Quantity</label>
                                </div>
                                <div className="floating-label col-md-6" style={{ display: 'block' }} >
                                    <AsyncSelect
                                        noOptionsMessage={() => null}
                                        components={{ DropdownIndicator}}
                                        value={this.state.location}
                                        placeholder='Search for location'
                                        styles={reactSelectStyles}
                                        loadOptions={(text) => handleLocationLoadOptions(orgId, text)}
                                        onChange={this.handleChange}
                                    />
                                    <label className="react-select-label">Location</label>
                                </div>
                                <div className="floating-label col-md-6" style={{ display: 'block' }} >
                                    <AsyncSelect
                                        noOptionsMessage={() => null}
                                        components={{ DropdownIndicator}}
                                        value={this.state.supplier}
                                        placeholder='Search for supplier'
                                        styles={reactSelectStyles}
                                        loadOptions={handleSupplierLoadOptions}
                                        onChange={this.handleChange}
                                    />
                                    <label className="react-select-label">Supplier</label>
                                </div>
                                <div className="floating-label col-md-6 inventory_datetime" style={{ display: 'block' }} >
                                    <span className='datetime-text'>Ordered At</span>
                                    <Datetime
                                        isValidDate={this.getValidDates}
                                        dateFormat={constants.DATE_FORMAT}
                                        closeOnSelect
                                        value={this.state.orderedAt}
                                        onChange={this.handleOrderedAt}
                                    />
                                    {!isValidDatetime && this.state.orderedAt && <span style={{ color: 'red', marginTop: '.15rem', marginLeft: '.25rem' }}>Ordered date is later then Arrived date</span>}
                                </div>
                                <div className="floating-label col-md-6 inventory_datetime" style={{ display: 'block' }} >
                                    <span className='datetime-text'>Arrived At</span>
                                    <Datetime
                                        isValidDate={this.getPastDates}
                                        dateFormat={constants.DATE_FORMAT}
                                        closeOnSelect
                                        value={this.state.arrivedAt}
                                        onChange={this.handleArrivedAt}
                                    />
                                </div>
                                <div className="floating-label col-md-12" style={{ display: 'block' }} >
                                    <AsyncSelect
                                        noOptionsMessage={() => null}
                                        components={{ DropdownIndicator}}
                                        value={this.state.checker}
                                        placeholder='Search for user'
                                        styles={reactSelectStyles}
                                        loadOptions={this.handleOrgUsersLoadOptions}
                                        onChange={this.handleChange}
                                    />
                                    <label className="react-select-label">To be verified by</label>
                                </div>

                            </div>
                        </form>
                    </div>
                    <div className="cancel_publish_btn">
                        <NavLink to={`/inventory/supply?page=${next}`}>
                            <button type='button' className="fancy_btn">Cancel</button>
                        </NavLink>
                        <button 
                            type="button" 
                            disabled={!(this.state.asset && this.state.location 
                                && this.state.supplier && this.state.quantity 
                                && this.state.checker && this.state.orderedAt 
                                && this.state.arrivedAt && isValidDatetime )}
                            className="fancy_btn active" 
                            onClick={this.handleSubmit}
                        >
                            {this.state.id?"Save":"Add"}
                        </button>
                    </div>
                   
                </div>
            </div>
        </div>
        )
    }
}

const mapStateToProps = state => ({
    loader: state.supply.loader,
    userId: state.auth.id
})

const mapDispatchToProps = {
    editSupply,
    createSupply,
    addToast,
}

export default connect(mapStateToProps, mapDispatchToProps)(SupplyCreateOrEdit);