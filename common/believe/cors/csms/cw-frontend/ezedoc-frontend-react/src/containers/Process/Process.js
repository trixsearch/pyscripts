/* eslint-disable react-hooks/exhaustive-deps */

import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { HasAccess, usePlatformDataStoreSelector } from '../../platformDataStoreContext'
import UnauthorizedPage from '../UnauthorizedPage'

import {
    clearSearch,
    clearAllProcess,
} from '../../store/actions/index'

import './Process.css'
import { CW_SERVICE_PROCESSES_VIEW } from '../../Data/constants'
import { getAllApps } from '../../store/actions/Process/Process'
import { getTenantClientVendorTenantId } from '../../utils/process'
import ProcessBody from './ProcessBody'

const Processes = () => {
    const [selectedVendor, setSelectedVendor]=useState({
        loading: true
    });
    const [vendorList, setVendorList]=useState([]);
    const { uuid: orgId } = useParams();
    const platformState = usePlatformDataStoreSelector(
        (state) => state
    );
    const appData = useSelector(state => state?.process?.appData);
    const dispatch = useDispatch();


    useEffect(() => {
        if(orgId){
            dispatch(getAllApps(orgId));
        }
        return () => {
            dispatch(clearSearch()) // Clear the search data when un-mount the component
            dispatch(clearAllProcess()) // Clear all process data, process count, process type & size
        }
    }, [orgId, dispatch])

    useEffect(() => {
        if(appData?.custom_default_filter?.vendor && platformState?.auth?.permissions){
            setSelectedVendor({
                loading: true,
            })
            getTenantClientVendorTenantId(platformState?.auth?.permissions, CW_SERVICE_PROCESSES_VIEW, orgId).then(res => {
                setVendorList(res);
                setSelectedVendor({...(res[0] || {}), loading: false});
            }).catch(() => {
                setSelectedVendor({
                    loading: false
                });
            })
        } else if (appData?.name){
            setSelectedVendor({
                loading: false
            });
        }
    }, [platformState?.auth?.permissions, orgId, appData?.name])

    return (
        <React.Fragment>
            <HasAccess
                permissions={[CW_SERVICE_PROCESSES_VIEW]}
                yes={() => (
                    <div>
                        <ProcessBody 
                            vendorList={vendorList} 
                            selectedVendor={selectedVendor} 
                            setSelectedVendor={setSelectedVendor} 
                        />
                    </div>
                )}
                no={() => (
                    <UnauthorizedPage />
                )}
            />
        </React.Fragment>
    )
}

export default Processes
