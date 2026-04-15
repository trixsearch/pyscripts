/* eslint-disable react-hooks/exhaustive-deps */
import React, {
    Fragment,
    useState,
    useEffect,
} from 'react'
import { connect } from 'react-redux'
import { NavLink, useLocation, useParams } from 'react-router-dom'
import axios from 'axios'

import { CONFIG_VIEW_JOB } from 'Data/constants'
import { parseQueryString, getRegexErrorMessage, validator } from 'containers/utils'
import Spinner from 'components/UI/Spinner/Spinner'
import { addToast } from 'components/Toast/actions'
import { Button } from 'components/UI/AppButton/AppButton'
import FilterDropdown from 'components/UI/FilterDropdown/FilterDropdown'
import { getRoles } from 'store/actions'
import { DefaultChartComponents } from './constants'

import './JobEventChartConfig.css'

const APP_URL = process.env.REACT_APP_APP_URL;

const ChartTypes = [
    {
        id: 'bar',
        name: 'Bar Chart'
    },
    {
        id: 'pie',
        name: 'Pie Chart'
    },
    {
        id: 'line',
        name: 'Line Chart'
    },
    {
        id: 'funnel',
        name: 'Funnel Chart'
    },
]

const JobEventChartConfigCreateEdit = props => {
    const {
        // roles,
        history,
        addToaster,
        // getAllRoles,
    } = props

    const jobEventChartConfigId = props.match.params.id
    const { uuid: orgId } = useParams();

    const locationInfo = useLocation()
    const { next = 1, pageType = '' } = parseQueryString(locationInfo.search)
    const apiSignature = pageType === CONFIG_VIEW_JOB ? 'job_config' : 'event_config'

    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [loader, setLoader] = useState(false)
    const [components, setComponents] = useState([])
    const [chartContents, setChartContents] = useState([])
    // eslint-disable-next-line no-unused-vars
    const [role, setRole] = useState({
        id: '',
        name: 'Select a Role'
    })

    useEffect(() => {
        function fetchChartContents() {
            const url = `${APP_URL}/${orgId}/config/chart_name`
            setLoader(true)
            axios.get(url)
                .then(res => {
                    if (res.data.data && res.data.data.length > 0) {
                        const values = res.data.data[0].charts
                        const currentChartContents = values.map(item => ({
                            id: item,
                            name: item.match(/[A-Z][a-z]+/g).join(' ')
                        }))
                        setChartContents(currentChartContents)
                    }
                })
                .catch(err => {
                    if (err.response?.data.message) addToaster('error', 'Error', err.response.data.message)
                    else addToaster('error', 'Error', 'Something went wrong in fetching the Chart names')
                })
                .finally(() => setLoader(false))
        }

        if (jobEventChartConfigId) {

            const url = `${APP_URL}/${orgId}/config/${apiSignature}/${jobEventChartConfigId}`
            setLoader(true)
            axios.get(url)
                .then(res => {
                    const data = res.data
                    setName(data.name)
                    setDescription(data.description)
                    setRole({
                        id: data.role,
                        name: data.role_name,
                    })
                    setComponents(data.grid_data)
                })
                .catch(err => {
                    if (err.response?.data.message) addToaster('error', 'Error', err.response.data.message)
                    else addToaster('error', 'Error', 'Something went wrong in fetching the current job charts configuration details')
                })
                .finally(() => setLoader(false))
        }

        fetchChartContents()
        // getAllRoles(orgId, 'Owner')
    }, [orgId])

    const commonFilterDropdownChangeHandler = (id, data) => data.filter(item => item.id === id)[0]

    // const handleRoleChange = id => {
    //     setRole(commonFilterDropdownChangeHandler(id, roles))
    // }

    const addAttribute = () => {
        setComponents([
            ...components,
            {
                title: '',
                chartType: {
                    id: '',
                    name: 'Select Chart Type'
                },
                chartContent: {
                    id: '',
                    name: 'Select Chart Content'
                },
            },
        ])
    }

    const deleteAttribute = index => {
        let currentComponents = [...components]
        currentComponents.splice(index, 1)
        setComponents(currentComponents)
    }

    const findDuplicates = (list, data) => list.some(item => data.chartType.id === item.chartType.id && data.chartContent.id === item.chartContent.id)

    const findDefaultDuplicates = (list, data) => list.some(item => data.chartType.id === item.chartType.id && data.chartContent.id === item.chartContent.id)

    const handleRowDropdownChange = (id, data, index, key) => {
        const value = commonFilterDropdownChangeHandler(id, data)
        let currentComponents = [...components]
        currentComponents[index] = {
            ...currentComponents[index],
            [key]: { ...value }
        }
        let restComponents = [...currentComponents]
        restComponents.splice(index, 1)
        const isDuplicate = findDuplicates(restComponents, currentComponents[index])
        const isDefaultDuplicate = findDefaultDuplicates(DefaultChartComponents, currentComponents[index])
        if (!isDuplicate && !isDefaultDuplicate) setComponents(currentComponents)
        if (isDuplicate) addToaster('info', 'Info', 'You could not duplicate the chart configuration', 3000)
        if (isDefaultDuplicate) addToaster('info', 'Info', 'You could not duplicate the default chart configuration', 3000)
    }

    const handleChangeTitle = (index, value) => {
        let currentComponents = [...components]
        currentComponents[index] = {
            ...currentComponents[index],
            title: value
        }
        setComponents(currentComponents)
    }

    const handleSave = () => {
        const url = jobEventChartConfigId
            ? `${APP_URL}/${orgId}/config/${apiSignature}/${jobEventChartConfigId}`
            : `${APP_URL}/${orgId}/config/${apiSignature}`
        const data = {
            name,
            description,
            // role: role.id,
            grid_data: components,
        }

        setLoader(true)
        axios({
            method: jobEventChartConfigId ? 'put' : 'post',
            url,
            data,
        })
            .then(res => {
                addToaster('success', 'Success', res.data.message)
                history.push(`/custom-workflow/org/${orgId}/config/view?view=${pageType.toLowerCase()}&page=${next}`)
            })
            .catch(err => {
                if (err.response?.data.message) addToaster('error', 'Error', err.response.data.message)
                else addToaster('error', 'Error', 'Something went wrong')
            })
            .finally(() => setLoader(false))
    }

    const nameValidator = validator(name)

    const isEmpty = () => {
        if (
            components
            && Array.isArray(components)
            && components.length > 0
        ) {
            const isEmptyComponent = components.some(item => item.chartType.id === '' || item.chartContent.id === '' || item.title === '')
            return isEmptyComponent
        }
        return true
    }

    return (
        <Fragment>
            {loader && <Spinner />}
            <div className='main_changable_container' style={{ marginTop: '10px' }}>
                <div className='job-chart-config-create-edit-page'>
                    <div id='job-config-container1' className='form_up_box'>
                        <div className='config-job-form-fields floating-label displayBlock'>
                            <input
                                name='name'
                                type='text'
                                value={name}
                                className='floating-input'
                                onChange={({ target }) => setName(target.value)}
                                style={nameValidator ? { borderColor: '#d0021b', color: '#d0021b' } : {}}
                            />
                            <label>Name</label>
                        </div>
                        <div className='config-job-form-fields floating-label displayBlock'>
                            <input
                                type='text'
                                name='description'
                                value={description}
                                className='floating-input'
                                onChange={({ target }) => setDescription(target.value)}
                            />
                            <label>Description</label>
                        </div>

                        {/* <div className='config-job-filter-dropdown'>
                            <FilterDropdown
                                list={roles}
                                selectedItem={role.name}
                                onItemClickHandler={handleRoleChange}
                                classes='job_config_view_role_dropdown'
                            />
                        </div> */}
                    </div>
                    <div id='job-config-container2'>
                        {
                            nameValidator
                                ? (<div className='error-message-element' style={{ color: 'red', fontSize: '14px' }}>{getRegexErrorMessage('name')}</div>)
                                : null
                        }
                    </div>
                    <div id='job-config-container3'>
                        <div className='app_category_head'>
                            <p>Default Charts Config</p>
                        </div>
                        <div className='default-config-rows'>
                            {DefaultChartComponents.map((entry, index) => (
                                <div key={`job-default-config-row-${index + 1}`} className='config-row'>
                                    <span>{index + 1}</span>
                                    <FilterDropdown
                                        disableComponent
                                        list={ChartTypes}
                                        selectedItem={entry.chartType.name}
                                    />
                                    <FilterDropdown
                                        disableComponent
                                        list={chartContents}
                                        selectedItem={entry.chartContent.name}
                                    />
                                    <div className='form_up_box'>
                                        <div className='config-job-form-fields floating-label displayBlock'>
                                            <input
                                                disabled
                                                type='text'
                                                name='title'
                                                value={entry.title}
                                                className='floating-input'
                                            />
                                            <label>Title</label>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div id='job-config-container4'>
                        <div className='app_category_head'>
                            <p>Dynamic Charts Config</p>
                            <Button
                                variant='table-row-edit'
                                onClick={() => addAttribute()}
                            >
                                +  Add
                            </Button>
                        </div>
                        <div className='config-rows'>
                            {components.map((entry, index) => (
                                <div key={`job-config-row-${index + 1}`} className='config-row'>
                                    <span>{index + 1}</span>
                                    <FilterDropdown
                                        list={ChartTypes}
                                        selectedItem={entry.chartType.name}
                                        classes={`${apiSignature}_view_chart_type_dropdown`}
                                        onItemClickHandler={id => handleRowDropdownChange(id, ChartTypes, index, 'chartType')}
                                    />
                                    <FilterDropdown
                                        list={chartContents}
                                        selectedItem={entry.chartContent.name}
                                        classes={`${apiSignature}_view_chart_name_dropdown`}
                                        onItemClickHandler={id => handleRowDropdownChange(id, chartContents, index, 'chartContent')}
                                    />
                                    <div className='form_up_box'>
                                        <div className='config-job-form-fields floating-label displayBlock'>
                                            <input
                                                type='text'
                                                name='title'
                                                value={entry.title}
                                                className='floating-input'
                                                onChange={({ target }) => handleChangeTitle(index, target.value)}
                                            />
                                            <label>Title</label>
                                        </div>
                                    </div>
                                    <Button
                                        icon='glyphicon glyphicon-remove'
                                        onClick={() => deleteAttribute(index)}
                                        variant='btn btn-disabled btn-circle'
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className='cancel_publish_btn'>
                        <NavLink to={`/custom-workflow/org/${orgId}/config/view?view=${pageType.toLowerCase()}&page=${next}`}>
                            <button
                                type='button'
                                className='fancy_btn'
                                style={{marginRight: 10}}
                            >
                                Cancel
                            </button>
                        </NavLink>
                        <Button
                            variant='primary'
                            onClick={handleSave}
                            disabled={
                                (!name || nameValidator)
                                || isEmpty()
                            }
                        >
                            Save
                        </Button>
                    </div>
                </div>
            </div>
        </Fragment>
    )
}

const mapStateToProps = ({ users }) => ({
    roles: users.roles,
})

const mapDispatchToProps = {
    addToaster: addToast,
    getAllRoles: getRoles,
}

export default connect(mapStateToProps, mapDispatchToProps)(JobEventChartConfigCreateEdit)
