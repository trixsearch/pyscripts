import React, {
    useState,
    useEffect
} from 'react'
import { NavLink, useLocation, useParams } from 'react-router-dom'
import { connect } from 'react-redux'
import axios from 'axios'
// import Datetime from 'react-datetime'

import routes from 'urls'
// import { DATE_FORMAT } from 'Data/constants'
import { parseQueryString } from 'containers/utils'
import { addToast } from 'components/Toast/actions'
import Spinner from 'components/UI/Spinner/Spinner'

import 'react-datetime/css/react-datetime.css'
import '../../InventoryComponent/react-datetime-tweak.css'

import './AdjustStock.css'

const types = [
    { key: 'DAMAGE', label: 'Damage' },
    { key: 'RECONCILE', label: 'Reconcile' }
]

const AdjustStock = props => {
    const [loader, setLoader] = useState(false)
    // const [adjustedAt, setAdjustedAt] = useState('')
    const [stockAssetId, setStockAssetId] = useState('')
    const [stockQuantity, setStockQuantity] = useState('')
    const [stockLocation, setStockLocation] = useState(' ')
    const [adjustmentType, setAdjustmentType] = useState('')
    const [stockAssetName, setStockAssetName] = useState(' ')
    const [stockLocationId, setStockLocationId] = useState(' ')
    // const [adjustmentReason, setAdjustmentReason] = useState(' ')
    const [quantityAdjustment, setQuantityAdjustment] = useState('')
    const [quantityAction, setQuantityAction] = useState('')

    const { user, history } = props

    const location = useLocation()
    const { next = 1 } = parseQueryString(location.search)
    const currentStockId = props.match.params.id || null
    const { uuid: orgId } = useParams();

    const getStockDetail = () => {
        if (currentStockId) {
            setLoader(true)
            axios.get(`/api/inventory/stocks/${currentStockId}`)
                .then(res => {
                    const {
                        quantity,
                        product,
                        asset_name,
                        location_detailed,
                    } = res.data.data

                    setStockAssetId(product)
                    setStockAssetName(asset_name)
                    setStockQuantity(quantity)
                    setStockLocation(location_detailed.name)
                    setStockLocationId(location_detailed.id)
                })
                .catch(err => {
                    if (err.response.data.message) props.addToast('error', 'Error', err.response.data.message)
                    else {
                        let message = err.message || 'Something went wrong, please try after sometime.'
                        addToast('error', 'Error', message)
                    }
                })
                .finally(() => setLoader(false))
        }
    }

    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
        getStockDetail()
    }, [])

    const handleChange = ({ target: { name, value } }) => {
        if (name === 'quantityAdjustment') setQuantityAdjustment(Math.abs(parseInt(value, 10)) || 0)
        else if (name === 'adjustmentType') {
            setAdjustmentType(value)
            if (value === 'DAMAGE') setQuantityAction('reduceQuantity')
        }
        // else if (name === 'adjustmentReason') setAdjustmentReason(value)
    }

    const handleRadioChecked = ({ target: { name, checked } }) => {
        if (adjustmentType !== 'DAMAGE' && checked) setQuantityAction(name)
    }

    // const handleAdjustedAt = data => {
    //     if (typeof (data) !== 'string') {
    //         setAdjustedAt(data)
    //     }
    // }

    const handleSubmit = () => {
        const payload = {
            user,
            asset: stockAssetId,
            location: stockLocationId,
            quantity: quantityAction === 'addQuantity' ? quantityAdjustment : -quantityAdjustment,
            adjustment_type: adjustmentType,
            // reason: adjustmentReason.trim(),
            // adjusted_at: adjustedAt.toISOString(),
        }

        setLoader(true)
        axios.post('/api/inventory/stockadjustment', payload)
            .then(res => {
                props.addToast('success', 'Success', res.data.message)
                history.push(routes.STOCK_LIST.to(orgId, next))
            })
            .catch(err => {
                if (err.response.data.message) props.addToast('error', 'Error', err.response.data.message)
                else {
                    let message = err.message || 'Something went wrong, please try after sometime.'
                    addToast('error', 'Error', message)
                }
            })
            .finally(() => setLoader(false))
    }

    const validator = () => {
        const currentQuantityAdjustment = quantityAction === 'addQuantity' ? quantityAdjustment : -quantityAdjustment

        return !(
            adjustmentType !== ''
            && quantityAdjustment !== ''
            && quantityAdjustment !== 0
            && quantityAction !== ''
            // && adjustmentReason.trim() !== ''
            // && adjustedAt !== ''
        ) || (
                // Not allowing any number as a adjustment quantity. Only adjust according to the current quantity presents.
                stockQuantity + currentQuantityAdjustment < 0
            )
    }

    return (
        <div className='stock-adjust-container'>
            <div className='main_changable_container'>
                <div className='stock-adjust-form'>
                    {loader && <Spinner />}

                    <div className='app_category_head'>
                        <p>Stock Details</p>
                    </div>

                    <div className='edit_app_detils_form_cont'>
                        <div className='form_up_box'>
                            <div className='floating-label col-md-4'>
                                <input
                                    disabled
                                    placeholder=' '
                                    name='stockAssetName'
                                    value={stockAssetName}
                                    className='floating-input'
                                />
                                <label>Asset Name</label>
                            </div>
                            <div className='floating-label col-md-4'>
                                <input
                                    disabled
                                    type='number'
                                    name='stockQuantity'
                                    value={stockQuantity}
                                    className='floating-input'
                                />
                                <label>Current Stock Quantity</label>
                            </div>
                            <div className='floating-label col-md-4'>
                                <input
                                    disabled
                                    placeholder=' '
                                    name='stockLocation'
                                    value={stockLocation}
                                    className='floating-input'
                                />
                                <label>Stock Location</label>
                            </div>
                        </div>

                    </div>

                    <br />

                    <div className='app_category_head'>
                        <p>Stock Adjustment Details</p>
                    </div>

                    <div className='edit_app_detils_form_cont'>
                        <div className='form_up_box'>

                            <div className='floating-label col-md-4'>
                                <select
                                    name='adjustmentType'
                                    value={adjustmentType}
                                    onChange={handleChange}
                                    className='floating-select adjustment-type-select'
                                >
                                    <option disabled value=''>Select a type</option>
                                    {
                                        types
                                        && Array.isArray(types)
                                        && types.map(type => (
                                            <option
                                                key={type.key}
                                                value={type.key}
                                            >
                                                {type.label}
                                            </option>
                                        ))
                                    }
                                </select>
                                <label>Type</label>
                            </div>

                            <div className='floating-label col-md-4 add-reduce-radio-buttons'>
                                <div className='radio-container'>
                                    <input
                                        type='radio'
                                        id='addQuantity'
                                        name='addQuantity'
                                        className='radio-input'
                                        onChange={handleRadioChecked}
                                        disabled={adjustmentType === 'DAMAGE'}
                                        checked={quantityAction === 'addQuantity'}
                                    />
                                    <span
                                        className={adjustmentType !== 'DAMAGE' ? 'radio-label' : 'radio-label disabled'}
                                        htmlFor='addQuantity'
                                        role='presentation'
                                        onClick={() => handleRadioChecked({
                                            target: {
                                                name: 'addQuantity',
                                                checked: true
                                            }
                                        })}
                                    >
                                        Add
                                    </span>
                                </div>
                                <div className='radio-container'>
                                    <input
                                        type='radio'
                                        id='reduceQuantity'
                                        name='reduceQuantity'
                                        className='radio-input'
                                        onChange={handleRadioChecked}
                                        checked={quantityAction === 'reduceQuantity'}
                                    />
                                    <span
                                        className='radio-label'
                                        htmlFor='reduceQuantity'
                                        role='presentation'
                                        onClick={() => handleRadioChecked({
                                            target: {
                                                name: 'reduceQuantity',
                                                checked: true
                                            }
                                        })}
                                    >
                                        Reduce
                                    </span>
                                </div>
                                <label>Action</label>
                            </div>

                            <div className='floating-label col-md-4 adjust-quantity'>
                                <input
                                    min='1'
                                    type='number'
                                    onChange={handleChange}
                                    name='quantityAdjustment'
                                    value={quantityAdjustment}
                                    className='floating-input'
                                />
                                <label>Quantity</label>
                            </div>

                            {/* <div className='floating-label col-md-6'>
                                <input
                                    placeholder=' '
                                    name='adjustmentReason'
                                    onChange={handleChange}
                                    value={adjustmentReason}
                                    className='floating-input'
                                />
                                <label>Adjustment Reason</label>
                            </div>

                            <div className='floating-label col-md-6 inventory_datetime'>
                                <span className='datetime-text'>Adjusted At</span>
                                <Datetime
                                    closeOnSelect
                                    dateFormat={DATE_FORMAT}
                                    value={adjustedAt}
                                    onChange={handleAdjustedAt}
                                />
                            </div> */}
                        </div>
                    </div>

                    <div className='cancel_publish_btn'>
                        <NavLink to={routes.STOCK_LIST.to(orgId, next)}>
                            <button
                                type='button'
                                className='fancy_btn'
                            >
                                Cancel
                            </button>
                        </NavLink>
                        <button
                            type='button'
                            disabled={validator()}
                            className='fancy_btn active'
                            onClick={handleSubmit}
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}


const mapStateToProps = ({ auth }) => ({
    user: auth.id,
})

const mapDispatchToProps = {
    addToast,
}

export default connect(mapStateToProps, mapDispatchToProps)(AdjustStock)
