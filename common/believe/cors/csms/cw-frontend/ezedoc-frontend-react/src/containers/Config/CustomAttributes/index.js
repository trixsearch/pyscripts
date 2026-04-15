import React from 'react';
import Axios from 'axios';
import { connect } from 'react-redux'; 

import AttributesForm from './AttributesForm';
import Spinner from '../../../components/UI/Spinner/Spinner';
import '../../Tasks/task.css';
import './style.css';
import '../../Master/master.css';

const APP_URL = process.env.REACT_APP_APP_URL;

class CustomAttributes extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            active: 'users',
            loader: false,
            listOptions: [],
            users: {
                id: null,
                displayComponents: []
            },
            locations: {
                id: null,
                displayComponents: []
            },
            departments: {
                id: null,
                displayComponents: []
            },
            error: false
        }
    }

    componentDidMount() {
        const orgId = this.props.match?.params?.uuid;
        if (!this.props.feature) { return }
        this.setState({
            loader: true
        })

        Axios.get(`${APP_URL}/${orgId}/lists/?count=100`)
        .then(res => {
            this.setState(prevState => ({
                ...prevState,
                listOptions: [...res.data.data]
            }))
        })
        .catch(() => { })

        Axios.get(`${APP_URL}/${orgId}/config/custom_attribute`)
        .then(res => {
            if(res.data.data.length) {
                res.data.data.map(attribs => {
                    this.setState(prevState => ({
                        ...prevState,
                        [attribs.type]: {
                            id: attribs.id,
                            displayComponents: [...attribs.custom_attribute.components]
                        }
                    }))
                    return attribs
                })
            }
        })
        .catch(() => {
            this.setState({error: true})
        })
        .finally(() => {
            this.setState({loader: false})
        })
    }

    handleTabNav = ({ target: { name } }) => {
        this.setState(prevState => ({
            ...prevState,
            active: name
        }))
    }

    updateAttribs = (type, components) => {
        this.setState(prevState => ({
            ...prevState,
            [type]: {
                ...prevState[type],
                displayComponents: [...components]
            }
        }))
    }

    render() {
        const { 
            active, 
            loader, 
            listOptions, 
            users, 
            locations, 
            departments, 
        } = this.state;
        const orgId = this.props.match?.params?.uuid;
        
        return (
            <div className="custom-attributes">
                {loader && (<Spinner/>)}
                <div className="main_changable_container">
                    <div className="task-navbar" style={{ margin: '0px 0px 16px' }}>
                        <ul className="nav nav-tabs process_tab_ongoing_comp_ul task-navItem" role="tablist">
                            <li className={active === 'users' ? "nav-item active" : "nav-item"}>
                                <button
                                    onClick={this.handleTabNav}
                                    type="button"
                                    className="nav-button"
                                    style={{ cursor: "pointer" }}
                                    name="users"
                                >
                                    Users
                                </button>
                            </li>
                            <li className={active === 'departments' ? "nav-item active" : "nav-item"} >
                                <button
                                    onClick={this.handleTabNav}
                                    type="button"
                                    className="nav-button"
                                    style={{ cursor: "pointer" }}
                                    name="departments"
                                >
                                    Departments
                                </button>
                            </li>
                            <li className={active === 'locations' ? "nav-item active" : "nav-item"} >
                                <button
                                    onClick={this.handleTabNav}
                                    type="button"
                                    className="nav-button"
                                    style={{ cursor: "pointer" }}
                                    name="locations"
                                >
                                    Locations
                                </button>
                            </li>
                        </ul>
                    </div>
                    <div className="static-header">
                        <h5 className="col-md-3">Label</h5>
                        <h5 className="col-md-3">key</h5>
                        <h5 className="col-md-3">Type</h5>
                        <h5 className="col-md-3">Required</h5>
                    </div>
                    <AttributesForm
                        active={active === 'users'} 
                        type="users"
                        attribs={users}
                        listOptions={listOptions}
                        updateAttribs={this.updateAttribs}
                        orgId={orgId}
                    />
                    <AttributesForm
                        active={active === 'departments'}  
                        type="departments"
                        attribs={departments}
                        listOptions={listOptions}
                        updateAttribs={this.updateAttribs}
                        orgId={orgId}
                    />
                    <AttributesForm
                        active={active === 'locations'}
                        type="locations"
                        attribs={locations}
                        listOptions={listOptions}
                        updateAttribs={this.updateAttribs}
                        orgId={orgId}
                    />
                </div>
            </div>
        )
    }
}

const mapStateToProps = (state) => ({
    feature: state.auth.uiFeatures.customattribute.view,
});

export default connect(mapStateToProps)(CustomAttributes)