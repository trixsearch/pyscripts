import React, { Component } from 'react';
import { connect } from 'react-redux';
import ReactTable from 'react-table';
import Datetime from 'react-datetime';
import moment from "moment";
import 'react-table/react-table.css';
import "react-datetime/css/react-datetime.css";

import '../Inventory/InventoryComponent/react-datetime-tweak.css';
import {
    getModelFields, getMasterRecords, deleteMasterRecords, editMasterRecords
} from '../../store/actions';
import Spinner from '../../components/UI/Spinner/Spinner';
import ErrorPage from '../ErrorPage';
import EzedoxPagination from '../../components/UI/Pagination/Pagination';
import { formatDate, formatDateTime } from './utils';
import { Button } from '../../components/UI/AppButton/AppButton';
import ArrayEditModal from './ArrayEditModal';
import { addToast } from '../../components/Toast/actions';

class MasterView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            fieldsData: [],
            recordsData: [],
            tempStorage: [],
            select_all: false,
            saveButton: false,
            error: false,
            arrayEditModal: false,
            arrayEditData: "",
            cellInfo: null,
            arrayEditName: '',
            arrayEdit: false
        }
    }

    componentDidMount() {
        document.getElementById('right_side').style.marginLeft = '0px';
        /* 
            Call master records api to get records data and set to 'recordsData', and 'tempStorage'
            state variables.
            
            tempStorage => 
            temporary variable, to store records data, if user wishes to discard his editing and 
                leave fields value untouched and wants to go back to existing data.

            The edited data will be stored to recordsData
        
        */
        this.props.getMasterRecords(this.props.match.params.id).then(res => {
            let recordsData = res.recordsData.map(record => ({
                ...record,
                checked: false
            }))
            this.setState({
                fieldsData: res.fieldsData,
                recordsData: [...recordsData],
                tempStorage: [...recordsData]

            })
        }).catch(() => {
            this.setState({
                error: true
            })
        })
    }

    componentWillUnmount() {
        document.getElementById('right_side').style.marginLeft = '5px';
        this.setState({
            fieldsData: [],
            recordsData: [],
            tempStorage: [],
            select_all: false,
            saveButton: false,
            error: false
        })
    }

    handleSelectAll = () => {
        this.setState(prevState => ({
            recordsData: [...prevState.recordsData.map(record => ({
                ...record,
                checked: !prevState.select_all
            }))],
            select_all: !prevState.select_all
        }))
    }

    handleInputChange = (event, cellInfo) => {
        let value = event.target.value;
        let type = event.target.type;
        let checked = event.target.checked

        this.setState((prevState) => ({
            recordsData: [...prevState.recordsData].map((record, recordIndex) => {
                if (recordIndex === cellInfo.index) {
                    return {
                        ...record,
                        [cellInfo.column.id]: type === "checkbox" ? checked : value,
                        dirty: true
                    }
                }
                return {
                    ...record
                }
            }),
            saveButton: true
        }));
    }

    handleDateTimeChange = (data, cellInfo) => {
        if(typeof data === 'string')
            return 
        this.setState(prevState => ({
            recordsData: [...prevState.recordsData].map((record, recordIndex) => {
                if(recordIndex === cellInfo.index) {
                    return {
                        ...record,
                        [cellInfo.column.id]: data.toISOString(),
                        dirty: true
                    }
                }
                return {
                    ...record
                }
            }),
            saveButton: true
        }))
    }

    handleCheck = (event, rowIndex) => {

        let checked = event.target.checked;

        this.setState(prevState => ({
            recordsData: [...prevState.recordsData.map((record, recordIndex) => (
                (recordIndex === rowIndex) ? { ...record, checked } : { ...record }
            ))],
            select_all: false
        }), () => {
            if (this.state.recordsData.every(record => (record.checked))) {
                this.setState({
                    select_all: true
                })
            }
        })
    }

    handleRowDelete = () => {
        let deletable_records = this.state.recordsData
            .filter(record => (record.checked))
            .map(record => (record.id))

        this.props.deleteMasterRecords(this.props.match.params.id, deletable_records).then(() => {
            this.setState((prevState) => ({
                recordsData: [...prevState.recordsData]
                    .filter(record => !deletable_records.includes(record.id))
            }))
        })
    }

    handleDiscardEdit = () => {
        this.setState(prevState => ({
            recordsData: [...prevState.tempStorage],
            saveButton: false
        }))
    }

    renderDateField = (cellInfo) => {
        const CellValue = formatDate(this.state.recordsData[cellInfo.index][cellInfo.column.id]);
        return (
            <input
                className="master-cell-input"
                name={cellInfo.column.id}
                type="date"
                autoComplete="new-password"
                onChange={(event) => { this.handleInputChange(event, cellInfo) }}
                value={CellValue}
            />
        )
    }

    renderDateTimeField = (cellInfo) => {
        let CellValue = moment(this.state.recordsData[cellInfo.index][cellInfo.column.id]).local();
        return (
            <div className="master-react-dt-picker">
                <Datetime
                    className="master-cell-input"
                    value={CellValue}
                    closeOnSelect
                    dateFormat='DD/MM/YYYY'
                    timeFormat="hh:mm a"
                    inputProps={{
                        readOnly: true,
                        style:{ backgroundColor: 'unset' }
                    }}
                    onChange={(dateTime) => { this.handleDateTimeChange(dateTime, cellInfo) }}
                />
            </div>
        )
    }

    renderIntegerField = (cellInfo) => {
        const CellValue = this.state.recordsData[cellInfo.index][cellInfo.column.id];
        return (
            <input
                className="master-cell-input"
                name={cellInfo.column.id}
                type="number"
                autoComplete="new-password"
                onChange={(event) => { this.handleInputChange(event, cellInfo) }}
                value={CellValue}
            />
        )
    }

    renderBooleanField = (cellInfo) => {
        const CellValue = this.state.recordsData[cellInfo.index][cellInfo.column.id];
        return (
            <div className="round">
                <input
                    className="master-cell-input master-row-checkbox"
                    name={cellInfo.column.id}
                    type="checkbox"
                    id={`${cellInfo.original.id}__${cellInfo.column.id}}`}
                    autoComplete="new-password"
                    onChange={(event) => { this.handleInputChange(event, cellInfo) }}
                    checked={CellValue || false}
                />
                <label htmlFor={`${cellInfo.original.id}__${cellInfo.column.id}}`} />
            </div>
        )
    }

    renderTextArea = (cellInfo) => {
        const CellValue = this.state.recordsData[cellInfo.index][cellInfo.column.id];
        return (
            <textarea
                className="master-cell-input"
                name={cellInfo.column.id}
                type="text"
                autoComplete="new-password"
                onChange={(event) => { this.handleInputChange(event, cellInfo) }}
                value={CellValue || ""}
                style={{ maxWidth: '100%' }}
            />
        )
    }

    renderArrayEdit = (cellInfo, name) => {
        const CellValue = this.state.recordsData[cellInfo.index][cellInfo.column.id];
        return (
            <Button style={{display: 'flex', justifyContent: 'space-around'}} variant="master-db-no-bg-button" onClick={() => { this.handleArrayEdit(CellValue, cellInfo, name) }}>
                {(CellValue && CellValue.length) ? (
                    <>
                        <span>{CellValue[0] || ''}</span>
                        {CellValue.length > 1 && (
                        <div>
                            <span 
                                style={{
                                    backgroundColor: 'lightgray',padding: '0px 4px', borderRadius: 4, marginRight: 4
                                    }}
                            >
                                {`  +${CellValue.length - 1}`}
                            </span>
                            <span className="appear-like-link">more</span>
                        </div>
                        )}
                    </>
                ) : (
                    <span>&nbsp;</span>
                )}   
            </Button>
        )
    }

    handleArrayEdit = (CellValue, cellInfo, name, edit=true) => {
        this.setState({
            arrayEditModal: true,
            arrayEditData: CellValue || [],
            cellInfo,
            arrayEdit: edit,
            arrayEditName: name
        })
    }

    handleModalClose = () => {
        this.setState({
            arrayEditModal: false,
            arrayEditData: "",
            arrayEdit: false,
            cellInfo: null,
            arrayEditName: ''
        })
    }

    handleArrayEditSubmit = (data) => {
        this.setState((prevState) => ({
            arrayEditModal: false,
            arrayEditData: "",
            recordsData: [...prevState.recordsData].map((record, recordIndex) => {
                if (recordIndex === prevState.cellInfo.index) {
                    return {
                        ...record,
                        [prevState.cellInfo.column.id]: data,
                        dirty: true
                    }
                }
                return {
                    ...record
                }
            }),
            saveButton: true
        }));
    }

    renderCell = (cellInfo) => {
        const CellValue = this.state.recordsData[cellInfo.index][cellInfo.column.id];
        return (
            <input
                className="master-cell-input"
                name={cellInfo.column.id}
                type="text"
                autoComplete="new-password"
                onChange={(event) => { this.handleInputChange(event, cellInfo) }}
                value={CellValue || ""}
            />
        )
    };

    handleSubmit = () => {
        let editable_records = this.state.recordsData.filter(record => (record.dirty))
        let integerFieldsKeys = this.state.fieldsData
            .filter(field => field.field_type === 'IntegerField')
            .map(field => (field.key))

        let edited_records = []
        if(integerFieldsKeys.length) { 
            integerFieldsKeys.map(key => {
                editable_records.map(rec => {
                    if (Object.keys(rec).includes(key) && !rec[key]) {
                        edited_records.push({
                            ...rec,
                            [key]: "0"
                        })
                    } else edited_records.push(rec);
                    return rec
                })
                return editable_records
            })
        } else edited_records = editable_records;

        if (edited_records.length) {
            this.props.editMasterRecords(this.props.match.params.id, edited_records).then((res) => {
                this.setState((prevState) => ({
                    tempStorage: res.error
                        ? [...prevState.tempStorage] : [...prevState.recordsData],
                    saveButton: false,
                    recordsData: res.error
                        ? [...prevState.tempStorage] : [...prevState.recordsData]
                }))
                this.props.addToast('success', 'Success', 'Records updated succesfully.')
            }).catch(() => {
            })
        }
    }

    handlePageChange = (page) => {
        this.props.getMasterRecords(this.props.match.params.id, page).then(res => {
            let recordsData = res.recordsData.map(record => ({
                ...record,
                checked: false
            }))
            this.setState({
                fieldsData: res.fieldsData,
                recordsData: [...recordsData],
                tempStorage: [...recordsData],
                select_all: false,
                saveButton: false,
                error: false
            })
        }).catch(() => {
            this.setState({
                error: true
            })
        })
    }

    render() {
        const { loader } = this.props;
        const {
            fieldsData, recordsData, select_all, saveButton, error, arrayEditModal
        } = this.state;

        let columns = [];
        let deleteButton = {
            Header: () => {
                return (!!recordsData.length && (
                    <div className="round" key="master-checkbox-select-all">
                        <input
                            className="master-row-checkbox"
                            type="checkbox"
                            id='master-checkbox-select-all'
                            checked={select_all}
                            onChange={this.handleSelectAll}
                        />
                        <label htmlFor='master-checkbox-select-all' />
                    </div>
                ))
            },
            id: 'delete',
            width: 38,
            sortable: false,
            accessor: () => "delete",
            Cell: (row) => {
                return (
                    <div className="round" key={`master-checkbox-${row.index}`}>
                        <input
                            className="master-row-checkbox"
                            type="checkbox"
                            id={`master-checkbox-${row.index}`}
                            checked={recordsData[row.index].checked}
                            onChange={(event) => { this.handleCheck(event, row.index) }}
                        />
                        <label htmlFor={`master-checkbox-${row.index}`} />
                    </div>
                )
            }
        }

        columns = fieldsData.map(field => {
            // console.log(field)
            let customHeader = field.is_editable ? {
                Cell: (cellInfo) => {
                    if (field.field_type === "IntegerField") {
                        return this.renderIntegerField(cellInfo)
                    }
                    if (field.field_type === "DateField") {
                        return this.renderDateField(cellInfo)
                    }
                    if (field.field_type === "BooleanField") {
                        return this.renderBooleanField(cellInfo)
                    }
                    if (field.field_type === "DateTimeField") {
                        return this.renderDateTimeField(cellInfo)
                    }
                    if (field.field_type === "TextField") {
                        return this.renderTextArea(cellInfo)
                    }
                    if (field.field_type === "ArrayField") {
                        return this.renderArrayEdit(cellInfo, field.name)
                    }
                    return this.renderCell(cellInfo)
                },
                style: {
                    overflow: field.field_type === "DateTimeField" ? 'visible' : 'hidden'
                },
                Header: () => (
                    <span>
                        <i className="icon icon-edit" style={{ marginRight: 8, fontSize: 12 }} />
                        {field.name}
                    </span>
                )
            } : {
                Cell: (cellInfo) => {
                    const CellValue = recordsData[cellInfo.index][cellInfo.column.id];
                    if (field.field_type === "DateField") {
                        return (
                            <span>{formatDate(CellValue)}</span>
                        )
                    }
                    if (field.field_type === "DateTimeField") {
                        return (
                            <span>{formatDateTime(CellValue)}</span>
                        )
                    }
                    if (field.field_type === "BooleanField") {
                        return (
                            <span className="master-cell-capitalize">{CellValue.toString()}</span>
                        )
                    }
                    if (field.field_type === "ArrayField") {
                        return (
                            <span>
                                {!CellValue ? '' 
                                : (
                                    <Button 
                                        variant="master-db-no-bg-button" 
                                        onClick={() => { 
                                        this.handleArrayEdit(CellValue,cellInfo,field.name,false) 
                                        }}
                                    >
                                        <span>{CellValue[0] || ''}</span>
                                        {CellValue.length > 1 && (
                                        <div>
                                            <span style={{backgroundColor: 'lightgray',padding: '0px 4px', borderRadius: 4}}>
                                                {`  +${CellValue.length - 1}`}
                                            </span>
                                            <span className="appear-like-link">more</span>
                                        </div>
                                        )}
                                    </Button>
                                )}
                            </span>
                        )
                    }
                    return (
                        <span>
                            {recordsData[cellInfo.index][cellInfo.column.id]}
                        </span>
                    )
                }
            }

            return {
                Header: field.name,
                accessor: field.key,
                field_type: field.field_type,
                is_editable: field.is_editable,
                ...customHeader,
                minWidth: 190,
            }
        });

        if (columns.length) {
            columns.unshift(deleteButton);
        }

        if (error) {
            return (<ErrorPage />);
        }

        return (
            <>
                {loader && (<Spinner />)}
                {arrayEditModal && (
                    <ArrayEditModal
                        show={arrayEditModal}
                        title={this.state.arrayEditName}
                        handleClose={this.handleModalClose}
                        handleSubmit={this.handleArrayEditSubmit}
                        editData={this.state.arrayEditData}
                        editable={this.state.arrayEdit}
                    />
                )}
                <ul
                    className="nav nav-tabs process_tab_ongoing_comp_ul"
                    id="myTab"
                    role="tablist"
                    style={{ marginTop: 32 }}
                >
                    <li className="process_tab_last_li">
                        <div className="process_details_btn_cont">
                            {(!!recordsData.length && recordsData.some(record => (record.checked)))
                                && (
                                    <button
                                        type="button"
                                        className="fancy_btn"
                                        onClick={this.handleRowDelete}
                                    >
                                        <span>Delete</span>
                                    </button>
                                )}
                        </div>
                    </li>
                </ul>
                <div className="master-react-table">
                    <ReactTable
                        data={recordsData}
                        className="master-react-table-component"
                        columns={columns}
                        showPagination={false}
                        showPageSizeOptions={false}
                        defaultPageSize={10}
                        getTrProps={() => ({
                            style: {
                                textAlign: 'left',
                            }
                        })}
                        getTheadTrProps={() => ({
                            style: {
                                textAlign: 'left'
                            }
                        })}
                        getTbodyProps={() => ({
                            style: {
                                overflowX: 'auto',
                                overflowY: 'overlay'
                            }
                        })}
                    />
                    <div className="cancel_publish_btn master-pt-0">
                        <Button
                            variant="secondary"
                            onClick={this.handleDiscardEdit}
                            disabled={!saveButton}
                        >
                            Discard Editing
                        </Button>
                        <Button
                            variant="primary"
                            onClick={this.handleSubmit}
                            disabled={!saveButton}
                        >
                            Save
                        </Button>
                    </div>
                    <div className="master-pagination">
                        <EzedoxPagination
                            active={this.props.activeRec}
                            taskCount={this.props.totalRec}
                            handlePageChange={this.handlePageChange}
                            itemsCountPerPage={10}
                        />
                    </div>
                </div>
            </>
        )
    }
}

const mapStateToProps = (state) => ({
    loader: state.master.loader,
    fieldsData: state.master.fieldsData,
    recordsData: state.master.recordsData,
    activeRec: state.master.activeRec,
    totalRec: state.master.totalRec
});

const mapDispatchToProps = (dispatch) => ({
    getModelFields: (id) => dispatch(getModelFields(id)),
    getMasterRecords: (id, page) => dispatch(getMasterRecords(id, page)),
    deleteMasterRecords: (modelId, records) => dispatch(deleteMasterRecords(modelId, records)),
    editMasterRecords: (modelId, records) => dispatch(editMasterRecords(modelId, records)),
    addToast: (type, title, message, duration) => dispatch(addToast(type, title, message, duration))
})

export default connect(mapStateToProps, mapDispatchToProps)(MasterView);
