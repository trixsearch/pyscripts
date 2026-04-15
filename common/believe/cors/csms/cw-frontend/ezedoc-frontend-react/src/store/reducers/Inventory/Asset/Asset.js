import { ITEMS_PER_PAGE } from 'Data/constants'
import * as actionTypes from "../../../actions/actionTypes";
import { updateObject } from '../../utility';

const initialState = {
    loader: null,
    total: 0,
    data: [],
    activePage: 1,
    renderPage: '',
    size: ITEMS_PER_PAGE,
    filters: {},
    sorter: 'name',
    activeSorter: {},
    activeFilters: [],
};

const assetStart = (state) => {
    return updateObject(state, {
        loader: true,
    });
}
const AssetGetSucces = (state, action) => {
    return updateObject(state, {
        loader: false,
        data: action.data,
        total: action.paginationData.total_count,
        activePage: action.activePage,
        size: action.size,
        filters: action.filters,
        sorter: action.sorter,
        activeSorter: action.activeSorter,
        activeFilters: action.activeFilters
    });
};
const AssetCreateSuccess = (state) => {
    return updateObject(state, {
        loader: false,
    });
};

const AssetUpdateSuccess = (state) => {
    return updateObject(state, {
        loader: false,
    });
};
const AssetDeleteSuccess = (state, action) => {
    return updateObject(state, {
        loader: false,
        renderPage: action.renderPage,
        data: [...state.data.filter(asset => asset.id !== action.id)]
    });
};

const AssetError = (state) => {
    return updateObject(state, {
        loader: false,
    });
};

const reducer = (state = initialState, action) => {
    switch (action.type) {

        case actionTypes.ASSET_START:
            return assetStart(state, action);

        case actionTypes.ASSET_GET_SUCCESS:
            return AssetGetSucces(state, action);
        
        case actionTypes.ASSET_CREATE_SUCCESS:
            return AssetCreateSuccess(state, action);
        
        case actionTypes.ASSET_DELETE_SUCCESS:
            return AssetDeleteSuccess(state, action);
        
        case actionTypes.ASSET_UPDATE_SUCCESS:
            return AssetUpdateSuccess(state, action);
        
        case actionTypes.ASSET_ERROR:
            return AssetError(state, action);
        
        default:
            return state;
    }
};

export default reducer;