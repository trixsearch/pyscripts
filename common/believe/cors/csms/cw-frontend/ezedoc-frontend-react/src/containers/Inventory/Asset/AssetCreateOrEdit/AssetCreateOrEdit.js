import React, { Component } from "react";
import { connect } from "react-redux";
import axios from "axios";
import { NavLink } from 'react-router-dom';
import { Formik } from 'formik';
import * as Yup from 'yup';

import { SPECIAL_CHARACTERS_ERROR_REGEX } from "Data/constants";
import { getRegexErrorMessage, parseQueryString } from "containers/utils";
import {
    editAsset,
    createAsset,
} from '../../../../store/actions/index';
import Spinner from '../../../../components/UI/Spinner/Spinner';
import ErrorPage from "../../../ErrorPage";
import { addToast } from '../../../../components/Toast/actions';

class AssetEdit extends Component {
    constructor(props) {
        super(props);
        this.state = {
            id: this.props.match.params.id,
            error: null,
            loader: true,
            name:"",
            descriptions:""
        }
    }

    componentDidMount() {
            if(this.state.id) {
            axios.get(`/api/inventory/asset/${this.state.id}`)
                .then(res => res.data.data)
                .then(data => {                    
                    this.setState({               
                        name : data.name,
                        descriptions :data.descriptions || "",
                        loader: false
                    })
                })
                .catch(() => this.setState({ error: true, loader: false }))
        }else{
            this.setState({
                loader: false
            })
        }
    }

    handleOnSubmit(values) {
        const { next = 1 } = parseQueryString(this.props.location.search)
        const data = {
            name: values.name,
            descriptions: values.descriptions
        }
        if(this.state.id) {
            let newData = {}
            const {name, descriptions} = this.state
            if(data.name !== name) {
                newData.name = data.name
            }
            if(data.descriptions !== descriptions) {
                newData.descriptions = data.descriptions
            }
            if(Object.keys(newData).length >0) {
                this.props.editAsset(this.state.id, newData, this.props.history, next)
            }else{
                this.props.addToast('error', 'Error', 'No changes detected')
            }
        }else{
            this.props.createAsset(data,this.props.history, next)
        }
        
    }
    
    render() {
        const { id, loader, error} = this.state;
        const { next = 1 } = parseQueryString(this.props.location.search)
        if(error) { return (<ErrorPage />) }
            return (
                <> 
                    {(this.props.loader || loader) && (<Spinner />)}
                    <div className="main_changable_container">
                        <div className="config_add_group_form">
                            <div className="app_category_head">
                                <p>
                                    {id?"Edit Asset":"Add Asset"} 
                                </p>
                            </div>
                                <Formik
                                    enableReinitialize
                                    initialValues={this.state}
                                    onSubmit={(values) => {
                                        this.handleOnSubmit(values)
                                    }}
                                    validationSchema={Yup.object().shape({
                                        name: Yup.string().required(`Asset name can't be empty`)
                                        .matches(SPECIAL_CHARACTERS_ERROR_REGEX, { message: getRegexErrorMessage('asset name'), excludeEmptyString: true }),
                                        descriptions: Yup.string().required(`Description can't be empty`),
                                    })}
                                >
                                    {props => {
                                        const { 
                                            values, touched, errors, handleChange,
                                            handleBlur, handleSubmit 
                                        } = props;
                                        return (
                                            <div>
                                                <div className="edit_app_detils_form_cont">
                                                    <form className="form_up_box">
                                                        <div className="floating-label col-md-6" style={{ display: 'block' }}>
                                                            <input
                                                                name='name'
                                                                placeholder=" "
                                                                type='text'
                                                                value={values.name}
                                                                onChange={handleChange}
                                                                onBlur={handleBlur}
                                                                className={errors.name && touched.name ? 'floating-input Invalid' : 'floating-input'}
                                                            />
                                                            <label>Name</label>
                                                            {errors.name && touched.name && <span style={{ color: 'red', marginTop: '.15rem', marginLeft: '.25rem' }}>{errors.name}</span>}
                                                        </div>
                                                        <div className="floating-label col-md-6" style={{ display: 'block' }} >
                                                            <input
                                                                name='descriptions'
                                                                placeholder=" "
                                                                type='text'
                                                                value={values.descriptions}
                                                                onChange={handleChange}
                                                                onBlur={handleBlur}
                                                                className={errors.descriptions && touched.descriptions ? 'floating-input Invalid' : 'floating-input'}
                                                            />
                                                            <label>Description</label>
                                                            {errors.descriptions && touched.descriptions && <span style={{ color: 'red', marginTop: '.15rem', marginLeft: '.25rem' }}>{errors.descriptions}</span>}
                                                        </div>
                                                    </form>
                                                </div>
                                                <div className="cancel_publish_btn">
                                                    <NavLink to={`/inventory/asset?page=${next}`}>
                                                        <button type='button' className="fancy_btn">Cancel</button>
                                                    </NavLink>
                                                    <button type="button" disabled={!(values.name && values.descriptions)} className="fancy_btn active" onClick={handleSubmit}>{id?'Save':'Add'}</button>
                                                </div>
                                            </div>
                                        );
                                    }}
                                </Formik>
                        </div>
                    </div>
                </>
            )
        }
    }

const mapStateToProps = (state) => ({
    loader: state.asset.loader,
    error: state.asset.error
})

const mapDispatchToProps = {
    editAsset,
    createAsset,
    addToast,
}

export default connect(mapStateToProps, mapDispatchToProps)(AssetEdit);