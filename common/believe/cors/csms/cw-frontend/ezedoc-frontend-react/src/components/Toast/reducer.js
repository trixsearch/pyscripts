export const ADD_TOAST = "ADD_TOAST";
export const REMOVE_TOAST = "REMOVE_TOAST";
export const CLEAR_TOASTS = "CLEAR_TOASTS";

const initialState = {
  toasts: []
};

const toastReducer = (state = initialState, action) => {
  switch (action.type) {
    case ADD_TOAST:
      return {
        toasts: [...state.toasts, action.toast]
      };
    case REMOVE_TOAST:
      return {
        toasts: state.toasts.filter(toast => toast.id !== action.id)
      };
    case CLEAR_TOASTS:
      return {
        toasts: []
      };
    default:
      return {
        ...state
      };
  }
};

export default toastReducer;
