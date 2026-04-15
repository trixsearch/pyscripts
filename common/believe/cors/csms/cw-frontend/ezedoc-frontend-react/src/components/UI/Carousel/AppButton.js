import React from "react";
import ReactTooltip from 'react-tooltip';
import './Carousel.css'
import {isMobile} from '../../../containers/utils';

const AppButton = (props) => {
    let minLengHovrCls = (props.elementName.name.length > 11) ? 'app_btn_small' : 'app_btn_small_hoverless';
    return (
        <div className={props.carouselLength > 10 ? "small_btn" : "big_btn"}>
            <button type="button" value={props.id} onClick={props.selectedApp} data-tip data-for={'app_btn_tooltip-' + props.id} className={props.appName === props.elementName.name || props.appId === props.id ? "app_btn active" : "app_btn"}>
                <span className="app_btn_icon">
                    <span className={props.elementName.icon_class} />
                </span>
                <span value={props.id} className={minLengHovrCls}>{props.elementName.name}</span>
            </button>
            {!isMobile() ? (
            <ReactTooltip id={"app_btn_tooltip-" + props.id} place="bottom" aria-haspopup='true' className="app_btn_bg_color">
                <p className="app_title">{props.elementName.name}</p>
                <p className="app_description">{props.elementName.description}</p>
            </ReactTooltip>
            ) : null}
        </div>

    )
}

export default AppButton;