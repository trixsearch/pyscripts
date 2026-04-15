import React, { useEffect } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { connect } from "react-redux";

import MainContainer from 'components/UI/MainContainer';
import { DashboardProcessesCountContentLoader } from '../../../components/UI/ContentLoaders/ContentLoaders';
// import {setProcessFilter} from '../../../store/actions/index'

const ProcessCount = (props) => {
    const { uuid: orgId } = useParams();
    let processCount;
    let processKey;
    let contentLoader = <DashboardProcessesCountContentLoader />;
    // let processfilter = props.setProcessFilter


    if (!props.processCountLoader) {
        processCount = props.data;
        processKey = props.processKey;   
    }
    // useEffect(() => {
    //     if (props.filterOptions && props.selectedOption) {
    //         processfilter(props.filterOptions, props.selectedOption)
    //     }
    //   }, [processfilter, props.filterOptions, props.selectedOption])

    return (
            <div className="small_card_container">
                <NavLink
                    data-cy="ongoing-process-link"
                    className={`small_card_div ${props.unClickable? `default-cursor`:``}`}
                    to={props.unClickable ? {} :{ pathname: `/custom-workflow/org/${orgId}/process`, search : `?process_key=${processKey}&processType=Ongoing process&page=${1}` }}
                >
                    <p>Ongoing Process</p>
                    <MainContainer serverError={props.error} fallback="&#x26a0;&#xFE0F;">
                        <h1 data-cy="ongoing-count">{props.processCountLoader ? contentLoader :processCount.ongoing }</h1>
                    </MainContainer>
                </NavLink>
                <NavLink
                    data-cy="completed-process-link"
                    className={`small_card_div middle_small_card_div ${props.unClickable? `default-cursor`:``}`}
                    to={props.unClickable ? {} :{ pathname: `/custom-workflow/org/${orgId}/process`, search : `?process_key=${processKey}&processType=Completed process&page=${1}` }}
                >
                    <p>Completed Process</p>
                    <MainContainer serverError={props.error} fallback="&#x26a0;&#xFE0F;">
                        <h1 data-cy="completed-count">{props.processCountLoader ? contentLoader : processCount?.completed}</h1>
                    </MainContainer>
                </NavLink>
                <NavLink
                    data-cy="withdrawn-process-link"
                    className={`small_card_div ${props.unClickable? `default-cursor`:``}`}
                    to={props.unClickable ? {} :{ pathname: `/custom-workflow/org/${orgId}/process`, search : `?process_key=${processKey}&processType=Withdrawn process&page=${1}` }}
                >
                    <p>Withdrawn Process</p>
                    <MainContainer serverError={props.error} fallback="&#x26a0;&#xFE0F;">
                        <h1 data-cy="withdrawn-count">{props.processCountLoader ? contentLoader : processCount?.withdrawn}</h1>
                    </MainContainer>
                </NavLink>
            </div>
    )
}

const mapDispatchToProps = (dispatch) => ({
    // setProcessFilter: (filterOptions, selectedOption) => dispatch(setProcessFilter(filterOptions, selectedOption))
});

export default connect(({dashboard}) => ({
    error: dashboard.error
}), mapDispatchToProps)(ProcessCount);