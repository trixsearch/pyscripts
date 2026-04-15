import React, { Component } from "react";
import { FormBuilder ,Formio } from "@ezedoxbp/react-formio";
import { connect } from "react-redux";
import { handleRedirect } from "containers/utils";
import * as actions from '../../store/actions/index';

// eslint-disable-next-line import/no-extraneous-dependencies
import '@ezedoxbp/formiojs/dist/formio.full.min.css';
import FileComponent from './Components/File/file'
import TaskOwnerComponent from './Components/TaskOwner/taskOwner'
import AadhaarComponent from './Components/Ocr/Aadhaar'
import PanComponent from './Components/Ocr/Pan'
import ClientInfoComponent from './Components/ClientInfo/clientInfo'
import VideoComponent from './Components/Video/video'
import AadhaarMask from './Components/AadhaarMask/aadhaarMask'
import RazorpayPaymentComponent from './Components/RazorpayPayment/razorpayPayment'
import RAGAnalysis from "./Components/RAGAnalysis/RAGAnalysis";
import EducationRecords from './Components/EducationRecords/EducationRecords'
import EmploymentRecords from './Components/EmploymentRecords/EmploymentRecords'
import ProfessionalReferences from './Components/ProfessionalReferences/ProfessionalReferences'

Formio.Components.addComponent('fileComponent',FileComponent)
Formio.Components.addComponent('taskOwnerComponent',TaskOwnerComponent)
Formio.Components.addComponent('clientInfoComponent',ClientInfoComponent)
Formio.Components.addComponent('aadhaarComponent', AadhaarComponent)
Formio.Components.addComponent('panComponent', PanComponent)
Formio.Components.addComponent('videoComponent',VideoComponent)
Formio.Components.addComponent('aadhaarMask',AadhaarMask)
Formio.Components.addComponent('razorpayPaymentComponent', RazorpayPaymentComponent)
Formio.Components.addComponent('ragAnalysis', RAGAnalysis)
Formio.Components.addComponent('educationRecords', EducationRecords)
Formio.Components.addComponent('employmentRecords', EmploymentRecords)
Formio.Components.addComponent('professionalReferences', ProfessionalReferences)


class FormIoBuilder extends Component {
  constructor(props) {
    super(props);
    this.state = {
      display: "form",
    };
  }

  componentDidMount() {
    let [Header] = document.getElementsByClassName('Header_container');
    let [NavContainer] = document.getElementsByClassName('body_container');
    // let LeftSide = document.getElementById('lef_side');

    Header.style.display = 'none';
    NavContainer.style.paddingTop = 0;
    NavContainer.style.paddingLeft = 0;
    // LeftSide.style.display = "none";
    
    let history = window.history
    let location = window.location
    history.pushState(null, null,location.href);
    window.onpopstate = function () {
      history.go(1);
    };
    
  }

  componentWillUnmount() {
    let [Header] = document.getElementsByClassName('Header_container');
    let [NavContainer] = document.getElementsByClassName('body_container');
    // let LeftSide = document.getElementById('lef_side');
    
    Header.style.display = 'block';
    NavContainer.style.paddingTop = "58px";
    NavContainer.style.paddingLeft = "100px";
    // LeftSide.style.display = "block";
  }

  displayType =(e) => {
    this.setState({ display: e.target.value });
  }


  render() {
    let display = this.state.display === "form"
    return (
      <div>
        <div className="form-group">
          <label htmlFor="sel1">Select type:</label>
          <div>
            <select onChange={this.displayType} className={{ width: 50 }}>
              <option value="form">form</option>
              <option value="wizard">wizard</option>
            </select>
          </div>
        </div>
        {display
          ? (
            <FormIoDefinitionBuilder
              display={this.state.display}
              storeData={this.props.storeData}
              id={this.props.match.params.id}
              pid={this.props.match.params.pid}
              orgId={this.props.match?.params?.uuid}
            />
          ) : (" ")}

        {display
          ? (" ") : (
            <FormIoDefinitionBuilder
              display={this.state.display}
              storeData={this.props.storeData}
              id={this.props.match.params.id}
              pid={this.props.match.params.pid}
              orgId={this.props.match?.params?.uuid}
            />
          )}
      </div>
    );
  }
}

class FormIoDefinitionBuilder extends Component {
  constructor(props) {
    super(props);
    this.state = {
      schema: ""
    };
  
  }

  // eslint-disable-next-line no-unused-vars
  shouldComponentUpdate(nextProps, nextState) {
    return false;
  }
  
  componentWillUnmount() {
    if(window?.videoStream){
        window?.videoStream?.getTracks()?.[0]?.stop();
    }
  }

  componentWillUnmount() {
    if(window?.videoStream){
        window?.videoStream?.getTracks()?.[0]?.stop();
    }
  }

  handleSchemaChange = (e) => {
    this.setState({ schema: e });
  }

  saveAndPreview = (e) => {
    e.preventDefault();
    this.props.storeData(this.props.orgId, this.state.schema, this.props.id)
  }

  saveAndExit = () => {
    let redirect_url = handleRedirect(window.location.href,window.location.hash)
    window.location.href = redirect_url
  }

  render() {
    return (
      <div>
        <h1 className="container text-center">ezeDox Form Designer</h1>
        <div className="container-fluid py-4">
          {this.props.display === "form" ? (
            <FormBuilder
              form={{
                display: "form"
              }}
              onChange={this.handleSchemaChange}
            />
          ) : (
              <FormBuilder
                form={{
                  display: "wizard"
                }}
                onChange={this.handleSchemaChange}
              />
            )}
          <div className="text_editor_btn_cont">
            <button type="button" onClick={this.saveAndPreview} className="fancy_btn">
              <span>Save and goto Designer</span>
            </button>
            <button type="button" onClick={this.saveAndExit} className="fancy_btn">
              <span>Exit and goto Designer</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
}

const mapDispatchToProps = dispatch => {
  return {
    storeData: (orgId, schema, id) => dispatch(actions.formIoStore(orgId, schema, id))
  }
}

export default connect(null, mapDispatchToProps)(FormIoBuilder);
