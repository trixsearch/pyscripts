import React, { Component } from "react";
import { connect } from "react-redux";
import axios from "axios";
import moment from "moment";
import "react-datetime/css/react-datetime.css";
import { getUrlVars } from "containers/utils";
import CronExp from "../Cron/CronExp";

import "../Report.css";
import "./schedular.css";

import { addToast } from "../../../components/Toast/actions";
import {
  validateEmail,
  payloadSerializer,
  cronExpDecider,
  addEmailGroupTag,
  DefaultData,
  ChangeDataUser,
  ChangeDataGroup,
  DeleteGroup,
  SaveAndExit,
  Button
} from "./utility";

import { REPORT_CHOICES } from "../../../Data/constants";

class Scheduler extends Component {
  state = {
    report_id: this.props.match.params.id,
    schedule_history: [DefaultData()]
  };

  componentDidMount() {
    let report_type = getUrlVars();
    this.allScheduler( this.state.report_id, parseInt(report_type.report_type, 10));
  }

  allScheduler = (id, report_type) => {
    const APP_URL = process.env.REACT_APP_APP_URL;
    let { uuid: orgId } = this.props.match.params;
    axios
      .get(`${APP_URL}/${orgId}/scheduled_report?report_id=${id}`)
      .then(response => {
        let scheduler = response.data.data;
        if (scheduler.length !== 0) {
          scheduler =
            scheduler &&
            scheduler.map(e => {
              return {
                cron_expression: e.cron_expression.split(" "),
                options: REPORT_CHOICES[report_type],
                start_date: moment(e.start_date).local(),
                end_date: moment(e.end_date).local(),
                old_data: true,
                changed: false,
                deleted: false,
                id: e.id,
                report_recipients: "",
                group: [],
                email_group: addEmailGroupTag(
                  e.report_recipients,
                  e.recipients_group
                ),
                invalid: false,
                checkType: "user",
                stop_scheduling: e.stop_scheduling
              };
            });

          this.setState({
            schedule_history: [...scheduler]
          });
        }
      })
      .catch(e => {
        console.log(e);
      });
  };

  delete_cron = (event, id) => {
    let delete_history = this.state.schedule_history;
    let index = delete_history.findIndex(e=> e.id ===id)
    delete_history[index] = {
      ...delete_history[index],
      deleted: true
    };
 
    this.setState({
      schedule_history: delete_history
    });
  };

  handleChange = (event, id) => {
    let { schedule_history } = this.state;
    let index = schedule_history.findIndex(e=> e.id ===id)
    let { value } = event.target;
    if (event.keyCode === 13 || event.which === 13) {
      if (
        validateEmail(value) &&
        !schedule_history[index].email_group.some(e => e.name === value)
      ) {
        let email_group = schedule_history[index].email_group.concat({
          name: value,
          type: "user"
        });
        schedule_history[index] = ChangeDataUser(
          schedule_history[index],
          email_group,
          "email_group"
        );
       
      } else {
        schedule_history[index] = {
          ...schedule_history[index],
          recipients_email: value,
          invalid: true
        };
      }
    } else {
      schedule_history[index] = ChangeDataUser(
        schedule_history[index],
        value,
        "report_recipients"
      );
    }

    this.setState({
      schedule_history: schedule_history
    });
  };

  delete_confirm = (event, id) => {
    let { schedule_history } = this.state;
    let index = schedule_history.findIndex(e=> e.id ===id)
    schedule_history[index] = {
      ...schedule_history[index],
      modal: true
    };
    this.setState({
      schedule_history
    });
  };

  onCloseModal = (event, id) => {
    let { schedule_history } = this.state;
    let index = schedule_history.findIndex(e=> e.id ===id)
    schedule_history[index] = {
      ...schedule_history[index],
      modal: false
    };

    this.setState({
      schedule_history
    });
  };

  delete_group_email = (event, id) => {
    let { schedule_history } = this.state;
    let index = schedule_history.findIndex(e=> e.id ===id)
    schedule_history[index] = DeleteGroup(schedule_history[index], event);
    this.setState({
      schedule_history
    });
  };

  addExp = () => {
    this.setState(prevState => ({
      schedule_history: [...prevState.schedule_history, DefaultData()]
    }));
  };

  stop_scheduler = (event, id) => {
    let value = event.target.checked;
    let { schedule_history } = this.state;
    let index = schedule_history.findIndex(e=> e.id ===id)

    schedule_history[index] = {
      ...schedule_history[index],
      stop_scheduling: value,
      changed: true
    };
    this.setState({
      schedule_history
    });
  };

  save = () => {
    const APP_URL = process.env.REACT_APP_APP_URL;
    let { id, uuid: orgId } = this.props.match.params;
    let schedule_history = [...this.state.schedule_history];
    let execute = true;
    schedule_history.map(e => {
      if(e.options === "day") {
        e.cron_expression[0] = e.cron_expression[0] === "*" ? "0" : e.cron_expression[0];
        e.cron_expression[1] = e.cron_expression[1] === "*" ? "0" : e.cron_expression[1];
      }else if(e.options === "week") {
        e.cron_expression[4] = e.cron_expression === "*" ? "0" : e.cron_expression[4];
        e.cron_expression[0] = e.cron_expression === "*" ? "0" : e.cron_expression[0];
        e.cron_expression[1] = e.cron_expression === "*" ? "0" : e.cron_expression[1];
      }else if(e.options === "month") {
        e.cron_expression[2] = e.cron_expression[2] === "*" ? "1" : e.cron_expression[2];
        e.cron_expression[0] = e.cron_expression[0] === "*" ? "0" : e.cron_expression[0];
        e.cron_expression[1] = e.cron_expression[1] === "*" ? "0" : e.cron_expression[1];
      }
      if (
        (e.email_group.length === 0 ||
        e.start_date === "" ||
        e.end_date === "") && e.deleted !== true
      ) {
        this.props.addToast(
          "error",
          "Error",
          "Please fill all the mandatory details"
        );
        execute = false;
      }
      return e.id;
    });
    let post_data = schedule_history.filter(
      data => data.old_data === false && data.deleted === false
    );
    let patch_data = schedule_history.filter(
      data => data.old_data === true && data.changed === true
    );
    let deleted_data = schedule_history.filter(
      data => data.old_data === true && data.deleted === true
    );

    let promises = [];
    if (execute) {
      post_data = payloadSerializer(post_data, id , "post");
      patch_data = payloadSerializer(patch_data, id);
      deleted_data = payloadSerializer(deleted_data, id);
      if (post_data.length) {
        promises.push(
          axios.post(`${APP_URL}/${orgId}/scheduled_report`, post_data)
        );
      }

      if (patch_data.length) {
        patch_data.map(e => {
          promises.push(
            axios.patch(`${APP_URL}/${orgId}/scheduled_report/${e.id}`, e)
          );
          return e.id;
        });
      }
      if (deleted_data.length) {
        deleted_data.map(e => {
          promises.push(
            axios.delete(`${APP_URL}/${orgId}/scheduled_report/${e.id}`)
          );
          return e.id;
        });
      }

      axios
        .all(promises)
        .then(() => {
          this.props.addToast('success', 'Success',"Scheduler updated successfully")
          this.props.history.push("/reports");     
        })
        .catch(err =>
          this.props.addToast("error", "Error", "Something went wrong")
        );
    }
  };

  handleGroupChange = (event, id) => {
    let value = event;
    let { schedule_history } = this.state;
    let index = schedule_history.findIndex(e=> e.id ===id)
    if (!schedule_history[index].email_group.some(e => e.name === value.label)) {
      schedule_history[index] = ChangeDataGroup(schedule_history[index], value);
      this.setState({
        schedule_history
      });
    }
  };

  checkTypeOfUserGroup = (event, id) => {
    let value = event.target.value;
    let { schedule_history } = this.state;
    let index = schedule_history.findIndex(e=> e.id ===id)
  
    schedule_history[index] = {
      ...schedule_history[index],
      checkType: value
    };
    this.setState({
      schedule_history
    });
  };

  handleCronChange = (event, id) => {
   
    let value = event.target.value;
    let name = event.target.name;
    let schedule_history = this.state.schedule_history;
    let index = schedule_history.findIndex(e=> e.id ===id)
    /*
      ["*", "*", "*", "*", "*"]
      minute is pointing to 0 in cron expression
      hour is ponting to 1 in cron expression
      week is pointing to 4 in cron expression
      month is pointing depends on year and options
      If the options is year then month has to point to 3 or else 2
      Day is pointing to 2 in cron expression(It should be last)
     ss
    */
    if (name === "options") {
      // Changing the type clearing the cron expression.
      schedule_history[index] = {
        ...schedule_history[index],
        options: value,
        cron_expression: ["*", "*", "*", "*", "*"]
      };
    }

    schedule_history = cronExpDecider(name, index, schedule_history, value);

    this.setState({
      schedule_history: schedule_history
    });
  };

  handleBeginAt = (selectedDate, id) => {
    let { schedule_history } = this.state;
    let index = schedule_history.findIndex(e=> e.id ===id)
    schedule_history[index] = {
      ...schedule_history[index],
      start_date: selectedDate,
      changed: true
    };

    this.setState({
      schedule_history
    });
  };

  handleEndAt = (selectedDate, id) => {
    let { schedule_history } = this.state;
    let index = schedule_history.findIndex(e=> e.id ===id)
    schedule_history[index] = {
      ...schedule_history[index],
      end_date: selectedDate,
      changed: true
    };
    this.setState({
      schedule_history
    });
  };

  handeleGroupEmail = (event, id) => {
    let { schedule_history } = this.state;
    let index = schedule_history.findIndex(e=> e.id ===id)
    let value = schedule_history[index].report_recipients;
    if (
      schedule_history[index].checkType === "user" &&
      validateEmail(value) && !schedule_history[index].email_group.some(e => e.name === value)
    ) {
      schedule_history[index] = {
        ...schedule_history[index],
        email_group: schedule_history[index].email_group.concat({
          type: "user",
          name: value
        }),
        report_recipients: ""
      };
    }
    this.setState({
      schedule_history
    });
  };

  render() {
    const title = "Schedule Report";
    let { schedule_history } = this.state;
    let expCount = schedule_history.filter((e)=> e.deleted !== true)

    return (
      <div className="scheduler_page">
        <div className="main_changable_container">
          <div className="app_btn_container reports_container">
            <form action="" className="form_up_box">
              <span>
                <strong>Create scheduler send this report</strong>
              </span>
              <div>
                <div className="total_report_graph_box pr-0">
                  <div className="cron_box">
                    <div>
                      {expCount.map((exp, index) => {
                        return (
                          <CronExp
                            {...exp}
                            key={exp.id}
                            index={index}
                            count={expCount.length}
                            handleBeginAt={event =>this.handleBeginAt(event, exp.id)}
                            handleEndAt={event =>this.handleEndAt(event, exp.id)}
                            cron_expression={exp.cron_expression}
                            handleChange={event =>this.handleChange(event, exp.id)}
                            handleCronChange={event =>this.handleCronChange(event, exp.id)}
                            delete={event => this.delete_cron(event, exp.id)}
                            checkTypeOfUserGroup={event =>this.checkTypeOfUserGroup(event, exp.id)}
                            handleGroupChange={event => this.handleGroupChange(event, exp.id)}
                            delete_group_email={event =>this.delete_group_email(event, exp.id)}
                            stop_scheduler={event =>this.stop_scheduler(event, exp.id)}
                            handeleGroupEmail={event =>this.handeleGroupEmail(event, exp.id)}
                            delete_confirm={event =>this.delete_confirm(event, exp.id)}
                            onCloseModal={event =>this.onCloseModal(event, exp.id)}
                          />
                        );
                      })}
                      <Button onClick={this.addExp} className="add_query fancy_btn active" name="Add Scheduler" style={{ marginTop: 7 }}/>
                    </div>
                  </div>
                </div>
              </div>
            </form>
            <SaveAndExit history={this.props.history} save={this.save}/>
          </div>
        </div>
      </div>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  addToast: (type, title, message, duration) => dispatch(addToast(type, title, message, duration))
});

export default connect(null, mapDispatchToProps)(Scheduler);
