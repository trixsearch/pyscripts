import React from 'react';
import { parseQueryString } from "containers/utils";
import drishti from '../../../assets/images/svg/drishti.svg'
import './DrishtiButton.css'

function DrishtiButton(props) {
    const { processId, tenantId } = props;
    if ((parseQueryString(window.location.search).drishti)) {
        const url = `/custom-workflow/org/${tenantId}/drishti?process_id=${processId}`
        return (
            <a rel="noopener noreferrer" className='dristhi-cntr' target="_blank" href={url}>
                <span className="drishti-btn">
                    <img src={drishti} />
                </span>
            </a>
        )
    }
    return null
}

export default DrishtiButton;
