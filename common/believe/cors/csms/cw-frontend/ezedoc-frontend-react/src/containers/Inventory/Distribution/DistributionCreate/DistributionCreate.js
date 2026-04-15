import React, { Component } from "react";
import { NavLink } from 'react-router-dom';
import { connect } from "react-redux";
import AsyncSelect from 'react-select/async';

import routes from 'urls'
import { parseQueryString } from "containers/utils";
import { DropdownIndicator } from 'containers/Config/Utils/ConfigUtils'
import { createDistribution } from '../../../../store/actions/index';
import Breadcrumb from "../../../../components/UI/Breadcrumb/Breadcrumb";
import Spinner from '../../../../components/UI/Spinner/Spinner';
import {reactSelectStyles} from '../../../Config/Utils/ReactSelectStyles'
import { addToast } from '../../../../components/Toast/actions';
import { 
    handleAssetLoadOptions, handleLocationLoadOptions, 
    handleExtUsersLoadOptions, handleTransferredToLoadOptions 
} from '../../InventoryComponent/KeywordSearch'

class DistributionCreate extends Component {
    constructor(props) {
        super(props)
        this.state={
            quantity:'',
            loader: true,
            interLocationStock: false,
            transferredTo: ''
        }
    }

    componentDidMount() {
        this.setState(()=>{
            return{
                loader:false,
                interLocationStock: this.props.location.pathname === routes.DISTRIBUTION_INTER_TRANSFER_CREATE.path,
            }
        })
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
    }

    handleDatetimeChange = (data) => {
        if (typeof (data) !== 'string') {
            this.setState((prevState)=>{
                let newData = prevState.newData
                return {
                    time:data,
                    newData:{
                        ...newData,
                        time: data.toISOString(),
                    }
                }
            })            
        }else {
            this.setState((prevState)=>{
                let newData = prevState.newData
                return {
                    time:null,
                    newData:{
                        ...newData,
                        time: null,
                    }
                }
            })            
        }
    }

    handleSubmit = ()=>{       
        if(this.state.location.value === this.state.transferredTo.value) {
            this.props.addToast('error', 'Error', 'You are trying to transfer asset between same location.')
        }else{
            const { next = 1 } = parseQueryString(this.props.location.search)
            this.props.createDistribution(this.state.newData,this.props.history, next)
        }
    }
    
    render() {
        const orgId = this.props.match?.params?.uuid;
        const { next = 1 } = parseQueryString(this.props.location.search)
    let {
        asset, location, loader, quantity, extUser, transferredTo, interLocationStock,
    } = this.state

    const buttonActive = asset && location && quantity && (extUser || transferredTo)
    return(
        <div>
            {!interLocationStock
                ? (
                    <Breadcrumb
                        active='Distribute'
                        list={[{ name: 'Inventory', path: '#' }, { name: 'Distributions', path: routes.DISTRIBUTION_LIST.path }]}
                    />
                ) : (
                    <Breadcrumb
                        list={[
                            { name: 'Inventory', path: '#' },
                            { name: 'Distributions', path: routes.DISTRIBUTION_LIST.path },
                            { name: 'Inter-Location Stock Transfers', path: routes.DISTRIBUTION_INTER_TRANSFER_LIST.path }
                        ]}
                        active='Transfer'
                    />
                )
            }
            {(this.props.loader || loader) && (<Spinner />)}
            <div className="main_changable_container">
                <div className="config_add_group_form">
                    <div className="app_category_head">
                        <p>Distribute</p>
                    </div>
                    <div className="edit_app_detils_form_cont">
                        <form action="" className="form_up_box">
                            <div className="row col-md-12 m-0" style={{height: 'auto'}}>
                                <div className="floating-label col-md-6" style={{ display: 'block' }} >
                                    {interLocationStock
                                    ? (
                                        <div>
                                            <AsyncSelect
                                                value={this.state.transferredTo}
                                                noOptionsMessage={() => null}
                                                placeholder='Search for Location'
                                                styles={reactSelectStyles}
                                                loadOptions={handleTransferredToLoadOptions}
                                                onChange={this.handleChange}
                                                components={{ DropdownIndicator}}
                                            />
                                            <label className="react-select-label">Transfer To</label>

                                        </div>
                                    ):(
                                        <div>
                                            <AsyncSelect
                                                value={this.state.extUser}
                                                noOptionsMessage={() => null}
                                                placeholder='Search for user with name or email'
                                                styles={reactSelectStyles}
                                                loadOptions={(text) => handleExtUsersLoadOptions(orgId, text)}
                                                onChange={this.handleChange}
                                                components={{ DropdownIndicator}}
                                            />
                                            <label className="react-select-label">User</label>

                                        </div>
                                    )
                                    }
                                    
                                </div>
                                <div className="floating-label col-md-6" style={{ display: 'block' }} >
                                    <AsyncSelect
                                        components={{ DropdownIndicator}}
                                        value={this.state.asset}
                                        noOptionsMessage={() => null}
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
                                        value={this.state.location}
                                        placeholder='Search for location'
                                        styles={reactSelectStyles}
                                        loadOptions={(text) => handleLocationLoadOptions(orgId, text)}
                                        onChange={this.handleChange}
                                        components={{ DropdownIndicator}}
                                    />
                                    <label className="react-select-label">Your Location</label>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div className="cancel_publish_btn">
                        <NavLink 
                            to={
                                interLocationStock
                                ? routes.DISTRIBUTION_INTER_TRANSFER_LIST.to(orgId, next)
                                : routes.DISTRIBUTION_LIST.to(orgId, next)
                            }
                        >
                            <button type='button' className="fancy_btn">Cancel</button>
                        </NavLink>
                        <button 
                            type="button" 
                            disabled={!buttonActive}
                            className="fancy_btn active" 
                            onClick={this.handleSubmit}
                        >
                            Add
                        </button>
                    </div>
                   
                </div>
            </div>
        </div>
        )
    }
}

const mapStateToProps = state => ({
    loader: state.distribution.loader,
})

const mapDispatchToProps = {
    createDistribution,
    addToast,
}

export default connect(mapStateToProps, mapDispatchToProps)(DistributionCreate);