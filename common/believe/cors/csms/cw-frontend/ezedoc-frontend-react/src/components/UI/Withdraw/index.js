import React, { useState } from 'react';
import { connect } from 'react-redux';
import Modal from '../../Modal';

const Withdraw = ({
    show, handleClose, handleSave, title,
}) => {
    const [comment, setComment] = useState('');
    const [btnDisabled, setBtnDisabled] = useState(true)
    const handleChange = (event) => {
        setComment(event.target.value)
        if (event.target.value === "") {
            setBtnDisabled(true)
        } else setBtnDisabled(false)
    }
    return (
        <>
            <Modal
                show={show}
                onClose={() => handleClose()}
                title={title}
                primaryBtn={{
                    text: "Save", disabled: btnDisabled, className: "fancy_btn active", onClick: () => handleSave(comment)
                }}
                secondaryBtn={{ text: "Cancel", className: "fancy_btn", onClick: () => handleClose() }}
            >
                <div>
                    <label>
                        Reason for withdrawing the process
                    </label>
                    <textarea
                        placeholder="Write your reason here"
                        className="form-control"
                        type="text"
                        rows="10"
                        style={{ marginTop: "10px" }}
                        value={comment}
                        onChange={handleChange}
                    />
                </div>
            </Modal>
        </>
    )
}


export default connect(null, null)(Withdraw);
