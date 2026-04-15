import React, {
    useRef,
    useState,
    useEffect,
} from 'react'
import { useLocation } from 'react-router-dom'
import { connect } from 'react-redux'

import {
    CONFIG_VIEW_DASHBOARD,
    CONFIG_VIEW_PROCESS,
    CONFIG_VIEW_ENTITY,
    CONFIG_VIEW_EVENT,
    CONFIG_VIEW_JOB,
} from 'Data/constants'
import { parseQueryString } from 'containers/utils'
import Spinner from 'components/UI/Spinner/Spinner'
import ProcessConfigView from './ProcessConfigView'
import DashboardConfig from './DashboardConfig/DashboardConfig'
import EntityConfigView from './EntityConfigView'
import JobEventChartConfigView from './JobEventChartConfig/JobEventChartConfig'

import './ConfigView.css'

// Config Tab Creator Component
const ConfigViewTab = ({
    activeItem,
    itemType,
    selectedItem
}) => (
        <li
            role='presentation'
            onClick={() => selectedItem(itemType)}
            className={
                activeItem === itemType ? 'nav-item active' : 'nav-item'
            }
            style={{position: 'relative', top: 2}}
        >
            <a
                role='tab'
                data-toggle='tab'
                aria-selected='true'
                className='nav-link'
                href={`#${itemType}`}
            >
                {itemType}
            </a>
        </li>
    )

const ConfigView = (props) => {
    const {
        history,
        jobChartConfigPermission,
        // dynamicDashboardPermission,
        eventChartConfigPermission,
    } = props

    const locationInfo = useLocation()
    const { view = null } = parseQueryString(locationInfo.search)

    let active_tab = CONFIG_VIEW_JOB
    // let active_tab = CONFIG_VIEW_PROCESS
    // if (dynamicDashboardPermission) {
    //     active_tab = CONFIG_VIEW_DASHBOARD
    // }
    if (view === CONFIG_VIEW_JOB.toLowerCase()) active_tab = CONFIG_VIEW_JOB
    if (view === CONFIG_VIEW_EVENT.toLowerCase()) active_tab = CONFIG_VIEW_EVENT
    const [activeConfigView, setActiveConfigView] = useState(active_tab) // initial active tab
    const [loader, setLoader] = useState(true)
    const isInitialMount = useRef(null)

    useEffect(() => {
        if (isInitialMount.current) history.replace({ search: '' })
        else isInitialMount.current = true
    }, [activeConfigView, history])

    let context

    switch (activeConfigView) {
        case CONFIG_VIEW_DASHBOARD:
            context = (
                <DashboardConfig
                    loader={loader}
                    setLoader={setLoader}
                    {...props}
                />
            )
            break
        case CONFIG_VIEW_PROCESS:
            context = (
                <ProcessConfigView
                    loader={loader}
                    setLoader={setLoader}
                />
            )
            break
        case CONFIG_VIEW_ENTITY:
            context = (
                <EntityConfigView
                    loader={loader}
                    setLoader={setLoader}
                />
            )
            break
        case CONFIG_VIEW_JOB:
            context = (
                <JobEventChartConfigView
                    setLoader={setLoader}
                    pageType={CONFIG_VIEW_JOB}
                    {...props}
                />
            )
            break
        case CONFIG_VIEW_EVENT:
            context = (
                <JobEventChartConfigView
                    setLoader={setLoader}
                    pageType={CONFIG_VIEW_EVENT}
                    {...props}
                />
            )
            break
        default: context = null
    }

    return (
        <div className='config_view_page'>
            {loader && <Spinner />}
            <div className='config_view_body_container'>
                <ul
                    className='nav nav-tabs process_tab_ongoing_comp_ul config_view_tabs'
                    role='tablist'
                >
                    {/* {
                        dynamicDashboardPermission
                            ? (
                                <ConfigViewTab
                                    itemType={CONFIG_VIEW_DASHBOARD}
                                    activeItem={activeConfigView}
                                    selectedItem={setActiveConfigView}
                                />
                            ) : null
                    }
                    <ConfigViewTab
                        itemType={CONFIG_VIEW_PROCESS}
                        activeItem={activeConfigView}
                        selectedItem={setActiveConfigView}
                    />
                    <ConfigViewTab
                        itemType={CONFIG_VIEW_ENTITY}
                        activeItem={activeConfigView}
                        selectedItem={setActiveConfigView}
                    /> */}
                    {
                        jobChartConfigPermission
                            ? (
                                <ConfigViewTab
                                    itemType={CONFIG_VIEW_JOB}
                                    activeItem={activeConfigView}
                                    selectedItem={setActiveConfigView}
                                />
                            ) : null
                    }
                    {
                        eventChartConfigPermission
                            ? (
                                <ConfigViewTab
                                    itemType={CONFIG_VIEW_EVENT}
                                    activeItem={activeConfigView}
                                    selectedItem={setActiveConfigView}
                                />
                            ) : null
                    }
                </ul>
                <div className='tab-content config_views_content'>
                    {context}
                </div>
            </div>
        </div>
    )
}

const mapStateToProps = ({ auth }) => ({
    dynamicDashboardPermission: auth.uiFeatures.organisationlicense.dynamicdashboard,
    jobChartConfigPermission: auth.uiFeatures.job.view && (auth.uiPermissions.job.view || auth.uiPermissions.jobcandidate.view),
    eventChartConfigPermission: auth.uiFeatures.hiringevent.view && auth.uiPermissions.hiringevent.view,
})

export default connect(mapStateToProps)(ConfigView)
