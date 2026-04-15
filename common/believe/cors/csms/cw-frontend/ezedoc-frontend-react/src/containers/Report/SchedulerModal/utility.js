import React from "react";
import { getUrlVars } from "containers/utils";
import {REPORT_CHOICES} from '../../../Data/constants'

export const validateEmail = email => {
  let re = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email);
};

export const getTimeOffset = () => {
  const offset = new Date().getTimezoneOffset();
  return offset;
}

export const convertCornToString = exp => {
  if (typeof exp === "string") {
    return exp;
  } 
  return exp.join(" ");
};

export const nth = d => {
  if (d > 3 && d < 21) return "th";
  switch (d % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
};

export const payloadSerializer = (expCount, id, type) => {
  let schedule_data = [...expCount].map(exp => {
    return {
      cron_expression: convertCornToString(exp.cron_expression),
      report_recipients: exp.email_group.filter((e)=>e.type === "user").map((e)=>e.name).join(','),
      recipients_group : exp.email_group.filter((e)=>e.type === "group").map((e)=>e.name).join(','),
      report_template_id: id,
      start_date: exp.start_date.toISOString(),
      end_date: exp.end_date.toISOString(),
      id: type === "post" ? "" : exp.id,
      tenant_name: window.location.host.split('.')[0],
      stop_scheduling : exp.stop_scheduling,
      timezone_offset : getTimeOffset()
    };
  });
  
  return schedule_data;
};

export const addEmailGroupTag = (report_recipients, group) => {
  let reportRecipients = report_recipients === "" ? [] :report_recipients.split(',')
  let groups = group === "" || group === null ? [] :group.split(',')
  const group_list = groups && groups.map(e => {
      return {
        name: e,
        type: "group",
      };
    });
  const report_recipients_list = reportRecipients && reportRecipients.map((e, index) => {
      return {
        name: e,
        type: "user",
      };
    });
  return [...report_recipients_list, ...group_list];
};

export const cronExpDecider = (options, index, expCount, value) => {
  let cronExp = expCount;
  if (options === "minute") {
    cronExp[index].cron_expression[0] = value;
  } else if (options === "hour") {
    cronExp[index].cron_expression[1] = value;
  } else if (options === "week") {
    cronExp[index].cron_expression[4] = value;
  } else if (options === "month") {
    let index_month = cronExp[index].options === "year" ? 3 : 2;
    cronExp[index].cron_expression[index_month] = value;
  } else if (options === "day") {
    cronExp[index].cron_expression[2] = value;
  }

  cronExp[index].changed = true;
  return cronExp;
};

export const cronType = exp => {
  let type = "hour";
  if (!isNaN(exp[3])) {
    type = "year";
  } else if (!isNaN(exp[2])) {
    type = "month";
  } else if (!isNaN(exp[4])) {
    type = "week";
  } else if (!isNaN(exp[1])) {
    type = "day";
  }
  return type;
};

export const convertUser = users => {
  return users.join(",");
};

const createUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
     let r = Math.random() * 16 | 0; let v = c === 'x' ? r : (r & (0x3 | 0x8));
     return v.toString(16);
  });
}


export const DefaultData = () => {
  let report_type = getUrlVars()
  report_type = parseInt(report_type.report_type, 10)
  return {
    cron_expression: ["*", "*", "*", "*", "*"],
    report_recipients: "",
    recipients_group: [],
    email_group: [],
    options: REPORT_CHOICES[report_type],
    start_date: "",
    end_date: "",
    old_data: false,
    changed: false,
    deleted: false,
    id: createUUID(),
    invalid: false,
    checkType: "user",
    stop_scheduling:false,
    modal : false
  };
};

export const ChangeDataUser = (expCount, email_group, type) => {
  return {
    ...expCount,
    report_recipients: "",
    [type]: email_group,
    changed: true,
    invalid: false
  };
};

export const ChangeDataGroup = (expCount,value) => {
  return {
    ...expCount,
    recipients_group: [],
    changed: true,
    email_group: expCount.email_group.concat({
      name: value.label,
      type: "group"
    })
  };
};

export const DeleteGroup = (expCount, name) => {
  return {
    ...expCount,
    changed: true,
    email_group: expCount.email_group.filter(e => e.name !== name)
  };
};

export const Minute = props => {
  return (
    <select
      className="form-cron"
      name="minute"
      value={props.minute}
      onChange={props.handleCronChange}
    >
      {[...Array(60).keys()].map(minute => {
        return (
          <option key={minute} value={minute}>
            {minute}
          </option>
        );
      })}
    </select>
  );
};

export const Hour = props => {
  return (
    <select
      className="form-cron"
      name="hour"
      value={props.hour}
      onChange={props.handleCronChange}
    >
      {[...Array(24).keys()].map(hour => {
        return (
          <option key={hour} value={hour}>
            {hour}
          </option>
        );
      })}
    </select>
  );
};
export const Day = props => {
  return (
    <select
      className="form-cron"
      name="day"
      value={props.day}
      onChange={props.handleCronChange}
    >
      {[...Array(28).keys()].map(day => {
        return (
          <option key={day} value={day + 1}>
            {day + 1 + nth(day + 1)}
          </option>
        );
      })}
    </select>
  );
};

export const Button = React.memo((props) => (
  <button
    type="button"
    className={props.className}
    onClick={props.onClick}
    style={props.style}
  >
    {props.name}
  </button>

));

export const SaveAndExit = React.memo(props => (
  <div className="scheduler_save">
    <Button name="Cancel" className="fancy_btn" onClick={() => props.history.goBack()} />
    <Button name="Save" className="add_query fancy_btn active" onClick={props.save}/>
  </div>
));