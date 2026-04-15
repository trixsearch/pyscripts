import React, {
    Fragment,
    useState,
    useEffect,
} from 'react'
import { NavLink, useLocation, useParams } from 'react-router-dom'
import { connect } from 'react-redux'
import axios from 'axios'
import AsyncSelect from 'react-select/async'

import {
    validator,
    parseQueryString,
    getRegexErrorMessage,
} from 'containers/utils'
import routes from 'urls'
import Spinner from 'components/UI/Spinner/Spinner'
import { addToast } from 'components/Toast/actions'
import { Button } from 'components/UI/AppButton/AppButton'
import { DropdownIndicator } from 'containers/Config/Utils/ConfigUtils'
import ErrorPage from '../../../ErrorPage'
import {
    editKit,
    createKit,
} from '../../../../store/actions/index'
import { reactSelectStyles } from '../../../Config/Utils/ReactSelectStyles'
import { handleAssetLoadOptions } from '../../InventoryComponent/KeywordSearch'

import '../Kit.css'

const KitCreateEdit = props => {
    const [error, setError] = useState(false)
    const [loader, setLoader] = useState(false)
    const [kitName, setKitName] = useState('')
    const [kitDescription, setKitDescription] = useState('')
    const [nameEmptyValidator, setNameEmptyValidator] = useState(false)
    const [descEmptyValidator, setDescEmptyValidator] = useState(false)
    const [list, setList] = useState([{
        asset: '',
        quantity: '',
    }])
    const [initialData, setInitialData] = useState(null)

    const currentKitId = props.match.params.id || null
    const location = useLocation()
    const { next = 1 } = parseQueryString(location.search)
    const { uuid: orgId } = useParams();

    const {
        kitLoader,
        history,
    } = props

    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
        if (currentKitId) {
            setLoader(true)
            axios.get(`/api/inventory/kit/${currentKitId}`)
                .then(res => res.data.data)
                .then(data => {
                    const {
                        name,
                        descriptions,
                        asset_details
                    } = data
                    setKitName(name)
                    setKitDescription(descriptions)
                    const assetDetails = asset_details.map(item => ({
                        asset: {
                            name: 'asset',
                            value: item.asset_id || '',
                            label: item.asset_name || '',
                        },
                        ...item
                    }))
                    setList(assetDetails)
                    const initialDataArr = {
                        name,
                        descriptions,
                        asset_details: asset_details.map(({
                            id, asset_id, quantity
                        }) => ({
                            id,
                            asset_id,
                            quantity,
                        }))
                    }
                    setInitialData(initialDataArr)
                })
                .catch(() => setError(true))
                .finally(() => setLoader(false))
        }
    }, [])

    const handleBlur = ({ target: { name, value } }) => {
        if (name === 'kitName') setNameEmptyValidator(value === '')
        else if (name === 'kitDescription') setDescEmptyValidator(value === '')
    }

    const handleChange = ({ target: { name, value } }) => {
        if (name === 'kitName') {
            setNameEmptyValidator(value === '')
            setKitName(value)
        } else if (name === 'kitDescription') {
            setDescEmptyValidator(value === '')
            setKitDescription(value)
        }
    }

    const addField = () => {
        setList([
            ...list,
            {
                asset: '',
                quantity: '',
            }
        ])
    }

    const handleChangeListItem = (index, e) => {
        const { name, value } = e.target || e
        let isDuplicate = false
        if (name === 'asset') {
            isDuplicate = list.some(item => item.asset.value === value)
        }
        if (isDuplicate) {
            props.addToast('error', 'Error', 'You have already added this asset in kit')
        } else {
            setList([
                ...list.map((item, i) => {
                    if (i === index) {
                        return name === 'asset'
                            ? {
                                ...item,
                                asset: e,
                            } : {
                                ...item,
                                quantity: parseInt(value, 10) || ''
                            }
                    }
                    return item
                })
            ])
        }
    }

    const handleDelete = idx => {
        setList([
            ...list.filter((item, index) => idx !== index)
        ])
    }

    const handleSubmit = () => {
        if (kitName === '' || kitDescription === '') {
            setNameEmptyValidator(kitName === '')
            setDescEmptyValidator(kitDescription === '')
        } else {
            const data = {
                name: kitName,
                descriptions: kitDescription,
                asset_details: list.map(item => (
                    currentKitId
                        ? {
                            id: item.id || '',
                            asset_id: item.asset.value || '',
                            quantity: item.quantity || '',
                        } : {
                            asset_id: item.asset.value || '',
                            quantity: item.quantity || '',
                        }
                ))
            }

            if (currentKitId) {
                props.editKit(currentKitId, data, history)
            } else {
                props.createKit(data, history)
            }
        }
    }

    let validatorList = []
    list.map(item => validatorList.push(item.asset === '' || item.quantity === '' || parseInt(item.quantity, 10) === 0))
    const hasErrorInAssetsList = validatorList.includes(true)

    const nameValidator = validator(kitName)
    let nameErrorMessage = ''
    if (nameEmptyValidator) nameErrorMessage = 'Kit Name should not be empty'
    else if (nameValidator) nameErrorMessage = getRegexErrorMessage('kit name')

    let isChangedInEditMode = false
    if (currentKitId) {
        const data = {
            name: kitName,
            descriptions: kitDescription,
            asset_details: list.map(item => (
                currentKitId
                    ? {
                        id: item.id || '',
                        asset_id: item.asset.value || '',
                        quantity: item.quantity || '',
                    } : {
                        asset_id: item.asset.value || '',
                        quantity: item.quantity || '',
                    }
            ))
        }
        isChangedInEditMode = JSON.stringify(initialData) !== JSON.stringify(data)
    }

    if (error) {
        return <ErrorPage />
    }
    return (
        <Fragment>

            <div className='kit-container'>
                {(loader || kitLoader) && <Spinner />}

                <h5>Kit</h5>

                <div className='form_up_box'>
                    <div className='floating-label col-md-4'>
                        <input
                            name='kitName'
                            placeholder=' '
                            value={kitName}
                            onBlur={handleBlur}
                            onChange={handleChange}
                            className='floating-input'
                            style={nameValidator || nameEmptyValidator ? { borderColor: '#d0021b', color: '#d0021b' } : {}}
                        />
                        <label>Kit Name</label>
                        {
                            nameValidator || nameEmptyValidator
                                ? (
                                    <span className='error-message-element'>
                                        {nameErrorMessage}
                                    </span>
                                )
                                : null
                        }
                    </div>

                    <div className='floating-label col-md-4'>
                        <input
                            placeholder=' '
                            onBlur={handleBlur}
                            name='kitDescription'
                            value={kitDescription}
                            onChange={handleChange}
                            className='floating-input'
                            style={descEmptyValidator ? { borderColor: '#d0021b', color: '#d0021b' } : {}}
                        />
                        <label>Kit Description</label>
                        {
                            descEmptyValidator
                                ? (
                                    <span className='error-message-element'>
                                        Kit description should not be empty
                                    </span>
                                )
                                : null
                        }
                    </div>
                </div>

                <div className='kit-assets-header'>
                    <h5 style={{ marginRight: 32 }}>Assets</h5>
                    <Button
                        onClick={addField}
                        variant='table-row-edit'
                    >
                        + Add
                    </Button>
                </div>

                <div className='kit-assets-container'>
                    <div className='form_up_box'>
                        {list.map((item, index) => (
                            <div key={`row_${index + 1}`} className='row col-md-12 m-0'>
                                <div className='floating-label col-md-4' style={{ display: 'block' }} >
                                    <AsyncSelect
                                        value={item.asset}
                                        styles={reactSelectStyles}
                                        noOptionsMessage={() => null}
                                        placeholder='Search for Asset'
                                        components={{ DropdownIndicator }}
                                        loadOptions={handleAssetLoadOptions}
                                        onChange={e => handleChangeListItem(index, e)}
                                    />
                                    <label className='react-select-label'>Asset</label>
                                </div>

                                <div className='floating-label col-md-4' style={{ display: 'block' }} >
                                    <input
                                        min='1'
                                        type='number'
                                        name='quantity'
                                        placeholder=' '
                                        value={item.quantity || ''}
                                        className='floating-input'
                                        onChange={e => handleChangeListItem(index, e)}
                                    />
                                    <label>Quantity</label>
                                </div>

                                <div className='floating-label col-md-3'>
                                    <div className='delete-button-container'>
                                        <Button
                                            icon='glyphicon glyphicon-remove'
                                            onClick={() => handleDelete(index)}
                                            variant='lists-option-row-delete btn btn-disabled btn-circle'
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className='kit-footer'>
                    <NavLink to={routes.KIT_LIST.to(orgId, next)}>
                        <Button
                            variant='secondary'
                        >
                            Cancel
                        </Button>
                    </NavLink>
                    <Button
                        variant='primary'
                        onClick={handleSubmit}
                        disabled={
                            !list.length
                                || nameValidator
                                || kitName === ''
                                || kitDescription === ''
                                || hasErrorInAssetsList
                                || currentKitId ? !isChangedInEditMode : false
                        }
                    >
                        {currentKitId ? 'Save' : 'Add'}
                    </Button>
                </div>
            </div>
        </Fragment>
    )
}

const mapStateToProps = ({ kit }) => ({
    kitLoader: kit.loader
})

const mapDispatchToProps = {
    editKit,
    createKit,
    addToast,
}

export default connect(mapStateToProps, mapDispatchToProps)(KitCreateEdit)
