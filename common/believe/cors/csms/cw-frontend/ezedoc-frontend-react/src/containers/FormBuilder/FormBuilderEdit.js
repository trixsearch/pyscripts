import React, { Component } from "react";
import { connect } from "react-redux";
import axios from "axios";
import { handleRedirect } from "containers/utils";
import EzedoxFormBuilder from "./FormBuilder"
import * as actions from '../../store/actions/index';
import '@ezedoxbp/formiojs/dist/formio.full.min.css';
import "./form.css";


class FormIoBuilderEdit extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: "",
      description: "",
      key: "",
      form:[],
      versions:[],
      id:0,
      version:0
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
    this.formStructure()
  }

  formStructure = () => {
    const orgId = this.props.match?.params?.uuid;

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
    }).catch((e) => { console.log(e) })
  }

  

  componentWillUnmount(){
    let [Header] = document.getElementsByClassName('Header_container');
    let [NavContainer] = document.getElementsByClassName('body_container');
    // let LeftSide = document.getElementById('lef_side');
    
    Header.style.display = 'block';
    NavContainer.style.paddingTop = "58px";
    NavContainer.style.paddingLeft = "100px";
    // LeftSide.style.display = "block";
  }



  displayType = (e) => {
    this.setState({ display: e.target.value });
  }

  formName = (event) => {
    this.setState({
      name: event.target.value
    })
  }

  selectVersioning = (event) =>{
    const orgId = this.props.match?.params?.uuid;
    let version_temp = parseInt(event.target.value);
    let versions = this.state.versions.data.find((k) => k.version === version_temp) 

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

  formDescription = (event) =>{
    this.setState({
      description: event.target.value
    })
  }

  render() {
    if (Object.keys(this.state.form).length === 0) {
      return (
        <div>
          <span> No forms or attachments are available to show at this moment. </span>
        </div>
      );
    }
    else {
      return (
        <div>
          <form className="form_up_box">
            <h1 className="container text-center">ezeDox Form Designer</h1>
            <div className="row col-md-12 m-0 " style={{zIndex: '9'}}>
              <div className="floating-label col-md-4">
                <input onChange={this.formName} value={this.state.name} className="floating-input" type="text" />
                <label>Name</label>
              </div>
              <div className="floating-label col-md-4">
                <input onChange={this.formDescription} value={this.state.description} className="floating-input" type="text" />
                <label>Description</label>
              </div>
              <div className="floating-label col-md-2">
                <input value={this.state.key}  readOnly className="floating-input" type="text" />
                <label>Key</label>
              </div>
              <div className="floating-label col-md-2">
                  <span className="form_version">Versions: </span>
                  <select className="form-control" onChange={this.selectVersioning} value={this.state.version}>
                  {this.state.versions.data.map((e)=>{
                    return(
                      <option key={e.key} value={e.version}>{e.version}</option>
                    )
                  })}                                 
                  </select>
              </div>
            </div>
          </form>
          <FormIoDefinitionBuilder
            form={this.state.form}
            id={this.state.id}
            storeData={this.props.storeData}
            storeUpdate={this.props.storeUpdate}
            pid={this.props.match.params.pid}
            name={this.state.name}
            description={this.state.description}
            key_value={this.state.key}
            fixId={this.state.fixId}
            formformStructure = {this.formStructure}
            orgId={this.props.match?.params?.uuid}
          />
        </div>
      );
    }
  }
}

class FormIoDefinitionBuilder extends Component {
  constructor(props) {
    super(props);
    this.state = {
      schema: this.props.form
    };
  }

  handleSchemaChange = (e) => {
    this.setState({ schema: e });
  }

  updateNewVersion = (schema) => {
    if (schema !== "") {
      this.props.storeData(this.props.orgId, schema, this.props, this.props.formformStructure)
    } else {
      this.setState({ error: "something went wrong" })
    }
  }
  updateVersion = (schema) => {
    if (schema !== "") {
      this.props.storeUpdate(this.props.orgId, schema, this.props)
    } else {
      this.setState({ error: "something went wrong" })
    }
  }
  saveAndExit = () => {
    let redirect_url = handleRedirect(window.location.href,window.location.hash)
    window.location.href = redirect_url
  }

  render() {
    return (
      <div>
          <div className="container-fluid py-4 ezedox_form_io">
            <div>{this.state.error}</div>
            {/* <div>If you change this form ..It will effected to old Process </div> */}
            <EzedoxFormBuilder
                form={this.props.form}
                saveAndExit={this.saveAndExit}
                fixId={this.props.fixId}
                id={this.props.id}
                updateVersion={this.updateVersion}
                updateNewVersion={this.updateNewVersion}
            />
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
    formEdit: (orgId, id) => dispatch(actions.formIoEdit(orgId, id)),
    storeData: (orgId, schema, data,formStructure) => dispatch(actions.formIoVersioning(orgId, schema, data,formStructure)),
    storeUpdate: (orgId, schema, data) => dispatch(actions.formIoStoreVersion(orgId, schema, data))
  }

}

export default connect(mapStateToProps, mapDispatchToProps)(FormIoBuilderEdit);
