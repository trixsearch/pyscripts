import axios from "axios";

import * as actionTypes from "../../actionTypes";
import { addToast } from '../../../../components/Toast/actions';

const APP_URL = process.env.REACT_APP_APP_URL;

export const userGet = (data, page, size, userType, filters, sorter, activeFilters, activeSorter, extraColumns) => {
    return {
        type: actionTypes.USER_GET,
        users: data.data,
        total : data.pagination_data.total_count,
        active : page,
        loader: false,
        size,
        userType,
        filters,
        sorter,
        activeFilters,
        activeSorter,
        extraColumns
    }
}

export const userGetById = (data) => {
    return {
        type: actionTypes.USER_GET_ID,
        data
    }
}

export const rolesGet = (data) => {
    return {
        type: actionTypes.GET_ROLES,
        roles: data
    }
}

export const userCreate = (newUser) => {
    return {
        type: actionTypes.USER_CREATE,
        loader: false,
        newUser,
        message: newUser.message
    }
}

export const userSearch = (results) => {
    return {
        type: 'USER_SEARCH_RESULTS',
        results
    }
}

export const userUpdate = (data) => {
    return {
        type: actionTypes.USER_UPDATE,
        data: data.data,
        message: data.message
    }
}
export const userDelete = (id, renderPage) => {
    return {
        type: actionTypes.USER_DELETE,
        renderPage,
        id,
        loader: false
    }
}

export const userSuccess = (message) => {
    return {
        type: actionTypes.USER_SUCCESS,
        message: message
    }
}
export const userError = (err, dispatch) => {
    try {
        if (err.response) {
            dispatch(addToast('error', 'Error', err.response.data.message))
            return {
                type: actionTypes.USER_ERROR,
                error: err.response.data.message
            }
        }
        dispatch(addToast('error', 'Error', err.message || "Something went wrong, please try after sometime."))
        return {
            type: actionTypes.USER_ERROR,
            error: err.message || "Something went wrong, please try after sometime."
        };
    } catch (error) {
        dispatch(addToast('error', 'Error', error.message))
        return {
            type: actionTypes.USER_ERROR,
            error: error.message
        }
    }
}


export const setLoader = () => {
    return {
        type: actionTypes.LOADER,
        loader: true
    }
}

const UserSearchSuccess = (data, searchItem, page, filter) => {
    return {
        type: actionTypes.USER_SEARCH, 
        total: data.pagination_data.total_count,
        data: data.data,
        searchItem,
        page,
        filter: filter
    }
}

const clearUserSearchResult = () => ({
    type : actionTypes.CLEAR_USER_SEARCH
})

const renderUserPage = () => ({
    type: actionTypes.RENDER_USERS_PAGE
})

export const getUser = (orgId, page=1, type = 'active', history=null, afterDelete = false) => {
    let url = `${APP_URL}/${orgId}/users/org_users?page=${page}&type=${type}`
    return dispatch => {
        dispatch(setLoader(true))
        axios.get(url).then(response => {
            if(response.data.data && response.data.pagination_data) {
                dispatch(userGet(response.data, page, type));
            }
        }).catch(err => {
            // 404 error, pageNumber not found, redirect to 1 page less than current page
            // backend does not return appropriate http error code i.e, 404 
            if(err.response && err.response.data.error === 'Invalid page.' && history) {
                let nextPage;
                if(afterDelete) {
                    nextPage = page - 1 || page;
                } else {
                    nextPage = "last"
                }
                history.push({pathname: "", search: `?page=${nextPage}` });
            } else {
                dispatch(userError(err, dispatch));
            }
        })
    }
}

export const getUsers = (orgId, page = 1, size = 10, type, filters, sorter, activeFilters, activeSorter, extraColumns, history) => {
    let url = `${APP_URL}/${orgId}/users/org_users?page=${page}&page_count=${size}&type=${type.id}`

    Object.keys(filters).map(item => {
        if (item.includes('extra_fields')) {
            const matchedObj = extraColumns.find(column => `extra_fields__${column.key}` === item)
            if (matchedObj.type === 'string') url += `&${item}__icontains=${filters[item]}`
            if (matchedObj.type === 'number' || matchedObj.type === 'date') url += `&${item}=${filters[item]}`
        } else url += `&${item}__icontains=${filters[item]}`
        return null
    })

    if (sorter) url += `&ordering=${sorter}`

    return dispatch => {
        dispatch(setLoader(true))
        axios.get(url).then(response => {
            if (response.data.data && response.data.pagination_data) dispatch(userGet(response.data, page, size, type, filters, sorter, activeFilters, activeSorter, extraColumns))
            if (response && response.data.data.length === 0 && response.data.error === 'Invalid page.' && history) {
                const total = response.data.total
                let nextPage
                if (total % 10 > 0) nextPage = total > 10 ? Math.ceil(total / 10) : 1
                else nextPage = Math.floor(total / 10)
                history.push({ pathname: '', search: `?page=${nextPage}` })
            }
        }).catch(error => {
            dispatch(userError(error, dispatch))
        })
    }
}

export const getUserById = (orgId, id) => {
    return dispatch => {
        axios.get(`${APP_URL}/${orgId}/users/org_users/${id}`).then(response => {
            dispatch(userGetById(response.data.data))
        }).catch(err => {
            dispatch(userError(err, dispatch))
        })
    }
}

export const getRoles = (orgId, owner = null) => {
    return dispatch => {
        dispatch(setLoader())
        axios.get(`${APP_URL}/${orgId}/users/org_roles${owner ? `?get_owner=true` : ``}`).then(response => {
            dispatch(rolesGet(response.data))
        }).catch(err => {
            dispatch(userError(err, dispatch))
        })
    }
}

export const searchUser = (orgId, query) => {
    return dispatch => {
        axios.get(`${APP_URL}/${orgId}/users/org_users?search=${query}`).then(response => {
            dispatch(userSearch(response.data))
        }).catch(err => {
            dispatch(userError(err, dispatch))
        })
    }
}

export const createUser = (orgId, userData, nextPage, history) => {
    return dispatch => {
        dispatch(setLoader())
        axios.post(`${APP_URL}/${orgId}/users/org_users`, userData).then(response => {
            dispatch(userCreate(response.data))
            dispatch(addToast('success', 'Success', response.data.message))
            history.push(`/custom-workflow/org/${orgId}/config/users?page=${nextPage}`)
        }).catch(err => {
            dispatch(userError(err, dispatch))
        })
    }
}

export const editUser = (orgId, user, nextPage, history) => {
    return dispatch => {
        dispatch(setLoader())
        axios.put(`${APP_URL}/${orgId}/users/org_users/${user.id}`, user.data).then(response => {
            dispatch(userUpdate(response.data))
            dispatch(addToast('success', 'Success', response.data.message))
            history.push(`/custom-workflow/org/${orgId}/config/users?page=${nextPage}`)
        }).catch(err => {
            dispatch(userError(err, dispatch))
        })
    }
}

export const searchUsers = (orgId, searchItem, page = 1, type = 'active', history) => {
    let url = `${APP_URL}/${orgId}/users/org_users?search=${searchItem}&page=${page}&type=${type}`;
    return dispatch => {
        axios.get(url)
        .then(res => {
            dispatch(UserSearchSuccess(res.data, searchItem , page, type));
        })
        .catch(err => {
            // 404 error, pageNumber not found, redirect to 1 page less than current page
            // backend does not return appropriate http error code i.e, 404 
            if(err.response && err.response.data.error === 'Invalid page.' && history) {
                history.push({pathname: "", search: `?page=${page - 1 || page}` });
            } else {
                dispatch(userError(err, dispatch));
            }
        })
    }
}

export const clearUserSearch = () => {
    return dispatch => {
        dispatch(clearUserSearchResult())
    }
}

export const setUsersSearch = (query) => {
    return dispatch => {
        dispatch({
            type: actionTypes.SET_USERS_SEARCH,
            query
        })
    }
}

export const deleteUser = (orgId, id, total, itemsPerPage, page, renderPage) => {
    return dispatch => {
        dispatch(setLoader());
        axios.delete(`${APP_URL}/${orgId}/users/org_users/${id}`).then(() => {
            // Appending asterisk to the renderPage string data results in change in value of renderPage variable
            // This helps to run the useEffect in the list page in order to fetch updated current page data after deletion of an item
            const expectedPage = Math.ceil((total - 1) / itemsPerPage)
            const isRenderRequired = parseInt(page, 10) >= expectedPage ? `${renderPage}*` : renderPage
            dispatch(userDelete(id, isRenderRequired))
            dispatch(addToast('success', 'Success', 'A user has been deleted successfully'))
        }).catch(err => {
            dispatch(userError(err, dispatch))
        })
    }
}

export const recoverUser = (orgId, id) => {
    return dispatch => {
        dispatch(setLoader());
        axios.patch(`${APP_URL}/${orgId}/users/org_users/${id}/recover_user`, {}).then(response => {
            dispatch(renderUserPage())
            dispatch(addToast('success', 'Success', response.data.message))
        }).catch(err => {
            dispatch(userError(err, dispatch))
        })
    }
}