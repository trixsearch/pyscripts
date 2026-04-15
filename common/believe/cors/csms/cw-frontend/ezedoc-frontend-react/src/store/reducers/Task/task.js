import * as actionTypes from '../../actions/actionTypes';
import { updateObject } from '../utility';
import { MY_TASKS, GROUP_TASKS} from '../../../containers/Tasks/TaskConstants';

const initialState = {
    error: null,
    apps: [],
    appLoading: false,
    filter:[],
    message: null,
    tasks :[],
    processKey : "",
    appName : "",
    taskCount:0,
    active:1,
    loader: false,
    taskType:true,
    mygroupTotal:0,
    searchedData:null,
    taskTitle:{},
    taskList :[],
    count: {
        [MY_TASKS]: "-",
        [GROUP_TASKS]: "-"
    },
    filterByValue:"",
    filterField:"",
    involved_groups:[],
    filterBasedCount:{},
    size: 10,
    showHome: true,
    savedFilteredData: {}
};

const taskStart = (state) => {
    return updateObject(state, {
        loader: true,
        tasks:"Loader_true"
    });
}
const remove_task_data = (state) => {
    return updateObject(state, {
    tasks:[]
    });
}
const taskSuccess = (state,action) => {    
    return updateObject(state, {
        loader: false,
        tasks :action.tasks,
        taskType : action.taskType,
        active : action.page,
        count: {
            ...state.count,
            [action.taskType]: action.count
        },
        processKey: action.processKey,
        taskTitle: action.taskTitle,
        filterField: action.filter_field,
        filterByValue: action.filter_name,
        size: action.size
    });
};

const taskAppSuccess = (state,action) => {
    return updateObject(state, {
        apps: action.apps,
    });
};

const taskFail = (state) => {
    return updateObject(state, {
        loader: false,
        tasks :[]
    });
};
const taskUpdate = (state,action) => {
    // let { mygroupTotal } = action;
    return updateObject(state, {
        loader: true,
        tasks: action.filter,
        processKey: action.processKey,
        appName : action.appName,
        count: {
            ...state.count,
            [action.taskType]: action.total,
            // ...mygroupTotal
        },
        active :action.page,
        size: action?.pageSize,
        searchedData:null,
        taskTitle:action.taskTitle
    });
};
const taskUpdateGroup = (state,action) => {
    // let {mygroupTotal}= action
    return updateObject(state, {
        loader: true,
        tasks: action.filter,
        processKey: action.processKey,
        appName : action.appName,
        count: {
            ...state.count,
            [action.taskType]: action.total,
            // ...mygroupTotal
        },
        active :action.page,
        size: action?.pageSize,
        searchedData: null,
        taskTitle:action.taskTitle
    });
};


const taskClaimUpdate = (state,action) => {
    return updateObject(state, {
        filter:  [...state.filter.filter(tasks => tasks.id !== action.id)]
    });
}

const searchTask = (state, action) => {
        return updateObject(state, {
            loader: false,
            tasks      : action.searchedTasks,
            searchedData: action.searchData,
            taskType : action.taskType,
            active      : action.page? action.page : 1,
            size: action?.pageSize || 10,
            count: {
                ...state.count,
                [action.taskType]: action.count
            },
            filterField: action.filter_field,
            filterByValue: action.filter_name
        })
}
const countUpdate =(state, action) =>{
    return updateObject(state,{
        loader:false,
        count: {
            ...state.count,
            ...action.taskCount
        },
        filterBasedCount :{
            ...state.filterBasedCount,
            ...action.filter_based_count
        }
    })
}

const clearTaskSearch = (state) =>{
    return updateObject(state,{
        loader : false,
        searchedData : null
    })
}
const getUserTaskList= (state, action) =>{
    return updateObject(state,{
        ...state,
        loader: false,
        taskList: [...state.taskList, action.taskList]
    })
}

const getTaskApps = (state, action) => {
    return updateObject(state, {
        apps: action.apps,
        appLoading: false,
    })
}

const getAllTaskCount = (state, action) => {
    return updateObject(state, {
        loader:false,
        count: {
            ...state.count,
            ...action.taskCount
        },
        filterBasedCount :{
            ...state.filterBasedCount,
            ...action.filter_based_count
        }
    })
}

const getUserInvolvedGroup = (state, action) => {
    return updateObject(state,{
        involved_groups : action.involved_groups,
        loader:false
    })
}

const saveFilteredData = (state, action) => {
    return updateObject(state,{
        savedFilteredData : {
            ...state.savedFilteredData,
            [action.key]: action.data
        }
    })
}
const toggleTaskHomeScreen = (state, action) => {
    return updateObject(state,{
        showHome : action.value,
        processKey: action?.process_key || state?.processKey || ""
    })
}

const updateTaskAppLoadingStatus = (state, action) => {
    return updateObject(state, {
        appLoading: action.loading
    })
}

const reducer = ( state = initialState, action ) => {
    switch ( action.type ) {
        case actionTypes.TASK_START: return taskStart(state, action);
        case actionTypes.REMOVE_TASK_DATA: return remove_task_data(state, action);
        case actionTypes.TASK_SUCCESS: return taskSuccess(state, action);
        case actionTypes.TASK_ERROR: return taskFail(state,action);
        case actionTypes.TASK_UPDATE: return taskUpdate(state,action);
        case actionTypes.APP_SUCCESS: return taskAppSuccess(state,action);
        case actionTypes.TASK_UPDATE_GROUP: return taskUpdateGroup(state,action);
        case actionTypes.TASK_CLAIM :return taskClaimUpdate(state,action);
        case actionTypes.SEARCH_TASK : return searchTask(state, action);
        case actionTypes.COUNT_UPDATE :return countUpdate(state, action)
        case actionTypes.CLEAR_TASK_SEARCH : return clearTaskSearch(state);
        case actionTypes.GET_USER_TASK_LIST : return getUserTaskList(state, action);
        case actionTypes.TASK_TOGGLE_HOME_SCREEN : return toggleTaskHomeScreen(state, action);
        case actionTypes.TASK_APPS:
            return getTaskApps(state, action);
        case actionTypes.TASK_APP_STATUS:
            return updateTaskAppLoadingStatus(state, action);
        case actionTypes.TASK_COUNT:
            return getAllTaskCount(state, action);
        case actionTypes.GET_USER_INVOLVED_GROUP: return getUserInvolvedGroup(state, action);
        case actionTypes.TASK_SAVE_FILTERED_DATA: return saveFilteredData(state, action);
        default:
            return state;
    }
};

export default reducer;