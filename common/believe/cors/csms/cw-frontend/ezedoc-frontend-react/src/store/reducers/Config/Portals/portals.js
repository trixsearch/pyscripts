import * as actionTypes from "../../actionTypes";
import axios from "axios";

export const portalsGet= ()=>{
    return{
        type:actionTypes.PORTALS_START,
    }
}
export const portalsCreate= ()=>{
    return{
        type:actionTypes.PORTALS_CREATE,
    }
}

export const portalsUpdate= ()=>{
    return{
        type:actionTypes.PORTALS_UPDATE,
    }
}
export const portalsDelete= ()=>{
    return{
        type:actionTypes.PORTALS_DETELE,
    }
}

export const portalsSuccess= (message)=>{
    return{
        type:actionTypes.PORTALS_SUCCESS,
        message:message

    }
}
export const portalsError= (message)=>{
    return{
        type:actionTypes.PORTALS_ERROR,
        message:message

    }
}



export const getPortals = ()=>{
    return dispatch =>{
        dispatch(portalsGet())
        axios.get().then(response=>{
            dispatch(portalsSuccess(response.data))
        }).catch(err=>{
            dispatch(portalsError(err.response.data))
        })
    }
}
export const createPortals = ()=>{
    return dispatch =>{
        dispatch(portalsCreate())
        axios.get().then(response=>{
            dispatch(portalsSuccess(response.data))
        }).catch(err=>{
            dispatch(portalsError(err.response.data))
        })
    }
}
export const editPortals = ()=>{
    return dispatch =>{
        dispatch(portalsUpdate())
        axios.get().then(response=>{
            dispatch(portalsSuccess(response.data))
        }).catch(err=>{
            dispatch(portalsError(err.response.data))
        })
    }
}

export const deletePortals = ()=>{
    return dispatch =>{
        dispatch(portalsDelete())
        axios.get().then(response=>{
            dispatch(portalsSuccess(response.data))
        }).catch(err=>{
            dispatch(portalsError(err.response.data))
        })
    }
}

