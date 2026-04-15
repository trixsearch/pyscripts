import { ADD_TOAST, CLEAR_TOASTS, REMOVE_TOAST } from "./reducer";

const uniqueId = prefix => {
  return `${prefix}-${new Date().getTime()}`;
};

export const removeToast = id => ({
  type: REMOVE_TOAST,
  id
});

export const addToast = (type, title, message, duration = 5000) => dispatch => {
  const id = uniqueId("toast");
  let toasterDuration = type === 'error' ? null : duration;

  if (toasterDuration) {
    setTimeout(() => {
      return dispatch(removeToast(id));
    }, toasterDuration);
  }
  return dispatch({
    type: ADD_TOAST,
    toast: {
      id,
      type,
      title,
      message,
      toasterDuration
    }
  });
};

export const addRefreshToast = (type, title, message, refreshFunc) => dispatch => {
  const id = uniqueId("toast");
  return dispatch({
    type: ADD_TOAST,
    toast: {
      id,
      type,
      title,
      message,
      refreshFunc,
      refresh: true
    }
  });
}

export const clearToasts = () => ({
  type: CLEAR_TOASTS
});
