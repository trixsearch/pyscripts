import React, { Component } from "react";
import { connect } from "react-redux";
import axios from "axios";

import AppSection from "./AppSection";
import ShowAppSection from "./ShowAppSection";
import * as actions from "../../../store/actions/index";
import "./workflow.css"
import Spinner from "../../../components/UI/Spinner/Spinner";

const APP_URL = process.env.REACT_APP_APP_URL;

class Apps extends Component {
  state = {
    data: [],
    clicked: 0,
    installing: "",
  }

  componentDidMount() {
    // this.props.onSelectId(this.state.clicked);
    this.props.onCount().then((res) => {
      this.setState({
        data: res,
      })
      if (res.length !== 0) {
        let first = res[0]
        this.props.onSelectId(first.id);
        this.setState({
          clicked: first.id
        })
      }
    }).catch((e) => {
      // eslint-disable-next-line no-console
      console.log(e)
    })
  }

  selectionId = (data) => {
    this.props.onSelectId(data);
    this.setState({
      clicked: data
    });
  }

  installId = (data) => {
    const orgId = this.props.match?.params?.uuid;
    this.props.onInstallId(orgId, data, this.state.clicked);
    this.setState({
      installing: data
    });
  }

  startProcess = (id) => {
    const orgId = this.props.match?.params?.uuid;
    let url = `${APP_URL}/${orgId}/apps/app_registry?id=${id}`;
    let orgAppId = null;
    
    axios.get(url)
      .then((response => {
        orgAppId = response.data.data.id;
        const processKey = response.data.data.process_key
        this.props.history.push({
          pathname: routes.START_NEW_PROCESS.to(orgId, orgAppId),
          state: {
            returnBackTo: `/custom-workflow/org/${orgId}/workflows/add`,
            redirectTo: `/custom-workflow/org/${orgId}/process?process_key=${processKey}&processType=Ongoing process&page=1&size=5`,
          }
        })
      }))
  }

  render() {
    if (this.props.processLoader) {
      return (<Spinner />)
    }

    let data = this.state.data;
    let category = data
      && Object.keys(data).map(d => {
        return (
          <AppSection
            key={d}
            id={data[d].id}
            name={data[d].name}
            icon={data[d].icon_class}
            clicked={this.state.clicked}
            click={() => this.selectionId(data[d].id)}
          />
        );
      });
    let appData = this.props.appData;
    let ShowApps = appData.apps
      && appData.apps.map(d => {
        return (
          <ShowAppSection
            key={d.id}
            name={d.name}
            installed={d.installed}
            icon={d.icon_class}
            id={d.id}
            loading={this.props.loading}
            installing={this.state.installing}
            click={() => this.installId(d.id)}
            start={() => this.startProcess(d.id)}
          />
        );
      });
    return (
      <div>
        
        {/* Temporarily commented off to not show the Create your own button
          <div className="body_nav_button" style={{ marginTop: "4px" }}>
            <button className="fancy_btn active">Create your Own</button>
          </div> */}
        <div className="app_category_cont ezedox_app_top" style={{ marginTop: "0" }}>
          <div className="app_category_head">
            <p>Choose Workflow Category</p>
          </div>
          <div className="app_category_card_cont">{category}</div>
        </div>
        <div className="app_showing_cont">
          <div className="app_showing_head">
            <div>
              <p>Showing All Workflows</p>
            </div>
          </div>
          <div className="app_showing_card_cont">{ShowApps}</div>
        </div>
      </div>
    )
  }
}
const mapStateToProps = state => {
  return {
    loading: state.appSection.loader,
    data: state.appSection.data,
    appData: state.appSection.appData,
    id: state.appSection.id,
    processLoader: state.process.loader,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onCount: () => dispatch(actions.AppSectionDetails()),
    onSelectId: id => dispatch(actions.AppSelection(id)),
    onInstallId: (orgId, id, appId) => dispatch(actions.AppInstall(orgId, id, appId)),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Apps);
