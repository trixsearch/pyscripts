import React from 'react';
import './style.css'
import no_records from "../../assets/images/no_records.png"

function FallbackWidget() {

  return (
    <div className="fallback-main-container">
      <div className="no_chart_img_text">
        <img src={no_records} alt="" />
        <p>This Chart is not available for your role.</p>
      </div>
    </div>
  )
}

export default FallbackWidget;