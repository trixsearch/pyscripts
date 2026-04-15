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
    sorter: 'product__name',
    activeSorter: {},
    activeFilters: [],
};

const StockStart = (state) => {
    return updateObject(state, {
        loader: true,
    });
}
const StockGetSucces = (state, action) => {

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
const StockError = (state, action) => {
    return updateObject(state, {
        loader: false,
        message: action.message,
    });
};

const reducer = (state = initialState, action) => {
    switch (action.type) {

        case actionTypes.STOCK_START:
            return StockStart(state, action);

        case actionTypes.STOCK_GET_SUCCESS:
            return StockGetSucces(state, action);
        
        case actionTypes.STOCK_ERROR:
            return StockError(state, action);
        
        default:
            return state;
    }
};

export default reducer;