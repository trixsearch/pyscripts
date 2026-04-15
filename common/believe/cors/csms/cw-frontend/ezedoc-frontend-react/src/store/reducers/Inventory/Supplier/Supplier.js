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

const supplierStart = (state) => {
    return updateObject(state, {
        loader: true,
    });
}
const SupplierGetSucces = (state, action) => {
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
const SupplierCreateSuccess = (state) => {
    return updateObject(state, {
        loader: false,
    });
};

const SupplierUpdateSuccess = (state) => {
    return updateObject(state, {
        loader: false,
    });
};
const SupplierDeleteSuccess = (state, action) => {
    return updateObject(state, {
        loader: false,
        renderPage: action.renderPage,
        data: [...state.data.filter(supplier => supplier.id !== action.id)]
    });
};

const SupplierError = (state) => {
    return updateObject(state, {
        loader: false,
    });
};

const reducer = (state = initialState, action) => {
    switch (action.type) {

        case actionTypes.SUPPLIER_START:
            return supplierStart(state, action);

        case actionTypes.SUPPLIER_GET_SUCCESS:
            return SupplierGetSucces(state, action);
        
        case actionTypes.SUPPLIER_CREATE_SUCCESS:
            return SupplierCreateSuccess(state, action);
        
        case actionTypes.SUPPLIER_DELETE_SUCCESS:
            return SupplierDeleteSuccess(state, action);
        
        case actionTypes.SUPPLIER_UPDATE_SUCCESS:
            return SupplierUpdateSuccess(state, action);
        
        case actionTypes.SUPPLIER_ERROR:
            return SupplierError(state, action);
        
        default:
            return state;
    }
};

export default reducer;