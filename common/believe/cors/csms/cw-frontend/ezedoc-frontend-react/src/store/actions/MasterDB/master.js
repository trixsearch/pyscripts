import axios from 'axios';

import * as actionTypes from '../actionTypes';
import { addToast } from '../../../components/Toast/actions';

const masterDbLoader = () => ({
    type: actionTypes.MASTER_DB_LOADER
});

const DeleteMasterModel = (id) => ({
    type: actionTypes.MASTER_DB_DELETE_MODEL,
    id
});

const PostMasterModel = (data) => ({
    type: actionTypes.MASTER_DB_POST_MODEL,
    data
});


const GetMasterModels = (data, page , total) => {
    return {
        type: actionTypes.MASTER_DB_GET_MODEL,
        data: data,
        active: page,
        total: total
    }
}

const GetMasterModelById = (data) => ({
    type: actionTypes.MASTER_DB_GET_MODEL_BY_ID,
    data
});

const CreateFields = (data) => ({
    type: actionTypes.MASTER_DB_POST_FIELD,
    data
})

const getMasterFieldsRecords = (fieldsData, recordsData, page) => ({
    type: actionTypes.MASTER_RECORDS_GET,
    fieldsData,
    recordsData: recordsData.data,
    activeRec: page,
    totalRec: recordsData.pagination_data.total_count
})

const EditMasterRecords = () => ({
    type: actionTypes.MASTER_RECORDS_EDIT
})

const DeleteMasterRecords = () => ({
    type: actionTypes.MASTER_RECORDS_DELETE
})

const DownloadMasterRecords = () => ({
    type: actionTypes.MASTER_RECORDS_DOWNLOAD
})

const masterDbError = (error, dispatch) => {
    try {
        dispatch(addToast('error', 'Error', error.response.data.message))
        return {
            type: actionTypes.MASTER_DB_ERROR,
            error: error.response.data.message
        };
    } catch (err) {
        dispatch(addToast('error', 'Error', err.message || "Something went wrong, please try after sometime."))
        return {
            type: actionTypes.MASTER_DB_ERROR,
            error: err.message || "Something went wrong, please try after sometime."
        };
    }
};


export const postMasterModel = (data) => async (dispatch) => {
    try {
        dispatch(masterDbLoader());

        const response = await axios.post('/api/records/model', data);
        dispatch(PostMasterModel(response.data.data))

    } catch (error) {
        dispatch(masterDbError(error, dispatch));
    }
}

export const deleteMasterModel = (id) => async (dispatch) => {
    try {
        dispatch(masterDbLoader());

        await axios.delete(`/api/records/model/${id}`);
        return dispatch(DeleteMasterModel(id));
    } catch (error) {
        return dispatch(masterDbError(error, dispatch));
    }
}

export const getMasterModel = (page = 1) => async (dispatch) => {
    try {
        dispatch(masterDbLoader());

        let response = await axios.get(`/api/entity/master?page=${page}`);
        let total= response.data.pagination_data.total_count
        response = response.data.data.filter((model)=> model.model_type !== "entities")

        return dispatch(GetMasterModels(response, page, total));
    } catch (error) {
        return dispatch(masterDbError(error, dispatch));
    }
}

export const getMasterModelById = (id) => async (dispatch) => {
    try {
        dispatch(masterDbLoader());

        let response = await axios.get(`/api/entity/master/${id}`);
        return dispatch(GetMasterModelById(response.data.data));
    } catch (error) {
        return dispatch(masterDbError(error, dispatch));
    }
}

export const createModelFields = (id, list, history) => async (dispatch) => {
    try {
        dispatch(masterDbLoader());

        let postData = [...list.map(item => {
            return {
                ...item,
                models: id
            }
        })].filter(item => (item.name && item.key))

        let response = await axios.post(`/api/records/fields`, postData);
        dispatch(CreateFields(response.data.data))
        history.push('/master')
    } catch (error) {
        dispatch(masterDbError(error, dispatch));
    }
}

export const getModelFields = (id) => async (dispatch) => {
    try {
        dispatch(masterDbLoader());

        let response = await axios.get(`/api/records/fields?models=${id}`)
        return response
    } catch (error) {
        return dispatch(masterDbError(error, dispatch));
    }
}


export const bulkEditModelFields = (data, modelID, history) => async (dispatch) => {
    try {
        dispatch(masterDbLoader());

        let postData = {
            edit: [],
            create: []
        };

        data.map(entry => {
            const {
                id, field_type, name, key, is_editable, is_unique, dirty, models
            } = entry
            if (id && dirty) {
                postData.edit.push({
                    id, field_type, name, key, is_editable, is_unique, models
                })
            } else if (!id && name.length && key.length) {
                postData.create.push({
                    field_type, name, key, is_editable, is_unique, models: modelID
                })
            }
            return entry
        })

        await axios.patch(`/api/records/fields/bulk_update`, postData);

    } catch (error) {
        dispatch(masterDbError(error, dispatch))
    } finally {
        history.push('/master')
    }
}

export const getMasterRecords = (id, page=1) => async (dispatch) => {
    try {
        dispatch(masterDbLoader());

        let fieldsData = await axios.get(`/api/records/fields?models=${id}`)
        let recordsData = await axios.get(`/api/records/data/${id}?page=${page}`);

        return dispatch(getMasterFieldsRecords(fieldsData.data.data, recordsData.data, page))

    } catch (error) {
        return dispatch(masterDbError(error, dispatch))
    }
}


export const deleteMasterRecords = (modelId, records) => async (dispatch) => {
    try {
        dispatch(masterDbLoader());
        let deleteData = { data: records };

        let response = await axios.delete(`/api/records/data/${modelId}/bulk_destroy`, deleteData)
        return dispatch(DeleteMasterRecords(response.data));
    } catch (error) {
        return dispatch(masterDbError(error, dispatch))
    }
}

export const editMasterRecords = (modelID, data) => async (dispatch) => {
    try {
        dispatch(masterDbLoader());

        let response = await axios.patch(`/api/records/data/${modelID}/bulk_update`, data);
        return dispatch(EditMasterRecords(response.data.data))
    } catch (error) {
        return dispatch(masterDbError(error, dispatch))        
    }
}

export const getEntityMasterData = (id, page=1) => async (dispatch) => {
    try {
        dispatch(masterDbLoader());

        let response = await axios.get(`/api/entity/master/data/${id}/get_model_data?page=${page}`);
        return dispatch({
            type: actionTypes.MASTER_ENTITY_DATA_BY_ID,
            data: response.data
        })
    } catch (error) {
        return dispatch(masterDbError(error, dispatch))        
    }
}

export const clearMasterState = () => ({
    type: actionTypes.MASTER_DB_CLEAR
})


export const handleRecordDownload =(id, query, hideRecordDownload) => async (dispatch) => {
    let fetchUrl = `/api/entity/master/data/${id}/download_record_data`
    dispatch(masterDbLoader());
    hideRecordDownload()
    axios.post(fetchUrl, {data:query}, {"responseType":"blob"}).then(response=>{
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "report.xlsx");
        document.body.appendChild(link);
        link.click();
        dispatch(DownloadMasterRecords());
        dispatch(addToast('success', 'Success', 'Record is getting generated'))
    }).catch(e =>{
        hideRecordDownload()
        dispatch(DownloadMasterRecords());
        dispatch(addToast('error', 'Error', e.response.data.message|| "Failed to generate record"))
    })
}