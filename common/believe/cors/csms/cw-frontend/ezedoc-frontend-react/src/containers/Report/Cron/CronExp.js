import React from "react";
import moment from "moment";
import AsyncSelect from "react-select/async";
import { useParams } from "react-router-dom";

import {
  DropdownIndicator,
  handleGroupSearch
} from "../../Config/Utils/ConfigUtils";
import { 
  CronFirst,
  DateComponent, 
  EmailGroupList,
  RadioComponent
} from './components'

import { customSchedular } from "../../Config/Utils/ReactSelectStyles";
import DeleteModel from "../../../components/UI/DeleteModel/DeleteModal";
import RightIcon from '../../../assets/images/svg/right_arrow_black.svg'

import "react-datetime/css/react-datetime.css";
import "./Cron.css";

const CronExp = props => {
  let {
    options,
    report_recipients,
    start_date,
    end_date,
    invalid,
    checkType,
    email_group,
    index,
    modal
  } = props;

  const { uuid: orgId } = useParams();

  const getFutureDates = (selectedDate) => {
    let now = moment().local().subtract(1,'days');
    if (selectedDate.isSameOrAfter(now)) {
      return true;
    }
    return false;
  };

  const getValidDates = selectedDate => {
    let startDate = moment(start_date);
    return startDate.isBefore(selectedDate);
  };

  return ( 
    <div className="main_changable_container schedule_cron">    
      <div className="edit_app_detils_form_cont">
        <div style={{ margin: "5px" }} className="cron_box_expression">
        <CronFirst {...props} />
        <DeleteModel
            show={modal}
            handleDelete={props.delete}
            hideWarning={props.onCloseModal}
        />
          <div className="choose_type">
            <div className="first_choice">
              {" "}
              <div className="first_notify">
                <div> Notify : </div>
                <RadioComponent 
                  name={index + options + start_date}
                  label="User"
                  checked={checkType === "user"}
                  value="user"
                  onChange={props.checkTypeOfUserGroup}
                />
                <RadioComponent
                  label="Group" 
                  name={index + options + start_date}
                  checked={checkType === "group"}
                  value="group"
                  onChange={props.checkTypeOfUserGroup}
                />
              </div>
              <div className={`select_email${invalid ? " invalid" : ""}`}>
                {checkType === "user" ? (
                  <>
                    <input
                      type="text"
                      value={report_recipients}
                      placeholder="Send email to one or more users"
                      onKeyDown={props.handleChange}
                      onChange={props.handleChange}
                      className="email_group"
                    />
                  </>
                ) : (
                  ""
                )}
                {checkType === "group" ? (
                  <AsyncSelect
                    value={[]}
                    placeholder="Send email to one or more groups"
                    styles={customSchedular}
                    loadOptions={(text) => handleGroupSearch(orgId, text)}
                    onChange={props.handleGroupChange}
                    components={{ DropdownIndicator }}
                  />
                ) : (
                  ""
                )}
              </div>
            </div>
            <div className="add_email_group">
              <button
                name="add"
                type="button"
                onClick={props.handeleGroupEmail}
                className="btn btn-disabled"
              >
                <img src={RightIcon} />
              </button>
            </div>
            <EmailGroupList email_group={email_group} delete_group_email={props.delete_group_email}/>
          </div>
          <div className="date_options">
            <DateComponent 
              label="Start Date"
              name="Valid from"
              isValidDate={getFutureDates}
              value={start_date}
              onChange={props.handleBeginAt}
            />
            <DateComponent 
              label="End Date"
              name="Valid till"
              isValidDate={getValidDates}
              value={end_date}
              onChange={props.handleEndAt}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CronExp;
