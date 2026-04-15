import React from "react";
import Warning from '../../WarningModal'


const DeleteModal = (props) => {
    return (
        <Warning 
            show={props.show}
            message={(
                <p>
                    Are you sure you want to delete &nbsp;
                    <strong>{props.itemName}</strong>
                    &nbsp; ?
                </p>
            )}
            primaryBtn={{
                text:"Delete",
                onClick: props.handleDelete
            }}
            secondaryBtn={{
                text:"Cancel",
                onClick: props.hideWarning
            }}
        />
    )
}

export default DeleteModal;