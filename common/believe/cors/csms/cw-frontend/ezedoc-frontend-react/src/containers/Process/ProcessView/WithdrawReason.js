import React, {useState} from 'react';

import Modal from "../../../components/Modal";
import { Button } from '../../../components/UI/AppButton/AppButton';

const WithdrawReason = (props) => {
    const [show, modalShow] = useState(false);

    const modalBody = (
        <div>
            <textarea
                className="form-control"
                type="text" 
                rows="10"
                style={{marginTop : "10px"}}
                value={props.deleteReason} 
                disabled
            />
        </div>
    )

    return(
        <div>
            <Button variant="link" onClick={() => { modalShow(true) }}>Withdraw Reason</Button>
            <Modal 
                show={show} 
                onClose={() => modalShow(false)} 
                title="Withdraw Reason"
                secondaryBtn={{ text: "Cancel", className: "fancy_btn", onClick: () => modalShow(false)}}>
                {modalBody}
            </Modal>
        </div>
    );
}

export default WithdrawReason;