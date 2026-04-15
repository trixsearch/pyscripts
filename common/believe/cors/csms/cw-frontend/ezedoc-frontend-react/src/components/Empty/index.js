import React from "react";

import Cloud from "assets/images/no_records.png";

import "./style.css";

// Empty placeholder, when there is no data
const Empty = (props) => {
  const { isLoading, style } = props;
  if (isLoading) {
    return null;
  }
  return (
    <div className="empty-data-placeholder" style={{...style}}>
      <img src={Cloud} alt="no-data" />
      <h5>No Data</h5>
    </div>
  );
};

export default Empty;
