/* eslint-disable react-hooks/exhaustive-deps */
import React, {
    useState,
    useEffect,
} from 'react'
import { connect } from 'react-redux'
import { NavLink, useLocation, useParams } from 'react-router-dom'

import routes from 'urls'
import { ITEMS_PER_PAGE } from 'Data/constants'
import { isMobile, parseQueryString } from 'containers/utils'
import Spinner from 'components/UI/Spinner/Spinner'
import EzedoxPagination from 'components/UI/Pagination/Pagination'
import FilterDropdown from 'components/UI/FilterDropdown/FilterDropdown'
import {
    fetchJobs,
    fetchJobRoles,
    fetchLocations,
} from 'store/actions/index'

import banner from 'assets/images/job-portal.svg'
import NoRecordsImg from 'assets/images/no_records.png'
import ErrorPage from "../../ErrorPage";
import './JobPortal.css'

export const STATE_LIST = [{
    id: '0',
    type: 'states',
    name: 'Select State'
}]

export const CITY_LIST = [{
    id: '0',
    type: 'cities',
    name: 'Select City'
}]

export const LOCATION_LIST = [{
    id: '0',
    type: 'locations',
    name: 'Select Location'
}]

export const JOB_ROLE_LIST = [{
    id: '0',
    type: 'jobRoles',
    name: 'Select Job Role'
}]

function JobPortalErrorComponent(props) {
    return props.org.orgExists ? <JobPortal {...props} /> : <ErrorPage />;
}

const JobPortal = props => {
    const {
        org,
        jobs,
        loader,
        states,
        cities,
        history,
        getJobs,
        locations,
        totalCount,
        storedCity,
        getJobRoles,
        storedState,
        getLocations,
        // storedFilters,
        jobRoles = [],
        storedJobRole,
        storedLocation,
    } = props

    const locationInfo = useLocation()
    const { page = 1 } = parseQueryString(locationInfo.search)
    const { uuid: orgId } = useParams();

    const [currentPage, setCurrentPage] = useState(Number(page))
    const [selectedState, setSelectedState] = useState(storedState)
    const [selectedCity, setSelectedCity] = useState(storedCity)
    const [selectedLocation, setSelectedLocation] = useState(storedLocation)
    const [selectedJobRole, setSelectedJobRole] = useState(storedJobRole)

    useEffect(() => {
        setCurrentPage(Number(page) || 1)
    }, [page])

    const searchHandler = () => {
        if (
            selectedJobRole.id === JOB_ROLE_LIST[0].id
            && selectedState.id === STATE_LIST[0].id
            && selectedCity.id === CITY_LIST[0].id
            && selectedLocation.id === LOCATION_LIST[0].id
        ) getJobs(orgId, currentPage, {}, {}, history)
        else {
            let filters = {}
            let extraParams = {}
            if (selectedJobRole.id !== JOB_ROLE_LIST[0].id) {
                filters.role__name = selectedJobRole.name
                extraParams.jobRole = selectedJobRole
            }

            if (selectedState.id !== STATE_LIST[0].id) {
                filters.work_location__extra_fields__state = selectedState.name
                extraParams.state = selectedState

                if (selectedCity.id !== CITY_LIST[0].id) {
                    filters.work_location__extra_fields__city = selectedCity.name
                    extraParams.city = selectedCity

                    if (selectedLocation.id !== LOCATION_LIST[0].id) {
                        filters.work_location__name = selectedLocation.name
                        extraParams.locationData = selectedLocation
                    }
                }
            }

            getJobs(orgId, currentPage, filters, extraParams, history)

        }

    }

    useEffect(() => {
        getJobRoles(orgId)
        getLocations(orgId, STATE_LIST[0].type)
    }, [orgId])

    useEffect(() => {
        history.replace({
            pathname: '',
            search: `?page=${currentPage}`
        })
        searchHandler()
    }, [currentPage])

    useEffect(() => {
        if (selectedState.id !== STATE_LIST[0].id) getLocations(CITY_LIST[0].type, selectedState.name)

        setSelectedCity({
            id: "0",
            type: "cities",
            name: "Select City"
        });
        setSelectedLocation({
            id: "0",
            type: "locations",
            name: "Select Location"
        });

    }, [selectedState])

    useEffect(() => {

        if (selectedCity.id !== CITY_LIST[0].id) getLocations(LOCATION_LIST[0].type, selectedState.name, selectedCity.name)

        setSelectedLocation({
            id: "0",
            type: "locations",
            name: "Select Location"
        });

    }, [selectedCity])

    const stateList = [
        ...STATE_LIST,
        ...states,
    ]

    const cityList = [
        ...CITY_LIST,
        ...cities,
    ]

    const locationList = [
        ...LOCATION_LIST,
        ...locations,
    ]

    const jobRoleList = [
        ...JOB_ROLE_LIST,
        ...jobRoles,
    ]

    const dropdownOnChangeHandler = (id, dataType) => {
        let selectedValue = {}

        switch (dataType) {
            case STATE_LIST[0].type:
                selectedValue = stateList.filter(item => item.id === id)
                setSelectedState(selectedValue[0])
                break
            case CITY_LIST[0].type:
                selectedValue = cityList.filter(item => item.id === id)
                setSelectedCity(selectedValue[0])
                break
            case LOCATION_LIST[0].type:
                selectedValue = locationList.filter(item => item.id === id)
                setSelectedLocation(selectedValue[0])
                break
            case JOB_ROLE_LIST[0].type:
                selectedValue = jobRoleList.filter(item => item.id === id)
                setSelectedJobRole(selectedValue[0])
                break
            default:
                break;
        }
    }

    return (
        <div className='job-portal'>
            {loader && <Spinner />}
            <div className='portal-container' id='container1'>
                <div className='sub-container'>
                    <h3 className='title'>CURRENT JOB OPENINGS</h3>
                    <div className='desc'>{org?.description}</div>
                </div>
                <div className='banner-img-container'>
                    <img
                        src={banner}
                        className='banner-img'
                        alt='Job Portal Banner'
                    />
                </div>
                <div className='filters'>
                    <FilterDropdown
                        show
                        list={stateList}
                        selectedItem={selectedState.name}
                        classes='job-portal-state-dropdown'
                        onItemClickHandler={id => dropdownOnChangeHandler(id, STATE_LIST[0].type)}
                    />
                    <FilterDropdown
                        show
                        list={cityList}
                        selectedItem={selectedCity.name}
                        classes='job-portal-city-dropdown'
                        disableComponent={loader || selectedState.id === STATE_LIST[0].id}
                        onItemClickHandler={id => dropdownOnChangeHandler(id, CITY_LIST[0].type)}
                    />
                    <FilterDropdown
                        show
                        list={locationList}
                        selectedItem={selectedLocation.name}
                        classes='job-portal-location-dropdown'
                        onItemClickHandler={id => dropdownOnChangeHandler(id, LOCATION_LIST[0].type)}
                        disableComponent={loader || selectedState.id === STATE_LIST[0].id || selectedCity.id === CITY_LIST[0].id}
                    />
                    <FilterDropdown
                        show
                        list={jobRoleList}
                        selectedItem={selectedJobRole.name}
                        classes='job-portal-job-role-dropdown'
                        onItemClickHandler={id => dropdownOnChangeHandler(id, JOB_ROLE_LIST[0].type)}
                    />
                    <button
                        type='button'
                        onClick={() => searchHandler()}
                        className='fancy_btn active search-btn'
                        disabled={loader}
                    >
                        Search Job
                    </button>
                </div>
            </div>
            <div className='container' id='container2'>
                <div className='job-list'>
                    {
                        !loader && jobs.length === 0 && (
                            <div className='no-data'>
                                <img src={NoRecordsImg} alt='No Records' />
                                <div>Looks like you don&#39;t have any jobs</div>
                            </div>
                        )
                    }
                    {
                        jobs.map(job => (
                            <div className='job-row' key={job.id}>
                                <div className='job-title'>{job.job_title}</div>
                                <div className='job-location'>
                                    {isMobile() ? <strong>Location: </strong> : ''}
                                    {job.work_location_name}
                                </div>
                                <div className='job-role'>
                                    {isMobile() ? <strong>Role: </strong> : ''}
                                    {job.role_name}
                                </div>
                                <div className='view-btn'>
                                    <NavLink to={routes.JOB_PORTAL_VIEW.to(orgId, job.id)}>
                                        View Details
                                    </NavLink>
                                </div>
                            </div>
                        ))
                    }
                </div>
                <EzedoxPagination
                    active={currentPage}
                    taskCount={totalCount}
                    handlePageChange={setCurrentPage}
                    itemsCountPerPage={ITEMS_PER_PAGE}
                />
            </div>
        </div>
    )
}

const mapStateToProps = ({ jobPortal, orgLogo }) => ({
    jobs: jobPortal.jobs,
    loader: jobPortal.loader,
    jobRoles: jobPortal.jobRoles,
    totalCount: jobPortal.total,
    states: jobPortal.states,
    cities: jobPortal.cities,
    locations: jobPortal.locations,
    storedFilters: jobPortal.filters,
    storedState: jobPortal.state,
    storedCity: jobPortal.city,
    storedLocation: jobPortal.locationData,
    storedJobRole: jobPortal.jobRole,

    org: orgLogo,
})

const mapDispatchToProps = {
    getJobs: fetchJobs,
    getJobRoles: fetchJobRoles,
    getLocations: fetchLocations,
}

export default connect(mapStateToProps, mapDispatchToProps)(JobPortalErrorComponent)
