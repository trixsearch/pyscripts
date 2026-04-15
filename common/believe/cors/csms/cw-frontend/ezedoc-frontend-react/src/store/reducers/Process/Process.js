import { DEFAULT_PAGE_SIZE } from 'Data/constants';
import * as actionTypes from '../../actions/actionTypes';
import { updateObject } from '../utility';

const initialState = {
  // orgId : match?.params?.uuid,
    error: null,
    appName: null,
    loader: false,
    appLoader: false,
    apps: [],
    ongoingProcess: [],
    completedProcess: [],
    withdrawn: [],
    withdrawnCount: 0,
    ongoingCount:0,
    completedCount:0,
    offset : 1,
    processType:"",
    process_key:"",
    currentTask : [],
    appData: null,
    formContent : null,
    formName : "",
    formDescription : "",
    message : "",
    searchCount: null,
    selected_card_list : [],
    selectAll : true,
    searchResults : null,
    searchData : null,
    submissionData:{},
    size : DEFAULT_PAGE_SIZE,
    processStateFilter: null,
    allAppsAdvFilterQuery: [],
    showProcessSearchBar: true,
    withdrawnId: null,
};

const selectedProcessType = (state,action) => {
    return updateObject(state, {
        loader : false,
        processType: action.processType,
        offset :1,
        selected_card_list : [],
    });
}

const processStart = (state, action) => {
    if(action.appLoading){
        return updateObject(state, {
            appLoader: true,
        });
    }
    return updateObject(state, {
        loader: true,
    });
}

const processSuccess = (state,action) => {
    return updateObject(state, {
        loader: false,
        apps: action.apps,
        appData: action.app,
        appName:action.name,
        withdrawn: action.withdrawn,
        withdrawnCount: action.withdrawnCount,
        ongoingProcess:action.ongoing,
        ongoingCount:action.ongoingCount,
        completedProcess:action.completed,
        completedCount:action.completedCount,
        offset:action.offset,
        process_key:action.process_key,
        searchResults : null,
        selected_card_list: [],
        processType : action.process_type,
        size :action.size,
        searchData: null,
        filteredOptions: action.filterOptions,
        selectedOption: action.selectedOption,
        processStateFilter: action.processStateFilter,
        allAppsAdvFilterQuery: action.allAppsAdvFilterQuery,
        loadAgain: false,
    });
};

const processOnGoing = (state,action) => {
    return updateObject(state, {
        loader: false,
        ongoingProcess:action.ongoing,
        ongoingCount:action.total,
        offset:action.offset,
        size: action.size
    });
};

const processKeyUpdate = (state,action) => {
  return updateObject(state, {
      process_key:action.process_key,
  });
};

const getProcessApp=(state, action)=>{
  return updateObject(state, {
    apps: action.apps
  })
}

const selectApp = (state, action)=>{
    if(action?.updateLoader){
        return updateObject(state, {
            appData:action.appData,
            process_key: action?.process_key,
            appName: action?.appData?.name,
            appLoader: false,
            loadAgain: true,
        })
    }
    return updateObject(state, {
        appData:action.appData,
        process_key: action?.process_key,
        appName: action?.appData?.name,
        loadAgain: true,
    })
}

const processCompleted = (state,action) => {
    return updateObject(state, {
        loader: false,
        completedProcess:action.completed,
        completedCount:action.total,
        offset:action.offset,
        size:action.size,
    });
};

const processDetails = (state,action) => {
    return updateObject(state, {
        loader: false,
        appName:action.name,
        withdrawn: action.withdrawn,
        withdrawnCount: action.withdrawnCount,
        ongoingProcess:action.ongoing,
        completedProcess:action.completed,
        ongoingCount:action.ongoingCount,
        completedCount:action.completedCount,
        offset:1,
        size: action.size,
        process_key:action.process_key,
        appData: action.app,
        selected_card_list : [],
        searchResults : null,
        searchData: null,
        filteredOptions: action.filteredOptions,
        selectedOption: action.selectedOption,
        processStateFilter:action.processStateFilter,
        loadAgain: false
    });
};

const processLaunch = (state) => {
    return updateObject(state, {
        // loader: false,
        formStart : false
    });
};

const processWithdraw = (state,action) => {
    return updateObject(state, {
        loader:false,
        error: null,
        withdrawnCount: state.withdrawnCount + 1,
        ongoingCount: state.ongoingCount - 1,
        withdrawnId: action.id
    })
}

const processFail = (state,action) => {
    return updateObject(state, {
        loader: false,
        processes: action.process,
        tasks: action.tasks,
        loadAgain: true
    });
};

const startProcess = (state,action) => {
    return updateObject(state , {
        loader : false,
        formContent : action.formData.content,
        formName : action.formData.name,
        formDescription : action.formData.description,
        submissionData:action.submission_data
    });
}

const startProcessError = (state) => {
    return updateObject(state, {
        loader : false,
    })
}
const processSelected = (state,action) => {
    return updateObject(state, {
        selected_card_list : action.event 
        ? [
            ...state.selected_card_list, { 
                "id":action.id, 
              "email":action.email, 
              "selected":action.event,
              phone:action.phone
            }
        ]
        : [...state.selected_card_list.filter((e)=>e.id !== action.id)],
        selectAll : action.selected_all
    })
}



const processSelectedAll = (state,action) => {
    return updateObject(state, {
        selected_card_list :  action.selected_all
    
    })
}

const processSelectedClear = (state) => {
    return updateObject(state, {
        selected_card_list : []
    })
}

const launchProcessError = (state) => {
    return updateObject(state, {
        loader : false,
    });
}

const getTaskUsers = (state, action) => {
    return updateObject(state, {
        taskUsers: action.data
    })
}

const processWithdrawPagination = (state, action) => (
    updateObject(state, {
        loader: false,
        withdrawn: action.withdrawn,
        withdrawnCount: action.total,
        offset: action.offset,
        size: action.size,
    })
)

const processSearchResult = (state, action) => {
    if(action.processType === "Ongoing process") {
        return updateObject(state, {
            loader: false,
            ongoingProcess : action.results.ongoing.data,
            ongoingCount : action.results.ongoing.total,
            searchData : action.searchData,
            offset : action.offset ? action.offset : 1,
            size: action.size
        })
    }if(action.processType === "Completed process") {
        return updateObject(state, {
            loader: false,
            completedProcess: action.results.completed.data,
            completedCount: action.results.completed.total,
            searchData : action.searchData,
            offset : action.offset ? action.offset : 1,
            size: action.size
        })
    }
        return updateObject(state, {
            loader: false,
            withdrawn: action.results.withdrawn.data,
            withdrawnCount : action.results.withdrawn.total,
            searchData : action.searchData,
            offset : action.offset ? action.offset : 1,
            size: action.size
        })
    
}

const processSearchCount =(state, action) => {
    if(action.process_type ==="Ongoing process") {
    return updateObject(state,{
        loader: false,
        ongoingCount: action.count,
        ongoingProcess: action.data
    })
    } if(action.process_type === "Completed process") {
        return updateObject(state,{
            loader: false,
            completedCount: action.count,
            completedProcess: action.data
        })
    } if(action.process_type === "Withdrawn process") {
        return updateObject(state,{
            loader: false,
            withdrawnCount: action.count,
            withdrawn: action.data
        })
    }
    return true
}
const clearProcessSearch = (state) =>{
    return updateObject(state,{
        loader : false,
        searchResults : null,
        searchData : null
    })
}

const setProcessFilter = (state,action) =>{
    return updateObject(state,{
        filteredOptions: action.filteredOptions,
        selectedOption: action.selectedOption
    })
}

const updateAdvFilter = (state, action) => {
    let { allAppsAdvFilterQuery } = state
    allAppsAdvFilterQuery[action.processKey] = action.filterQuery
    return updateObject(state, {
        loader: false,
        ongoingProcess: action.ongoing,
        completedProcess: action.completed,
        withdrawn: action.withdrawn,
        allAppsAdvFilterQuery: allAppsAdvFilterQuery,
        ongoingCount: action.ongoingCount,
        completedCount: action.completedCount,
        withdrawnCount: action.withdrawnCount,
    })
}

const reducer = ( state = initialState, action ) => {
    switch ( action.type ) {
        case actionTypes.PROCESS_START: return processStart(state, action);
        case actionTypes.START_PROCESS_FORM : return startProcess(state,action);
        case actionTypes.PROCESS_SUCCESS: return processSuccess(state, action);
        case actionTypes.PROCESS_DETAILS: return processDetails(state, action);
        case actionTypes.PROCESS_LAUNCH: return processLaunch(state);
        case actionTypes.PROCESS_ERROR: return processFail(state,action);
        case actionTypes.PROCESS_DETAILS_COMPLETED: return processCompleted(state,action);
        case actionTypes.SELECT_DETAILS: return selectedProcessType(state,action);
        case actionTypes.PROCESS_WITHDRAW: return processWithdraw(state,action);
        case actionTypes.START_PROCESS_ERROR : return startProcessError(state);
        case actionTypes.PROCESS_LAUNCH_ERROR : return launchProcessError(state);
        case actionTypes.GET_TASK_USERS: return getTaskUsers(state, action);
        case actionTypes.WITHDRAWN_PROCESS_PAGINATION: 
            return processWithdrawPagination(state, action);
        case actionTypes.PROCESS_SEARCH: return processSearchResult(state, action);
        case actionTypes.SELECT_CARD_DETAILS: return processSelected(state, action);
        case actionTypes.CLEAR_ALL: return processSelectedClear(state, action);
        case actionTypes.SELECT_CARD_ALL: return processSelectedAll(state, action); 
        case actionTypes.CLEAR_SEARCH : return clearProcessSearch(state);
        case actionTypes.PROCESS_SEARCH_COUNT : return processSearchCount(state, action);
        case actionTypes.FILTER_FROM_DASHBOARD : return setProcessFilter(state, action);
        case actionTypes.UPDATE_ADVANCED_FILTER: return updateAdvFilter(state, action);
        case actionTypes.PROCESS_DETAILS_PAGINATION: return processOnGoing(state,action);
        case actionTypes.PROCESS_KEY_UPDATE:return processKeyUpdate(state,action);
        case actionTypes.PROCESS_APPS: return getProcessApp(state, action);
        case actionTypes.SELECT_APP:return selectApp(state, action);
        case actionTypes.TOGGLE_PROCESS_SEARCH_BAR:
            return {
                ...state,
                showProcessSearchBar: action.show
            }
        case actionTypes.UPDATE_SEARCH_DATA:
            return {
                ...state,
                searchData: action.searchData
            }
        case actionTypes.CLEAR_ALL_PROCESS:
            return {
                ...state,
                process_key: state?.appData?.process_key,
                appData: null,
                ongoingProcess: [],
                completedProcess: [],
                withdrawn: [],
                withdrawnCount: 0,
                ongoingCount: 0,
                completedCount: 0,
                loadAgain: true,
            }
        default:
            return state;
    }
};

export default reducer;