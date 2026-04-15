import React from 'react';
import ReactTooltip from 'react-tooltip'

const ChartTooltip =({
    id,name, description
})=>{
return(
    <div>
    <div data-tip data-for={id} className="widget-tooltip"><p>{name}</p></div>
    <ReactTooltip id={id} place="bottom" aria-haspopup='true' className="app_btn_bg_color">
      <p className="app_title">{name}</p>
      <p className="app_description">{description}</p>
    </ReactTooltip>
    </div>
)
}
export default ChartTooltip;