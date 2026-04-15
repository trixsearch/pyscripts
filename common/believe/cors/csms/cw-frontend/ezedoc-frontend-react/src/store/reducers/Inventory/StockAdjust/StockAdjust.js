import { ITEMS_PER_PAGE } from 'Data/constants'
import * as actionTypes from "../../../actions/actionTypes";
import { updateObject } from '../../utility';

const initialState = {
    loader: null,
    total: 0,
    data: [],
    activePage: 1,
    size: ITEMS_PER_PAGE,
    filters: {},
    sorter: 'asset__name',
    activeSorter: {},
    activeFilters: [],
};

const StockAdjustStart = (state) => {
    return updateObject(state, {
        loader: true,
    });
}
const StockAdjustGetSuccess = (state, action) => {

    return updateObject(state, {
        loader: false,
        data: action.data,
        total: action.paginationData.total_count,
        activePage: action.activePage,
        size: action.size,
        filters: action.filters,
        sorter: action.sorter,
        activeSorter: action.activeSorter,
        activeFilters: action.activeFilters,
    });
};
const StockAdjustError = (state, action) => {
    return updateObject(state, {
        loader: false,
        message: action.message,
    });
};

const reducer = (state = initialState, action) => {
    switch (action.type) {

        case actionTypes.STOCK_ADJUST_START:
            return StockAdjustStart(state, action);

        case actionTypes.STOCK_ADJUST_GET_SUCCESS:
            return StockAdjustGetSuccess(state, action);
        
        case actionTypes.STOCK_ADJUST_ERROR:
            return StockAdjustError(state, action);
        
        default:
            return state;
    }
};

export default reducer;