import React, { Component } from "react";
import axios from "axios";
import { withRouter } from "react-router-dom";
import { connect } from "react-redux";
import { Form } from "@ezedoxbp/react-formio";
import ImageCropper from "ezereactcomponents/ImageCropper";
import {handleRedirect} from 'containers/utils';

import * as actions from "../../store/actions/index";

import "./form.css";
import "@ezedoxbp/formiojs/dist/formio.full.min.css";

import { TOKEN } from "../../Data/constants";

const APP_URL = process.env.REACT_APP_APP_URL;

class FormIoBuilderPreview extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: "",
      description: "",
      key: "",
      form: [],
      versions: [],
      id: 0,
      version: 0,
      submission: {}
    };
    
  }

  componentDidMount() {
    const orgId = this.props.match?.params?.uuid;

    let [Header] = document.getElementsByClassName("Header_container");
    let [NavContainer] = document.getElementsByClassName("body_container");
    // let LeftSide = document.getElementById("lef_side");
    Header.style.display = "none";
    NavContainer.style.paddingTop = 0;
    NavContainer.style.paddingLeft = 0;
    // LeftSide.style.display = "none";

    
    this.props.formEdit(orgId).then((res) => {
      this.setState({
        name: res[0].name,
        description: res[0].description,
        version:res[0].version,
        id: res[0].id,
        fixId:res[0].id,
        key:res[0].key,
        form:res[0].content,
        versions:res[1],
      })
    })
      .catch(e => {
        console.log(e);
      });
  }

  componentWillUnmount() {
    let [Header] = document.getElementsByClassName("Header_container");
    let [NavContainer] = document.getElementsByClassName("body_container");
    // let LeftSide = document.getElementById("lef_side");

    Header.style.display = "block";
    NavContainer.style.paddingTop = "58px";
    NavContainer.style.paddingLeft = "100px";
    // LeftSide.style.display = "block";
  }

  displayType = e => {
    this.setState({ display: e.target.value });
  };

  formName = event => {
    this.setState({
      name: event.target.value
    });
  };

  selectVersioning = event => {
    const orgId = this.props.match?.params?.uuid;
    let version_temp = parseInt(event.target.value);
    let versions = this.state.versions.data.find(
      k => k.version === version_temp
    );

    let value = event.target.value;
    axios.get(`${APP_URL}/${orgId}/forms/modeler/${versions.key}?version=${version_temp}`)
    .then(response => {
      this.setState({
        version: value,
        form : response.data.data.content,
        id: response.data.data.id
       })  
     })
    .catch(err => {
      console.log("error")
    });
  }

  handleSubmit = data => {
    console.log(data);
  };

  exit = () => {
    let redirect_url = handleRedirect(
      window.location.href,
      window.location.hash
    );
    window.location.href = redirect_url;
  };

  formDescription = event => {
    this.setState({
      description: event.target.value
    });
  };

  // callMe = data => {
  //   let submission = data.data;
  //   if (data.component.tags.indexOf("clear") >= 0) {
  //     submission["aadhaarfrontback"] = [];
  //     submission["aadhaarcardback"] = [];
  //     submission["aadhaarData"] = 1;
  //   }

  //   if (data.component.tags.indexOf("Add") >= 0) {
  //     let aadhaarfrontback = [
  //       {
  //         storage: "url",
  //         originalName: "Aadhaar-Card (2).jpg",
  //         data: {
  //           form: "",
  //           name: "Aadhaar-Card (2).jpg",
  //           project: "",
  //           baseUrl: "https://api.form.io",
  //           size: 51409,
  //           url:
  //             "http://vishal22.codzelocal.com/api/forms/files/293f3527-240e-42da-9ff1-666fbf5a4844"
  //         },
  //         type: "image/jpeg",
  //         name: "Aadhaar-Card -2--f2e04ff3-8334-44ef-b1fa-8ccbe8701522.jpg",
  //         size: 51409,
  //         url:
  //           "http://vishal22.codzelocal.com/api/forms/files/293f3527-240e-42da-9ff1-666fbf5a4844"
  //       }
  //     ];
  //     submission["aadhaarfrontback"] = aadhaarfrontback;
  //     submission["aadhaarcardback"] = aadhaarfrontback;
  //     submission["aadhaarData"] = 0;
  //   }

  //   this.setState({
  //     submission: { data: submission }
  //   });
  // };

  render() {
    if (Object.keys(this.state.form).length === 0) {
      return (
        <div>
          <span>
            {" "}
            No forms or attachments are available to show at this moment.
{" "}
          </span>
        </div>
      );
    }

    return (
      <div className="form_viewer">
        <form className="form_up_box form_top_content">
          <h1 className="container text-center">ezeDox Form Designer</h1>
          <div className="row col-md-12 m-0 " style={{ zIndex: "9" }}>
            <div className="floating-label col-md-4">
              <input
                onChange={this.formName}
                readOnly
                value={this.state.name}
                className="floating-input"
                type="text"
              />
              <label>Name</label>
            </div>
            <div className="floating-label col-md-4">
              <input
                onChange={this.formDescription}
                readOnly
                value={this.state.description}
                className="floating-input"
                type="text"
              />
              <label>Description</label>
            </div>
            <div className="floating-label col-md-2">
              <input
                value={this.state.key}
                readOnly
                className="floating-input"
                type="text"
              />
              <label>Key</label>
            </div>
            <div className="floating-label col-md-2">
              <span className="form_version">Versions: </span>
              <select
                className="form-control"
                onChange={this.selectVersioning}
                value={this.state.version}
              >
                {this.state.versions.data.map(e => {
                  return (
                    <option key={e.key} value={e.version}>
                      {e.version}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </form>
        <div className="ezedox_form_io_preview form_middle_content">
          <Form
            options={{ readOnly: false }}
            onSubmit={this.handleSubmit}
            submission={this.state.submission}
            form={this.state.form}
            // onCustomEvent={this.callMe}
          />
        </div>
        <ImageCropper token={TOKEN} />
        <div className="text_editor_btn_cont ezedox_form_io_footer form_bottom_content">
          <button
            type="button"
            onClick={this.exit}
            className="fancy_btn active"
          >
            <span>Exit and goto Designer</span>
          </button>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
    return {
      loading: state.formData.loading,
      data: state.formData.data,
    }
  }

const mapDispatchToProps = dispatch => {
  return {
    formEdit: (orgId) => dispatch(actions.formIoEdit(orgId)),
    storeData: (orgId, schema, data) => dispatch(actions.formIoVersioning(orgId, schema, data)),
    storeUpdate: (orgId, schema, data) => dispatch(actions.formIoStoreVersion(orgId, schema,data))
  }

}
  
  export default withRouter(connect(mapStateToProps, mapDispatchToProps)(FormIoBuilderPreview));
