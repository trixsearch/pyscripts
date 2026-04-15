import React from "react";
import ReactTooltip from 'react-tooltip';
import {isMobile} from '../../utils';

const ShowAppSection = (props) => {
    let form = null;
    if(props.loading && props.installing === props.id){
        form = <button type="button" className="install_app_btn">Installing</button>;
    }else {
        form = (
        <button type="button" className="install_app_btn" onClick={props.installed ? props.start : props.click}>
            {props.installed ? "Start Using..." : "Install App"}
        </button>
        )
    } 
    return (
        <div key={props.name} className="app_showing_card outer_app_category">
            <div className="app_category_inner_card">
                <p><span className={props.icon}/></p>
                <p data-tip data-for={props.name} className="category_card_text">{props.name}</p>
                {!isMobile() ? (
                    <ReactTooltip id={props.name} place='bottom' delayShow={100} aria-haspopup='true' className="app_btn_bg_color">
                        <h6 style={{textTransform: 'capitalize'}}>{props.name}</h6>
                    </ReactTooltip>
                ) : null}
                {form}
            </div>
        </div>
    );
}

export default ShowAppSection;
