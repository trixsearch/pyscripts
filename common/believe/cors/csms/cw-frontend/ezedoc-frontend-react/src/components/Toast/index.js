import React from 'react';
import { connect } from 'react-redux';
import ToasterComponent from "ezereactcomponents/Toaster";
import { clearToasts, removeToast } from './actions';

const Toast = (props) => {
    return (
        <div className="toasters">
            {props.toasts.map(toast => (
                <ToasterComponent
                    key={toast.id}
                    toast={toast}
                    removeToast={props.removeToast}
                />
            ))}
        </div>
    )
}

const mapStateToProps = ({ toasts }) => ({ ...toasts });

const mapDispatchToProps = (dispatch) => ({
    clearToasts,
    removeToast: (id) => dispatch(removeToast(id))
});

export default connect(mapStateToProps, mapDispatchToProps)(Toast);