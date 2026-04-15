import React from "react";
import Modal from '../../components/Modal/index';

const StatusModal = (props) => {
    return (
        <div>
            <Modal
                show={props.open}
                onClose={props.close}
                title={props.title}
                primaryBtn={{ text: "Ok", className: 'fancy_btn active', onClick: props.close }}
                secondaryBtn={{ text: "Cancel", className: 'fancy_btn', onClick: props.close }}
            >
                <div>                       
                    <div className="warning_message">
                        {props.info}
                    </div>
                </div>
            </Modal>
            
        </div>
      
    )
}

export default StatusModal;
