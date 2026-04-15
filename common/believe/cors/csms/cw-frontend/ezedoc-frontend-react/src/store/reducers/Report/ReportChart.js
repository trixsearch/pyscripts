import * as actionTypes from '../../actions/actionTypes';
import { updateObject } from '../utility';

const initialState = {
    success : null,
    message : null,
    loader : null,
    data : [],
    Appdata:[],
    lineChart:[],
    pieChart:[],
    firstApp:[],
    name :"",
    id:null,
    formFields:[],
    config:[]
}

const reportStart = (state) => {
    return updateObject( state, { 
        loader:true,
    });
};

const reportSuccess = (state = initialState, action) => {
    return updateObject(state, { 
        success:action.data.success,
        loader:false,
        data: action.data,
        lineChart:action.data,
        pieChart:action.data,
        message:action.data.message,
        name : action.name,
        id:action.id,
        formFields:action.formFeilds,
        config : action.config
    });
};
const reportFilter = (state = initialState, action) => {
    return updateObject(state, { 
        success:action.data.success,
        loader:false,
        data: action.data,
        lineChart:action.data,
        pieChart:action.data,
        message:action.data.message,
        name : action.name,
        id:action.id,
        formFields:action.formFeilds,
        config:action.config
    });
}
const reportFail = (state, action) => {
    return updateObject( state, {
        success:action.error,
        loader:false
    });
};
const reportPieChart = (state, action) => {
    return updateObject( state, {
        success:action.error,
        loader:false,
        pieChart:action.pieChart
    });
};

const reportAppSuccess = (state, action) => {
    return updateObject( state, {
        Appdata:action.Appdata,
        loader:false,
        firstApp :action.Appdata ? action.Appdata[0] : []
    });
};
const reportOnBoard = (state = initialState, action) => {
    return updateObject(state, { 
        loader:false,
        lineChart: action.lineChart,
    });
}



const reducer = ( state = initialState, action ) => {
    switch ( action.type ) {
        default:
            return state;
    }
};

export default reducer;

