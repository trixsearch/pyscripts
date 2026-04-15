import React from "react";
import PropTypes from "prop-types";

import ServerError from "../ServerError";

import "./styles.css";

const MainContainer = (props) => {
  const { serverError, fallback, children } = props;

  if (serverError && !!fallback) {
    return (
      <div className="not-applicable-cont">
          <span role="img" aria-label="Not Available">
            {fallback}
          </span>
      </div>
    );
  }

  if (serverError) {
    return <ServerError />;
  }

  return <div className="main-container">{children}</div>;
};

MainContainer.propTypes = {
  serverError: PropTypes.bool || null,
  fallback: PropTypes.string || null,
  children: PropTypes.oneOfType(React.Children || null),
};

MainContainer.defaultProps = {
  serverError: false,
  fallback: null,
  children: null,
};

export default MainContainer;
