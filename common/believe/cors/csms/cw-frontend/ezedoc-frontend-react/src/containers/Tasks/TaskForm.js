import React, { Component, useEffect, useState } from "react";
import { connect } from "react-redux";
import { Prompt, withRouter } from 'react-router-dom';
import axios from "axios";
import Split from 'react-split';
import {
  SeparateFiles,
  StorageFileRemover,
  FormCommonOnChange,
} from 'ezereactcomponents/utils/FormioFileDeletionUtils'

import Form from "../../components/Formio";
import SliderCheckbox from '../../components/UI/Checkbox/SliderCheckbox'

import "./task.css";
import { addToast, addRefreshToast } from '../../components/Toast/actions';
import TaskVerification from "./TaskVerification";
import Spinner from '../../components/UI/Spinner/Spinner';
import {
  isMobile,
  checkEtag,
  isNumber,
  clientLogger, 
  filterPayloadData,
} from '../utils';
import ErrorPage from '../ErrorPage';
import languageIcon from '../../assets/images/svg/language.svg';
import { toggleTaskHomeScreen } from "../../store/actions";

const APP_URL = process.env.REACT_APP_APP_URL;
const ADMIN_BASE_URL = process.env.REACT_APP_ADMIN_BASE_URL;
const TASK_FORM_RELOAD_MESSAGE = 'The current process has been updated by a separate user, please reload this task to continue'

class TaskForm extends Component {
  state = {
    form_data: "",
    message: "",
    formVerification: false,
    attachments: {},
    loader: true,
    formName: "",
    formDescription: "",
    submission_data: "",
    partial_data:"",
    draftDisabled:false,
    userChanged : false,
    saveDraftLoader:false,
    keyTypePair: [],
    taskOwnerCheck : false,
    fileComponentKeys: [],
    filesUploaded: new Set(),
    languageData: null,
    timerId: '',
    onChangeCalled: false
  };

  componentDidMount() {
    this.taskCall(this.props.formId, this.props.data.processInstanceId)
    const timerId = setInterval(() => {
      if (this.state.onChangeCalled) {
        // this.saveDraft(true)
      }
    }, 5000)
    this.setState({ timerId: timerId })
  }

  componentWillUnmount() {
    // cleanup camera 
    if(window?.videoStream){
      window?.videoStream?.getTracks()?.[0]?.stop();
    }
    // Async file deletion deletion will be performed only user confirm the prompt when navigating to other page without saving the changes
    if (this.state.userChanged) {
      const { fileSetToBeDeleted } = SeparateFiles(this.state.fileComponentKeys, this.state.filesUploaded, this.state.initialData)
      StorageFileRemover(fileSetToBeDeleted)
    }
    clearInterval(this.state.timerId)
  }

  taskCall = (formId,processInstanceId) => {
    const orgId = this.props.match?.params?.uuid;

    if (formId) {
      if(history?.state?.state?.isBulkAction){
        formId = formId?.split("::")[0] +'_bulk';
      }
      axios
        .get(`${APP_URL}/${orgId}/forms/formversionwrapper?form_key_version=${formId}&processInstanceId=${processInstanceId}&get_keytype=true`)
        .then(form_data => {
          let formFields = form_data.data.data.file_fields;
          let form = form_data.data.data.content;
          let formName = form_data.data.data.name;
          let client_info = {"client_info" : form_data.data.data.client_info}
          let formDescription = form_data.data.data.description;
          let keyTypePair = form_data.data.data.keytypepair;
          let langData = form_data.data.data.language_option
          if(typeof langData === "string"){
            try {
              langData = JSON.parse(langData);
            } catch {
              langData = {};
            }
          }
          
          axios
            .get(
              `${APP_URL}/${orgId}/proxy-bpm/process-instances/variables/${
             processInstanceId
              }?formKey=${formId}`
            )
            .then(res => {
              let data = [];

              let assignee = {"assignee" : this.props.data.assignee}
              let current_task_owner = {"current_task_owner":this.props.current_task_owner}

              /* TODO: this is the check to verify that only the task assignee can open the task url */

              let submission_data = {
                "data": 
                {
                  ...assignee,
                  ...current_task_owner,
                  ...client_info
                }
              }
              if (!this.props?.history?.state?.state?.isBulkAction) {
                submission_data = {
                  ...submission_data,
                  "data": {
                    ...submission_data?.data,
                    ...res.data.data,
                  }
                }
              }
              let submission = {}
              // Hack
               Object.keys(submission_data.data).map((e) => {
                 if(submission_data.data[e]) {
                  try {
                    submission[e] = isNumber(submission_data.data[e])
                      ? submission_data.data[e]
                      : JSON.parse(submission_data.data[e]);
                  } catch (err) {
                    submission[e] = submission_data.data[e];
                  }
                 } else {
                   // This block gets executed , when submission_data.data is falsy
                   submission[e] = submission_data.data[e]
                 }
                 return e;
               })

              let variables_data = res.data.data;

              formFields.map((e, index) => {
                let id = Object.keys(formFields[index]);
                if (variables_data && variables_data[id] && variables_data[id].length) {
                  // Parse if file_data is stringified else take it as it is.
                  let file_data = Array.isArray(variables_data[id]) ? variables_data[id] : JSON.parse(variables_data[id]) 
                  data[id] = [...file_data, Object.values(formFields[index])];
                }
                  return e
                })

              // Collect initial files which are all already uploaded & saved as draft
              let fileComponentKeys = []
              let currentFilesUploaded = new Set()
              if (Object.keys(data).length > 0) {
                Object.keys(data).map(item => {
                  fileComponentKeys.push(item)
                  data[item].map((file, index) => {
                    if (data[item].length - 1 !== index) currentFilesUploaded.add(file.url)
                    return null
                  })
                  return null
                })
              }
              
              this.setState(
                !form ? {
                  message: "No forms or attachments are available to show at this moment.",
                  loader: false
                } : {
                    form_data: form,
                    formName: formName,
                    formDescription: formDescription,
                    submission_data: {"data" :submission},
                    attachments: data,
                    keyTypePair,
                    loader: false,
                    fileComponentKeys,
                    filesUploaded: currentFilesUploaded,
                    initialData: JSON.parse(JSON.stringify(submission)),
                    languageData: langData ? langData : null
                  }
              );
            });
        })
        .catch(() => {
          this.setState({
            message: "No forms or attachments are available to show at this moment.",
            loader: false
          });
        });
    } else {
      this.setState({
        message: "No forms or attachments are available to show at this moment.",
        loader: false
      });
    }

  }

  onChecked = (e) => {
    this.setState({
      formVerification: e.target.checked
    }, () => this.props.handleSidebarOpenClose(false))
  }

  onChange = (e) =>{
    const isChanged = e.changed
    if(isChanged) {
      const isAutoModified = e.changed.flags.autoModified
      if (!isAutoModified) {
        this.setState({
          partial_data:e.data,
          userChanged: true,
          onChangeCalled: true
        })
      }
      this.setState({
        partial_data: e.data,
        onChangeCalled: true
      })
    }

    FormCommonOnChange(e, this, null, null, null, null)
  }

  saveDraft = (autoSave = false) => {
    const orgId = this.props.match?.params?.uuid;

    this.setState({
      draftDisabled:true,
    })
    !autoSave && this.setState({
      saveDraftLoader:true
    })
    let task_id = this.props.data.id
    let form = {
      data: filterPayloadData(this.state.partial_data, this.state.keyTypePair),
      task_id: task_id
    }
    let last_tag_value = this.state.partial_data.e_tag
    axios
    .get(
      `${APP_URL}/${orgId}/proxy-bpm/process-instances/variables/${
      this.props.data.processInstanceId
      }?formKey=${this.props.formId}`
    )
    .then(res => {
      let new_variables = res.data.data;
      if(new_variables.e_tag === last_tag_value) {
        axios
        .put(
          `${APP_URL}/${orgId}/proxy-bpm/task/variables/${
            this.props.data.processInstanceId
          }?formKey=${this.props.formId}`, form
        )
        .then((form_data) => {         
          let tag_value = checkEtag(last_tag_value,form_data.data.data)
          let {submission_data} = this.state
          submission_data.data.e_tag = tag_value
          !autoSave && this.props.addToast('success', 'Success', 'Form saved successfully')
          const { fileSetToBeRetained, fileSetToBeDeleted } = SeparateFiles(this.state.fileComponentKeys, this.state.filesUploaded, this.state.partial_data)
          this.setState({
            submission_data: submission_data,
            draftDisabled: false,
            userChanged: false,
            filesUploaded: fileSetToBeRetained
          }, () => {
            StorageFileRemover(fileSetToBeDeleted) // File Deletion after 'Save Draft' action
          });
          !autoSave && this.setState({
            saveDraftLoader: false,
          })
        })
        .catch((error) => {
          !autoSave && this.props.addToast('error', 'Error', error.response.data.message)
          this.setState({
            form_data:"",
            draftDisabled:false,
            saveDraftLoader:false,
            message: error.response.data.message
          })
        });
      }else{
        !autoSave && this.props.addRefreshToast('error', 'Error', TASK_FORM_RELOAD_MESSAGE, this.refresh)
        this.setState({
          draftDisabled:false,
          saveDraftLoader:false
        })
      }
      }).catch(()=>{
        this.setState({
          draftDisabled:false,
          saveDraftLoader:false
        })
    });
    this.setState({ onChangeCalled: false })
  }
  
  handleSubmit = (data) => {
    const orgId = this.props.match?.params?.uuid;

    this.setState({
      loader: true
    })
    
    let history = this.props.history
    let form = {
      action: "complete",
      data: filterPayloadData(data.data, this.state.keyTypePair)
    }
    if (history?.location?.state?.isBulkAction && history?.location?.state?.taskIds?.length) {
      form = {
        ...form,
        formKey: this.props.formId,
        task_ids: history?.location?.state?.taskIds
      }
    }
    axios
    .get(
      `${APP_URL}/${orgId}/proxy-bpm/process-instances/variables/${
      this.props.data.processInstanceId
      }?formKey=${this.props.formId}`
    )
    .then(res => {
      let new_variables = res.data.data;
      let old_variables= data.data
      // Todo We should only get the e_tags not all the process variables
      if (new_variables.e_tag === old_variables.e_tag || history?.location?.state?.isBulkAction) {
        let URL = history?.location?.state?.isBulkAction ? `${APP_URL}/${orgId}/apps/bulk_task_complete` : `${APP_URL}/${orgId}/proxy-bpm/tasks/${this.props.data.id}?formKey=${this.props.formId}`
        axios
          .post(URL, form)
        .then(() => {
          this.setState({
            userChanged: false
          }, () => {
            const { fileSetToBeDeleted } = SeparateFiles(this.state.fileComponentKeys, this.state.filesUploaded, form.data)
            StorageFileRemover(fileSetToBeDeleted) // File Deletion after 'Submit' action
            this.props.toggleTaskHomeScreen(false);

            // This below timeout is there just to delay the redirection again to tasks page such that
            // UX will be apt and users won't be seeing the already completed tasks.
            setTimeout(() => {
              this.props.addToast('success', 'Success', 'Form submitted successfully')
              history.push(`/custom-workflow/org/${orgId}/tasks`);
            }, 5000);
          })
        })
        .catch((err) => {
          this.taskCall(this.props.formId, this.props.data.processInstanceId)
          this.props.addToast('error', 'Error', err.response.data.message)
        });
      }else{
        this.props.addRefreshToast('error', 'Error', TASK_FORM_RELOAD_MESSAGE, this.refresh)
        this.setState({
          loader: false
        });
      }
      
    }).catch((err)=>{
      // console.log(e)
      this.props.addToast('error', 'Error', err?.response?.data?.message)
      this.setState({
        loader: false
      })
    });
   
  }

  refresh =() => {
    this.taskCall(this.props.formId, this.props.data.processInstanceId)
  }

  render() {
    if(this.state.taskOwnerCheck) {
      return (<ErrorPage />)
    }
    if (this.state.message !== "") {
      return <div className="task_form_loading_text">{this.state.message}</div>;
    }
    if (this.state.loader) {
      return (<Spinner />)
    }
    return (    
      <>
      {this.state.saveDraftLoader && <Spinner />}
        <Prompt
          when={this.state.userChanged}
          message="Unsaved work will be lost"
        />
        <TaskPreviewer
          saveDraft={this.saveDraft}
          onChange={this.onChange}
          formName={this.state.formName}
          handleSubmit={this.handleSubmit}
          form_data={this.state.form_data}
          submission_data={this.state.submission_data}
          formVerification={this.state.formVerification}
          formDescription={this.state.formDescription}
          attachments={this.state.attachments}
          previewModeClickHandler={this.onChecked}
          draftDisabled={this.state.draftDisabled}
          languageData={this.state.languageData}
        />
      </>
    );
  }
}

const TaskPreviewer = (props) => {
  if (props.formVerification === false) {
    return (
      <TaskFormContent
        saveDraft={props.saveDraft}
        onChange={props.onChange}
        formName={props.formName}
        form_data={props.form_data}
        attachments={props.attachments}
        handleSubmit={props.handleSubmit}
        submission_data={props.submission_data}
        formDescription={props.formDescription}
        formVerification={props.formVerification}
        previewModeClickHandler={props.previewModeClickHandler}
        draftDisabled={props.draftDisabled}
        languageData={props.languageData}
      />
    )
  }

  return (
    <div className="task_verification_page task_split_section">
      <Split
        gutterSize={6}
        snapOffset={30}
        dragInterval={1}
        expandToMin={false}
        gutterAlign="center"
        minSize={[400, 500]}
        sizes={isMobile() ? [50, 50] : [40, 60]}
        cursor={isMobile() ? "row-resize" : "col-resize"}
        direction={isMobile() ? "vertical" : "horizontal"}
      >
        <TaskFormContent
          saveDraft={props.saveDraft}
          onChange={props.onChange}
          formName={props.formName}
          form_data={props.form_data}
          attachments={props.attachments}
          handleSubmit={props.handleSubmit}
          submission_data={props.submission_data}
          formDescription={props.formDescription}
          formVerification={props.formVerification}
          previewModeClickHandler={props.previewModeClickHandler}
          draftDisabled={props.draftDisabled}
          languageData={props.languageData}
        />
        <TaskVerification
          form_data={props.form_data}
          submission={props.submission_data}
          attachments={props.attachments}
        />
      </Split>
    </div>
  )
}

const TaskFormContent = (props) => {
  const [language, setLanguage] = useState('en');
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
      if(props.languageData) {
          setLanguage(props.languageData.language ?? 'en');
      }
  }, [props.languageData])

  const langugeOptions = Object.keys(props.languageData?.i18n ?? {})
  const langugeData = props.languageData?.i18n

  return (
  <div className="task_verification_page_form_section">
    <div className={(Object.values(props.attachments).length !== 0) && (props.formVerification || isMobile()) ? 'task_form_top_bar_split_view' : 'task_form_top_bar'}>
      <div className="form-detail">
        <p className="form-name">{props.formName}</p>
        <p className="form-description">
          {props.formDescription}
        </p>
      </div>
      <div className="attachment-previewer">
      {langugeOptions.length ? (
          <button className='lang_btn dropdown-toggle' data-toggle='dropdown' type='button'>
              <img src={languageIcon} alt="language"/>
          </button>
      ) : null}
      <div className='dropdown-menu'>
          {langugeOptions.map((item) => <button className='dropdown-item' type='button' onClick={()=>setLanguage(item)}>{item}</button>)}
      </div>
      {/* <button 
      type='button' 
      onClick={() => {
        setIsPreview((current) => !current)
      //  if (isPreview===true) window.location.reload()
      }} 
      className='fancy_btn'
      >
          {isPreview ? 'Edit' : 'Preview'}
      </button> */}
      {Object.values(props.attachments).length
        && (
          // <>
          //   <SaveTaskDraftUI
          //     saveDraft={props.saveDraft}
          //     draftDisabled={props.draftDisabled}
          //     condition={props.formVerification || isMobile()}
          //   />
          <>
            <p className="attachment-previewer-text">Review Mode</p>
            <SliderCheckbox 
                checked={props.formVerification} 
                onChange={props.previewModeClickHandler}
                name="review"
            />
          </>
        // ) : (
        //     <SaveTaskDraftUI
        //       condition={isMobile()}
        //       saveDraft={props.saveDraft}
        //       draftDisabled={props.draftDisabled}
        //     />
        )
        }
      </div>
    </div>
    <div>
      <div className={`ezedox_form_io attch_io_form ${isMobile() ? 'form_mobile' : 'form_desktop'} ${props.formVerification ? 'formio_split_view' : 'formio_normal_view'}`}>
        <Form
          options={{
            readOnly: isPreview,
            viewAsHtml: true,
            language,
            i18n: langugeData,
          }}
          onSubmit={props.handleSubmit}
          form={props.form_data}
          submission={props.submission_data}
          onChange={props.onChange}     
        />
      </div>
    </div>
  </div>
)
}

const SaveTaskDraftUI = ({condition, saveDraft, draftDisabled}) => {
  return condition
  ? (
    <button 
      type="button" 
      title="Save Draft" 
      onClick={() => saveDraft()}
      disabled={draftDisabled}
      className="btn glyphicon glyphicon-floppy-disk task_save_draft_review"
    />
  ) 
  : (
      <button 
        type='button' 
        onClick={() => saveDraft()}
        disabled={draftDisabled}
        className="task_save_draft app_btn fancy_btn" 
      >
        Save Draft
      </button>
    )
}

const mapDispatchToProps = dispatch => ({
  addToast: (type, title, message, duration) => dispatch(addToast(type, title, message, duration)),
  addRefreshToast: (type, title, message, refreshFunc) => dispatch(addRefreshToast(type, title, message, refreshFunc)),
  toggleTaskHomeScreen: (val) => dispatch(toggleTaskHomeScreen(val)),
})

export default withRouter(connect(null, mapDispatchToProps)(TaskForm));
