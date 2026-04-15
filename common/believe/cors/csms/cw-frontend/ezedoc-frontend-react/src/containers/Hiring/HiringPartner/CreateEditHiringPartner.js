import React, {
    useState,
    useEffect,useRef
} from 'react'
import { connect } from "react-redux";
import { Formik } from 'formik';
import * as Yup from 'yup';
import axios from "axios";
import { NavLink, useLocation, useParams } from 'react-router-dom'
import routes from 'urls'
import { parseQueryString } from "containers/utils";
import FormikInput from '../../../components/UI/FormikInput';

import {
    createPartner,
    editPartner,
} from '../../../store/actions/Hiring/HiringPartner';
import Spinner from '../../../components/UI/Spinner/Spinner';
import { addToast } from '../../../components/Toast/actions';
import './HiringPartner.css';

const APP_URL = process.env.REACT_APP_APP_URL;

const CreateEditHiringPartner = props => {
    const [loader, setLoader] = useState(false)
    const [name, setName] = useState('')
    const [partnerType, setPartnerType] = useState('Hiring Agency')
    const [shortName, setShortName] = useState('')
    const [spocEmail, setSpocEmail] = useState('')
    const [active, setActive] = useState('active')
    const [partnerSubtype, setPartnerSubtype] = useState()
    const [initialData, setInitialData] = useState({})
    const [vendors, setVendors] = useState([])
    const [vendorId, setVendorId] = useState();
    const [validateName,setValidateName]=useState('');
    const [validateType,setValidateType]=useState('');
    const currentPartnerId = props.match.params.id || null
    const location = useLocation()
    const { next = 1 } = parseQueryString(location.search)
    const {
        partnerLoader,
        history
    } = props
    const { uuid: orgId } = useParams();

    const vendorError=useRef();
    const typeError=useRef();

    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
        if (currentPartnerId) {
            setLoader(true)
            axios.get(`${APP_URL}/${orgId}/jobs/hiring_partner/${currentPartnerId}`)
                .then(res => res.data.data)
                .then(data => {
                    setName(data.name)
                    setPartnerType(data.partner_type)
                    setShortName(data.short_name)
                    setSpocEmail(data.spoc_email)
                    setActive(data.active ? 'active' : 'inactive')
                    setPartnerSubtype(data.partner_subtype)
                    setVendorId(data.vendorId)
                    const resData = {
                        name: data.name,
                        short_name: data.short_name,
                        email:data.spoc_email,
                        partner_type: data.partner_type,
                        partner_subtype: data.partner_subtype,
                        active: data.active
                    }
                    setInitialData(resData)
                })
                .catch((error) => {
                    if (error.response) props.addToast('error', 'Error', error.response.data.message);
                    else props.addToast('error', 'Error', "Something went wrong");
                })
                .finally(() => setLoader(false))
        }
    }, [orgId])

    useEffect(() => {
        axios.get(`/api/customer-mgmt/org/${orgId}/vendor`)
        .then(res => setVendors(res?.data ?? []))
        .catch((error) => {
            if (error.response) {
                if (error.response.status === 403) props.addToast('error', 'Error', 'No vendor is configured from platform, please contact system administrator');
                else props.addToast('error', 'Error', error.response.data.message);
            } else props.addToast('error', 'Error', "Something went wrong");
        }) 
    }, [orgId])

    const handleOnSubmit = (values) => {
        const payload = {
            name:vendors.find(item=>item.vendorId===values.vendorId)?.name,
            short_name: values.shortName,
            spoc_email:values.spocEmail,
            
            partner_type: partnerType,
            partner_subtype: values.partnerSubtype,
            active: values.active === 'active',
            vendorId: values.vendorId,
            
        }
        if (JSON.stringify(initialData) === JSON.stringify(payload)) {
            props.addToast('error', 'Error', 'No changes detected')
        } else if (currentPartnerId) {
            props.editPartner(orgId, currentPartnerId, payload, history, next)
        } else {
            props.createPartner(orgId, payload, history, next)
        }
    }

    const validationSchema = {
        vendorId: Yup.string().required(`This Field can't be empty`),
        spocEmail:Yup.string().required(`This Field can't be empty`).email('Invalid email format'),
        shortName: Yup.string().required(`This Field can't be empty`).min(1),
        partnerSubtype: Yup.string().required(`This Field can't be empty`),
        active: Yup.string().required(`This Field can't be empty`)
    }

    const handleVendors=(e)=>{
        let vendorErrorText=vendorError.current;
        setValidateName(e.target.value)
       if(e.target.value!=='') {
           
        e.target.classList.remove('invalid')
        vendorErrorText.classList.add("display-none")
       } else{
        e.target.classList.add('invalid')  
        vendorErrorText.classList.remove("display-none")
        vendorErrorText.classList.add("errorStyle") 
       }
    }

    const handleType=(e)=>{
        let typeErrorText=typeError.current;
        setValidateType(e.target.value)
        if(e.target.value!=='') {
            e.target.classList.remove('invalid')
            typeErrorText.classList.add("display-none")
        } else{
            e.target.classList.add('invalid')  
            typeErrorText.classList.remove("display-none")
            typeErrorText.classList.add("errorStyle") 
        }
    }

    const validation=(values)=>{
    return !(validateName!=='' && values.spocEmail!=='' && values.shortName!=='' && validateType!=='')
    }

    return (
        <div>
            {(partnerLoader || loader) && (<Spinner />)}
            <div className="main_changable_container create-hiring-partner">
                <div className='config_add_group_form'>
                    <Formik
                        enableReinitialize
                        initialValues={{
                            name,
                            partnerType,
                            active,
                            partnerSubtype,
                            shortName,
                            spocEmail,
                            vendorId,
                        }}
                        onSubmit={(values, { setSubmitting }) => {
                            handleOnSubmit(values);
                            setSubmitting(false);
                        }}
                        validationSchema={Yup.object().shape({ ...validationSchema })}
                    >
                        {formikProps => {
                            const {
                                values, touched, errors, handleChange, handleBlur,
                                handleSubmit
                            } = formikProps;

                            return (
                                <>
                                    <div className='app_category_head'>
                                        <p>{currentPartnerId ? 'Edit Vendor' : 'Add Vendor'}</p>
                                    </div>
                                    <div className='edit_app_detils_form_cont'>
                                        <form className='form_up_box'>
                                            <div className="row col-md-12 m-0" style={{ height: 'auto' }}>
                                            
                                            <div className="floating-label col-md-6" style={{ display: 'block' }}>
                                                    <select
                                                        name="vendorId"
                                                        className="floating-select"
                                                        id="vendorI"
                                                        value={values.vendorId}
                                                        onChange={(e)=>{
                                                            handleChange(e)
                                                            handleVendors(e)
                                                        }}
                                                        onBlur={(e)=>{
                                                        handleBlur(e)
                                                        handleVendors(e)
                                                        }
                                                    }
                                                    >
                                                            <option value="">Select vendor</option>
                                                            {vendors.map((i) => (
                                                            <>
                                                            <option value={i.vendorId} >{i.name}</option>
                                                            </>
                                                            ))}
                                                    </select>
                                                    <div className="display-none" ref={vendorError} >Select vendor name</div>
                                                    <label className="react-select-label">
                                                    Name 
                                                    <span aria-hidden="true" style={{color:'red'}}> *</span>
                                                    </label>
                                            </div>
                                                <FormikInput
                                                    name='spocEmail'
                                                    label='SPOC Email'
                                                    values={values}
                                                    errors={errors}
                                                    touched={touched}
                                                    handleChange={handleChange}
                                                    handleBlur={handleBlur}
                                                    autoComplete="off"
                                                    className="col-md-6 mb-10 required"
                                                />
                                                <FormikInput
                                                    name='shortName'
                                                    label='Short Name'
                                                    values={values}
                                                    errors={errors}
                                                    touched={touched}
                                                    handleChange={handleChange}
                                                    handleBlur={handleBlur}
                                                    autoComplete="off"
                                                    className="col-md-6 mb-10 required"
                                                />
                                                <div className="floating-label col-md-6 mb-10" style={{ display: 'block' }}>
                                                    <select
                                                        name="partnerSubtype"
                                                        id="subType"
                                                        className="floating-select"
                                                        value={values.partnerSubtype}
                                                        onChange={(e)=>{
                                                            handleChange(e)
                                                            handleType(e)
                                                        }}
                                                        onBlur={(e)=>{
                                                        handleBlur()
                                                        handleType(e)
                                                        }}
                                                    >
                                                        <>
                                                            <option value="">Select a type</option>
                                                            <option value="Sourcing">Sourcing</option>
                                                            <option value="Staffing">Staffing</option>
                                                            <option value="Sourcing and Staffing">Sourcing and Staffing</option>
                                                        </>
                                                    </select>
                                                    <div className="display-none" ref={typeError} >Select a type</div>
                                                    <label className="react-select-label">
                                                    Type
                                                    <span aria-hidden="true" style={{color:'red'}}> *</span>
                                                    </label>
                                                </div>
                                                <div className="floating-label col-md-6">
                                                    <select
                                                        name="active"
                                                        className="floating-select"
                                                        value={values.active}
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                    >
                                                        {active === 'active' ? (
                                                            <>
                                                                <option value="active">Active</option>
                                                                <option value="inActive">Inactive</option>
                                                            </>
                                                        )
                                                            : (
                                                                <>
                                                                    <option value="inActive">Inactive</option>
                                                                    <option value="active">Active</option>
                                                                </>
                                                            )
                                                        }
                                                    </select>
                                                    <label className="react-select-label">Status</label>
                                                </div>
                                                
                                            </div>
                                        </form>
                                    </div>
                                    <div className='cancel_publish_btn'>
                                        <NavLink to={routes.HIRING_PARTNER_LIST.to(orgId, next)}>
                                            <button type="button" className='fancy_btn cancel_button'>Cancel</button>
                                        </NavLink>
                                        <button
                                            disabled={validation(values)}
                                            onClick={()=>{
                                                currentPartnerId ? window.sendEvent("Hire_Complete_vendor_edit",{
                                                    Edited_fields:JSON.stringify({name:validateName,spoc_email:values.spocEmail,short_name:values.shortName,type:validateType})
                                                            }) 
                                                : window.sendEvent("Hire_Vendors_added",{
                                                    Added_Vendor_Name:name
                                                            })
                                                handleSubmit()
                                            }}
                                            type='submit'
                                            className='fancy_btn active'
                                        >
                                            {currentPartnerId ? `Save` : `Add`}
                                        </button>
                                    </div>
                                    <div>&nbsp;</div>
                                </>
                            );
                        }}
                    </Formik>
                </div>
            </div>
        </div>
    )
}

const mapStateToProps = (hiringPartner) => ({
    partnerLoader: hiringPartner.loader
})

const mapDispatchToProps = {
    createPartner,
    editPartner,
    addToast
}

export default connect(mapStateToProps, mapDispatchToProps)(CreateEditHiringPartner);