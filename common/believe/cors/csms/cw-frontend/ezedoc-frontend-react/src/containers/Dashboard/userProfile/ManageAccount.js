import React, { useState } from 'react'
import { connect } from 'react-redux'
import moment from 'moment'

import { PROCESS_DATETIME_FORMAT } from 'Data/constants'
import { Button } from 'components/UI/AppButton/AppButton'
import { orgLogoUpdate, updateOrgAddress } from 'store/actions/index'
import './userProfile_manageAC.css'

const ManageAccount = props => {
    const {
        org,
        orgLogoUpdateAction,
        updateOtherDetailsAction,
    } = props

    // eslint-disable-next-line no-unused-vars
    const [file, setFile] = useState(null)
    const [cin, setCin] = useState(org.cin || '')
    const [pan, setPan] = useState(org.pan || '')
    const [gstin, setGstin] = useState(org.gstn || '')
    const [orgDesc, setOrgDesc] = useState(org.description || '')
    const [orgAddress, setOrgAddress] = useState(org.org_address || '')

    const onChangeLogoStatus = () => setFile(null)

    const onChange = (e) => {
        setFile(e.target.files[0])
        let data = {
            id: org.id,
            name: org.name,
            logo: e.target.files[0],
            show_org_name: org.showOrgName,
        }
        orgLogoUpdateAction(data, onChangeLogoStatus)
        e.target.value = null
    }

    const updateOtherDetails = () => {
        let data = {}

        if (cin) data.cin = cin
        if (pan) data.pan = pan
        if (gstin) data.gstn = gstin
        if (orgDesc) data.description = orgDesc
        if (orgAddress) data.org_address = orgAddress

        if (data) updateOtherDetailsAction(org, data)
    }

    let signedUpOn = null
    // var expiredOn = null
    if (org.createdAt) {
        let createdAt = new Date(org.createdAt)
        signedUpOn = moment(createdAt).format(PROCESS_DATETIME_FORMAT)
        createdAt.setMonth(createdAt.getMonth() + 1)
        // expiredOn = createdAt.toLocaleDateString()
    }

    let orgPlaceHolder = ' '
    let createOrglogo = null
    if (!org.logo && org.name) {
        orgPlaceHolder = org.name.charAt(0)
        createOrglogo = (
            <div className='orglogo-container'>
                <div className='orglogo-text'>{orgPlaceHolder}</div>
            </div>
        )
    }

    return (
        <div className='manage_account_page'>
            <div className='col-md-4'>
                <div className='col-md-8'>
                    {org.logo ? (
                        <img
                            className='img-responsive'
                            src={org.logo}
                            alt='Logo'
                        />
                    ) : (
                            <div>{createOrglogo}</div>
                        )}
                </div>
                <div className='col-md-4' />
                <div className='manage_ap_text col-md-12'>
                    <span>Company Profile</span>
                    <span className='manage_profile_underline' />
                </div>
                <div className='manage_ap_details col-md-12'>
                    <div className='manage_ap_name'>{org.name}</div>
                    <small className='text_green'>Company</small>
                </div>
                <div className='manage_ap_emp col-md-12'>
                    <div className='manage_ap_emp_text'>Signed up on</div>
                    <small className='manage_ap_id text_green'>{signedUpOn}</small>
                </div>
            </div>
            <div className='col-md-8'>
                <div className='col-md-12'>
                    <div className='change_pass_text'>
                        <span className='pass_text'>License Details</span>
                        <span className='change_password_underline' />
                    </div>
                </div>

                <div className='col-md-12'>
                    <div className='col-md-6'>
                        <div className='manage_ap_name'>Custom Plan</div>
                    </div>
                    <div className='col-md-6'>
                        <div className='text_editor_btn_cont'>
                            <button type='button' disabled className='fancy_btn active'>
                                Upgrade
                            </button>
                        </div>
                    </div>
                </div>
                <div className='col-md-12'>
                    <div className='change_pass_text'>
                        <span className='pass_text'>Company Logo</span>
                        <span className='change_password_underline' />
                    </div>
                </div>
                <div className='col-md-12'>
                    <div className='col-md-6'>
                        <div className='manage_ap_name'>Change Company Logo</div>
                    </div>
                    <div className='col-md-6'>
                        <div className='text_editor_btn_cont'>
                            <label
                                className='fancy_btn active'
                                style={{
                                    color: '#fff',
                                    textAlign: 'center',
                                    display: 'table',
                                    padding: '10px',
                                    fontWeight: 'inherit',
                                }}
                            >
                                Upload
                                <input
                                    accept='image/jpeg,image/jpg,image/png,'
                                    type='file'
                                    style={{ display: 'none', textAlign: 'center' }}
                                    className='fancy_btn active'
                                    onChange={onChange}
                                    name='company_logo'
                                    placeholder='Upload Logo'
                                />
                            </label>
                        </div>
                    </div>
                </div>
                <div className='col-md-12'>
                    <hr className='block-divider' />
                </div>
                <div className='col-md-12'>
                    <div className='col-md-6'>
                        <span className='pass_text'>Company CIN</span>
                        <input
                            value={cin}
                            maxLength='120'
                            placeholder='Company CIN'
                            className='org-textfield'
                            onChange={({ target: { value } }) => setCin(value)}
                        />
                        <br />
                        <br />
                        <span className='pass_text'>Company PAN</span>
                        <input
                            value={pan}
                            maxLength='120'
                            placeholder='Company PAN'
                            className='org-textfield'
                            onChange={({ target: { value } }) => setPan(value)}
                        />
                        <br />
                        <br />
                        <span className='pass_text'>Company GSTIN</span>
                        <input
                            value={gstin}
                            maxLength='120'
                            placeholder='Company GSTIN'
                            className='org-textfield'
                            onChange={({ target: { value } }) => setGstin(value)}
                        />
                    </div>
                    <div className='col-md-6'>
                        <span className='pass_text'>Company Address</span>
                        <textarea
                            maxLength='120'
                            value={orgAddress}
                            placeholder='Company Address'
                            className='org-textarea'
                            onChange={({ target: { value } }) => setOrgAddress(value)}
                        />
                        <br />
                        <br />
                        <span className='pass_text'>Company Description</span>
                        <textarea
                            value={orgDesc}
                            maxLength='255'
                            className='org-textarea'
                            placeholder='Company Description'
                            onChange={({ target: { value } }) => setOrgDesc(value)}
                        />
                    </div>
                </div>
                <div className='col-md-12'>
                    <div className='text_editor_btn_cont'>
                        <Button
                            variant='primary'
                            onClick={updateOtherDetails}
                            disabled={!(orgAddress || orgDesc || cin || pan || gstin)}
                        >
                            Update
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

const mapStateToProps = ({ orgLogo }) => ({
    org: orgLogo,
})

const mapDispatchToProps = {
    orgLogoUpdateAction: orgLogoUpdate,
    updateOtherDetailsAction: updateOrgAddress,
}

export default connect(mapStateToProps, mapDispatchToProps)(ManageAccount)
