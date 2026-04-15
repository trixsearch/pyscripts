import React from "react";
import Datetime from "react-datetime";
import { Hour, Minute, Day } from "../SchedulerModal/utility";
import SilderCheckbox from "../../../components/UI/Checkbox/SliderCheckbox";
import * as constants from "../../../Data/constants";
import close from '../../../assets/images/svg/close.svg'

export const SelectItem = React.memo(
  ({ name, value, onChange, disabled, children }) => (
    <select
      className="form-cron"
      value={value}
      name={name}
      onChange={onChange}
      disabled={disabled}
    >
      {children}
    </select>
  )
);

export const CrossButton = React.memo(props => (
  <button
    type="button"
    onClick={props.onClick}
    className="cron-delete btn btn-disabled btn-circle"
  >
    <span className="glyphicon glyphicon-remove" />
  </button>
));

export const Options = React.memo(({ name, value }) => (
  <option value={value}>{name}</option>
));

export const CronFirst = React.memo(
  ({
   options, cron_expression, count, stop_scheduling,handleCronChange,stop_scheduler,delete_confirm
  }) => (
    <div className="cron_list">
      <div className="first_cron">
        Create report every
        <SelectItem
          disabled
          value={options}
          name="options"
          onChange={handleCronChange}
        >
          <Options value="day" name="Day" />
          <Options value="week" name="Week" />
          <Options value="month" name="Month" />
        </SelectItem>
        {options === "week" ? (
          <>
            {" "}
            On
            <SelectItem
              value={cron_expression[4]}
              name="week"
              onChange={handleCronChange}
            >
              <Options value="0" name="Sunday" />
              <Options value="1" name="Monday" />
              <Options value="2" name="Tuesday" />
              <Options value="3" name="Wednesday" />
              <Options value="4" name="Thursday" />
              <Options value="5" name="Friday" />
              <Options value="6" name="Saturday" />
            </SelectItem>
            at
            <Hour
              hour={cron_expression[1]}
              handleCronChange={handleCronChange}
            />
            :
            <Minute
              minute={cron_expression[0]}
              handleCronChange={handleCronChange}
            />
          </>
        ) : (
          ""
        )}
        {options === "month" ? (
          <>
            on the
            <Day
              handleCronChange={handleCronChange}
              day={cron_expression[2]}
            />
            at
            <Hour
              hour={cron_expression[1]}
              handleCronChange={handleCronChange}
            />
            :
            <Minute
              minute={cron_expression[0]}
              handleCronChange={handleCronChange}
            />
          </>
        ) : (
            <>
              {" "}
              at
              <Hour
                hour={cron_expression[1]}
                handleCronChange={handleCronChange}
              />
              :
              <Minute
                minute={cron_expression[0]}
                handleCronChange={handleCronChange}
              />
            </>
        )}
      </div>

      <div className="stop_scheduler">
        Scheduled
        <SilderCheckbox
          name="stop"
          onChange={stop_scheduler}
          checked={stop_scheduling}
        />
        <div className="pause_text">Paused </div>
      </div>

      <div className="second_cron">
        {count > 1 ? <CrossButton onClick={delete_confirm} /> : ""}
      </div>
    </div>
  )
);


export const DateComponent = React.memo(props => (
  <div
    className="floating-label col-md-6 scheduler_datetime"
    style={{
      display: "block",
      marginTop: "10px",
      marginBottom: "15px"
    }}
  >
    <span className="datetime-text">{props.label}</span>
    <Datetime
      timeFormat={false}
      isValidDate={props.isValidDate}
      dateFormat={constants.DATE_FORMAT}
      closeOnSelect
      value={props.value}
      onChange={props.onChange}
    />
  </div>
))


export const EmailGroupList = props => {
    return(
      <div className="email_list">
      {props.email_group &&
        props.email_group.map(e => {
          return (
            <div
              key={e.name}
              className={
                `email_group_cross${ 
                e.type === "user" ? " user" : " group"}`
              }
            >
              <span
                className={
                  `email_icon ${ 
                  e.type === "user"
                    ? " glyphicon glyphicon-envelope"
                    : " icon-group"}`
                }
              />
              <div className="email_list_content">{e.name}</div>
              <div>
                <button
                  name={e.name}
                  onClick={() => props.delete_group_email(e.name)}
                  type="button"
                  className="cross_button"
                >
                  <img src={close} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    )
}

export const RadioComponent = React.memo(props => (
  <div>
      <input
        name={props.name}
        type="radio"
        checked={props.checked}
        value={props.value}
        onChange={props.onChange}
      />
      {props.label}
  </div>
))