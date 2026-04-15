import React from "react";

import CloudError from "assets/images/cloud_error.svg";

import "./styles.css";

export default function ServerError() {
  return (
    <div className="internal-server-error">
      <img src={CloudError} alt="5xx" className="cloud-error" />
      <h4>Something Went Wrong</h4>
      <p>
        You may refresh the page, or please try again later. If the issue
        persists contact support.
      </p>
    </div>
  );
}
