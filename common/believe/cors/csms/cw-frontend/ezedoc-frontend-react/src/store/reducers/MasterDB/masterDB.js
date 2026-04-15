import * as actionTypes from "../../actions/actionTypes";
import { updateObject } from "../utility";

const initialState = {
    success: false,
    message: null,
    loader: false,
    modelData: [],
    fieldsData: [],
    recordsData: [],
    modelDataId: {},
    step1: true,
    step2: false,
    active: 1,
    total: 1,
    activeRec: 1,
    totalRec: 1
};

const masterDbLoader = (state) => (
    updateObject(state, {
        loader: true
    })
);

const createMasterModel = (state, action) => (
    updateObject(state, {
        loader: false,
        step1: false,
        step2: true,
        modelID: action.data.id
    })
);

const deleteMasterModel = (state, action) => (
    updateObject(state, {
        loader: false,
        modelData: [...state.modelData.filter(model => (model.id !== action.id))]
    })
);

const getMasterModels = (state, action) => (
    updateObject(state, {
        loader: false,
        modelData: action.data,
        active: action.active,
        total: action.total
    })
);

const getMasterModelById = (state, action) => (
    updateObject(state, {
        loader: false,
        modelDataId: action.data
    })
);

const CreateFieldsSuccess = (state) => (
    updateObject(state, {
        loader: false
    })
);

const GetMasterRecords = (state, action) => (
    updateObject(state, {
        loader: false,
        fieldsData: action.fieldsData,
        recordsData: action.recordsData,
        activeRec: action.activeRec,
        totalRec: action.totalRec
    })
)

const DeleteMasterRecords = (state) => (
    updateObject(state, {
        loader: false
    })
)

const EditMasterRecords = (state) => {
    return updateObject(state, {
        loader: false
    })
}

const MasterEntityDataById = (state, action) => {
    return updateObject(state, {
        loader: false,
        data: action.data
    })
}

const masterDbError = (state) => {
    return updateObject(state, {
        loader: false
    })
};

const DownloadMasterRecords = (state) => {
    return updateObject(state, {
        loader: false
    })
}


export default (state = initialState, action) => {
    switch (action.type) {
        case actionTypes.MASTER_DB_LOADER:
            return masterDbLoader(state, action);
        case actionTypes.MASTER_DB_POST_MODEL:
            return createMasterModel(state, action);
        case actionTypes.MASTER_DB_DELETE_MODEL:
            return deleteMasterModel(state, action);
        case actionTypes.MASTER_DB_GET_MODEL:
            return getMasterModels(state, action);
        case actionTypes.MASTER_DB_ERROR:
            return masterDbError(state, action);
        case actionTypes.MASTER_DB_GET_MODEL_BY_ID:
            return getMasterModelById(state, action);
        case actionTypes.MASTER_DB_POST_FIELD:
            return CreateFieldsSuccess(state, action);
        case actionTypes.MASTER_RECORDS_GET:
            return GetMasterRecords(state, action);
        case actionTypes.MASTER_RECORDS_EDIT:
            return EditMasterRecords(state, action)
        case actionTypes.MASTER_RECORDS_DELETE:
            return DeleteMasterRecords(state, action);
        case actionTypes.MASTER_ENTITY_DATA_BY_ID:
            return MasterEntityDataById(state, action);
        case actionTypes.MASTER_DB_CLEAR:
            return { ...initialState };
        case actionTypes.MASTER_RECORDS_DOWNLOAD:
            return DownloadMasterRecords(state, action);
        default:
            return state;
    }
};
