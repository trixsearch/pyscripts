import React, {
    Fragment,
    useState,
    useEffect,
} from 'react'
import { connect } from 'react-redux'
import { useParams } from 'react-router-dom'

import Spinner from 'components/UI/Spinner/Spinner'
import { Button } from 'components/UI/AppButton/AppButton'

import {
    getTopSource,
    getTotalApplicants,
    getTotalFilled,
    getTotalEvents,
    getTotalOpenings,
    getTotalRemaining,
} from 'store/actions/index'
import { CardComponent } from './utils'
import OverlayFilter from './OverlayFilter/OverlayFilter'

import './hiring-routes-common.css'
import './Hiring.css'

const Hiring = props => {
    const {
        loader,
        totalApplicants,
        topSources,
        totalFilled,
        totalOpenings,
        totalRemaining,
        totalActiveEvents,
        getTopSourceAction,
        getTotalApplicantsAction,
        getTotalEventsAction,
        getTotalFilledAction,
        getTotalOpeningsAction,
        getTotalRemainingAction,
    } = props

    const { uuid: orgId } = useParams();
    const [showFilter, setShowFilter] = useState(false)
    const [dynamicChartFilters, setDynamicChartFilters] = useState({})

    // if(partnerName) dynamicChartFilters.sourcing_partner__name = [partnerName]

    useEffect(() => {
        getTopSourceAction(orgId, dynamicChartFilters)
        getTotalApplicantsAction(orgId, dynamicChartFilters)
        getTotalEventsAction(orgId, dynamicChartFilters)
        getTotalFilledAction(orgId, dynamicChartFilters)
        getTotalOpeningsAction(orgId, dynamicChartFilters)
        getTotalRemainingAction(orgId, dynamicChartFilters)
    }, [
        orgId,
        getTopSourceAction,
        getTotalApplicantsAction,
        dynamicChartFilters,
        getTotalEventsAction,
        getTotalFilledAction,
        getTotalOpeningsAction,
        getTotalRemainingAction,
    ])

    return (
        <Fragment>
            {loader && <Spinner />}
            <div className='main_changable_container' style={{ height: window.innerHeight - 59 }}>
                <div className='process_details_tab_cont hiring-page'>
                    <ul className='process_tab_ongoing_comp_ul' id='myTab' role='tablist'>
                        <li className='process_tab_last_li'>
                            <div className='process_details_btn_cont'>
                                <Button
                                    variant='fancy_btn active'
                                    onClick={() => setShowFilter(true)}
                                >
                                    Filter
                                </Button>
                            </div>
                        </li>
                    </ul>
                    <div className='hiring-page-content'>
                        <div className='hiring-page-cards big-cards'>
                            <CardComponent
                                variant='big'
                                name='Total Openings'
                                count={totalOpenings || 0}
                                customClassNameForCount='stat-darkblue'
                            />
                            <CardComponent
                                variant='big'
                                name='Total Filled'
                                count={totalFilled || 0}
                                customClassNameForCount='stat-darkblue'
                            />
                            <CardComponent
                                variant='big'
                                name='Total Remaining'
                                count={totalRemaining || 0}
                                customClassNameForCount='stat-darkblue'
                            />
                        </div>
                        <div className='hiring-page-cards big-cards'>
                            <CardComponent
                                type={4}
                                count={topSources ? topSources[0]?.count || 'NA' : 'NA'}
                                count2={topSources ? topSources[1]?.count || '' : ''}
                                variant='big'
                                title='Top Source'
                                customClassNameForCount='stat-darkblue'
                                customClassNameForCount2='stat-darkblue'
                                name={topSources ? topSources[0]?.sourcing_partner__name || 'NA' : 'NA'}
                                name2={topSources ? topSources[1]?.sourcing_partner__name || '' : ''}
                            />
                            <CardComponent
                                count={totalApplicants}
                                variant='big'
                                name='Total Applications'
                                customClassNameForCount='stat-darkblue'
                            />
                            <CardComponent
                                variant='big'
                                count={totalActiveEvents || 0}
                                name='Total Active Events'
                                customClassNameForCount='stat-darkblue'
                            />
                        </div>
                    </div>
                </div>
                <OverlayFilter
                    showDateFilter={false}
                    showFilter={showFilter}
                    filterData={dynamicChartFilters}
                    filterDataHandler={setDynamicChartFilters}
                    onCloseHandler={() => setShowFilter(false)}
                />
            </div>
        </Fragment>
    )
}

const mapStateToProps = ({ hiring, auth }) => ({
    loader: hiring.loader,
    headCount: hiring.headCount,
    topSources: hiring.topSources,
    totalFilled: hiring.totalFilled,
    totalOpenings: hiring.totalOpenings,
    totalRemaining: hiring.totalRemaining,
    totalApplicants: hiring.applicants,
    totalActiveEvents: hiring.totalEvents,
    partnerName: auth.partner?.name,
})

const mapDispatchToProps = {
    getTopSourceAction: getTopSource,
    getTotalApplicantsAction: getTotalApplicants,
    getTotalEventsAction: getTotalEvents,
    getTotalFilledAction: getTotalFilled,
    getTotalOpeningsAction: getTotalOpenings,
    getTotalRemainingAction: getTotalRemaining,
}

export default connect(mapStateToProps, mapDispatchToProps)(Hiring)
