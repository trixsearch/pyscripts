import React, { useEffect, useState } from 'react';
import Axios from 'axios';
import { connect } from 'react-redux';

import { useParams } from 'react-router-dom';
import Spinner from "../Spinner/Spinner";
import ImportHistoryRow from "./index";
import { addToast } from '../../Toast/actions';
import EzedoxPagination from '../Pagination/OldPagination';
import DynamicTable from '../DynamicTable/DynamicTable';

const ImportHistoryTableHeaderDatas = [
    {
        label: 'ID',
        classes: 'col-md-4'
    },
    {
        label: 'Start Time',
        classes: 'col-md-3'
    },
    {
        label: 'End Time',
        classes: 'col-md-3'
    },
    {
        label: 'Status',
        classes: 'col-md-1'
    },
    {
        label: 'Result',
        classes: 'col-md-1'
    }
]

const ImportHistory = (props) => {
    const APP_URL = process.env.REACT_APP_APP_URL;
    const [loader, setLoader] = useState(false);
    const [page, setPage] = useState({
        pageNumber: 1,
        active: 1,
        total: 1,
        data: [],
        loader: false
    });

    const { entity, addToaster} = props;
    const { uuid: orgId } = useParams();

    useEffect(() => {
        function fetchUrl() {
            setLoader(true)
            return `${APP_URL}/${orgId}/imports/?entity=${entity}&page=${page.pageNumber}`;
        }

        async function fetchData() {
            try {
                const response = await Axios.get(fetchUrl());
                setPage({
                    total: response.data.pagination_data.total_count,
                    active: page.pageNumber,
                    data: response.data.data,
                    pageNumber: page.pageNumber
                })
                return response.data.data
            } catch (error) {
                addToaster('error', 'Error', 'Something went wrong, please try after sometime.')
                return error
            } finally {
                setLoader(false)
            }
        }
        fetchData();
    }, [page.pageNumber, entity, addToaster])

    const handlePageChange = (pageNumber) => {
        setPage({
            ...page,
            pageNumber
        })
    }

    return (
        <div>
            {loader && <Spinner />}
            <div
                className="main_changable_container"
                style={{ 'height': window.innerHeight - 59 }}
            >
                <div style={{
                    paddingTop: 0,
                    marginTop: 32,
                }}
                >
                    <div className="config_table_list_box">
                        <DynamicTable
                            isLoading={loader}
                            paginationCount={page.total}
                            table_header_datas={ImportHistoryTableHeaderDatas}
                            table_body_classes='import_history_list_container'
                            table_extra_classes='table_container table_cont_edit_delete_list'
                        >
                            {
                                page.data
                                && Array.isArray(page.data)
                                && page.data.map(rowData => (
                                    <ImportHistoryRow
                                        key={rowData.transaction_id}
                                        data={rowData}
                                        {...props}
                                    />
                                ))
                            }
                        </DynamicTable>
                        <EzedoxPagination
                            active={page.active}
                            taskCount={page.total}
                            handlePageChange={handlePageChange}
                            itemsCountPerPage={10}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

const mapDispatchToProps = dispatch => ({
    addToaster: (type, title, message, duration) => dispatch(addToast(type, title, message, duration))
})

export default connect(null, mapDispatchToProps)(ImportHistory);