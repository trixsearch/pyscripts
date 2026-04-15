import React from "react";

import { Button } from "components/UI/AppButton/AppButton";
import { truncateStringFromMiddle } from "containers/utils";
import moment from "moment";
import './BgvUpdateCommon.css'

export const FileInput = (props) => {
  const {
    name, label, error, value, onBlur, touched, setFieldValue
  } = props;
  const fileName = typeof value === 'string' ? value : value?.name
  return (
    <div className="col-md-12 mb-10 capture-file-input-wrapper">
      <div>
        <label htmlFor={name} className="capture-file-input" style={{ top: 0 }}>
          {label || "Choose File"}
        </label>
        <input
          id={name}
          type="file"
          name={name}
          className="capture-file"
          onChange={(e) => {
            setFieldValue(name, e.currentTarget.files[0]);
          }}
          onBlur={onBlur}
        />
        {fileName && (
          <span className="file-tag">
            <a href={fileName} target="_blank" rel="noopener noreferrer">
              <span className="file-tag-name">
                {truncateStringFromMiddle(fileName, 20)}
              </span>
            </a>
            <button
              type="button"
              className="file-tag-close-btn"
              onClick={() => {
                setFieldValue(name, "");
              }}
            >
              &#10005;
            </button>
          </span>
        )}
      </div>
      {error && touched ? (
        <span className="errorStyle">{error}</span>
      ) : (
        <span className="errorStyle">&nbsp;</span>
      )}
    </div>
  );
};

export const BgvUpdateFormActions = (props) => (
  <div
    style={{
      textAlign: "center",
      bottom: "0",
      // position: "absolute",
      width: "100%",
      zIndex: 5,
      paddingTop: "2rem",
      marginTop: "1rem",
      // borderTop: "1px solid black",
    }}
    className="bgv_form_action"
  >
    <Button variant="primary" disabled={props.disabled} onClick={props.onSubmit}>
      Update
    </Button>
    <Button variant="secondary" onClick={props.onClose}>
      Close
    </Button>
  </div>
);

export const formatDateBgv = (date) => {
  if (!date) return "";
  let resultDate = moment(date).format('YYYY-MM-DD');
  return resultDate;
};
