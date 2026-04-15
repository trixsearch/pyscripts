/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable consistent-return */
/* eslint-disable no-console */
import React, { Component } from "react";
import { Form } from "@ezedoxbp/react-formio";
import ImageCropper from "ezereactcomponents/ImageCropper";
import ImageCaptureOCR from 'ezereactcomponents/ImageCaptureOCR';
import EzeReactMediarecorder from "ezereactcomponents/EzeReactMediaRecorder";
import Axios from "axios";
import debounce from "lodash/debounce";
import {
  ENTITY_EMAIL, TOKEN , ENTITY_AADHAAR , ENTITY_AADHAAR_HASHED , ENTITY_AADHAAR_MASKED
} from "../../Data/constants"
// eslint-disable-next-line import/no-extraneous-dependencies
import "@ezedoxbp/formiojs/dist/formio.full.min.css";
import "./index.css";

const APP_URL = process.env.REACT_APP_APP_URL;

const submissionTransformer = data => {
  let submission = data
  if (submission.data[ENTITY_EMAIL]) {
    submission.data[ENTITY_EMAIL] = submission.data[ENTITY_EMAIL].toLowerCase();
  }
  return submission;
};

const fileToFormData = (file) => {
  return [
    {
      storage: "url",
      originalName: file.label || file.name,
      data: {
        form: "",
        name: file.label || file.name,
        project: "",
        baseUrl: "https://api.form.io",
        size: file.size,
        url:  file.url      
      },
      type: file.type || "image/jpeg",
      name: file.label || file.name,
      size: file.size,
      url: file.url
    }
  ];
} 

export default class FormEzedox extends Component {
  state = {
    submission: this.props.submission,
    show: false,
    openform: false,
    video: false
  };

  componentWillUnmount() {
    Array.from(document.getElementsByClassName("formio-component-currency")).forEach(e => {
      e.childNodes[1].removeEventListener("focus", this.currnecy_comp_select);
    });
  }

  onRender = () => {
    Array.from(document.getElementsByClassName("formio-component-currency")).forEach(e => {
      e.childNodes[1].addEventListener("focus",this.currnecy_comp_select)
    });
  };

  onSubmit = debounce(data => {
    const orgId = this.props.match?.params?.uuid;

    if (typeof this.props.onSubmit === "function" ) {
      let submission = submissionTransformer(data);
      if (submission.data[ENTITY_AADHAAR]) {
        let body = {
          aadhaar_number :submission.data[ENTITY_AADHAAR]
        }
        Axios.post(`${APP_URL}/${orgId}/forms/aadhaar_hash/`, body)
        .then((res)=>{
           let aadhaar_data = res.data.data
           submission.data[ENTITY_AADHAAR_MASKED] = aadhaar_data.aadhaar_masked
           submission.data[ENTITY_AADHAAR_HASHED] = aadhaar_data.aadhaar_hash
           delete submission.data[ENTITY_AADHAAR] 
           this.props.onSubmit(submission);
        })
        .catch((err)=>{
          console.error(err);
          this.props.onSubmit(submission);
        })   
      }else {
        this.props.onSubmit(submission);
      }   
    } else {
      return null;
    }
  }, 300);

  onChange = data => {
    if (typeof this.props.onChange === "function" ) {
      this.props.onChange(data);
    } else {
      return null;
    }
  };

  aadharSubmit = (data, photo_type) => {
    // eslint-disable-next-line react/no-access-state-in-setstate
    let submission = this.state.submission.data
    this.setState({
      show: false
    });

    if (photo_type === 'aadhaar') {
      if(data) {
        
        const [file1, file2] = data.file;
        
        if(file1 && file2) {
          submission.aadhaarfrontside = fileToFormData(file1);
          submission.aadhaarcardback = fileToFormData(file2);
          submission.aadhaar_button = 0;
          submission.aadhaarOcrData =JSON.stringify(data.ocrData);
        }
      }
  }
  
  if(photo_type === "pan") {
    if(data) {
      submission.pan_button = 0;
      submission.panOCRData =JSON.stringify(data.ocrData);
      submission.panCard = fileToFormData(data.file)
    }
  }

    
    this.setState({
      submission: { data: submission}
    });
  }

  interalUploadFileForOCR = data => {

    console.log(data.component.tags)

    let submission = data.data;
    let tags = data.component.tags || [];
    if (tags.indexOf("aadhaarClear") >= 0) {
      submission.aadhaarfrontside = [];
      submission.aadhaarcardback = [];
      submission.aadhaar_button = 1;
      submission.aadhaarOcrData={}
    }

    if (tags.indexOf("panClear") >= 0) {
      submission.pan_button = 1;
      submission.panOCRData ={};
      submission.panCard = []
    }

    if (tags.indexOf("videoClear") >= 0) {
      submission.video_button = 0;
     
    }
    let show = false;
    let photo_type = "";
    let openform = false;
    if (tags.indexOf("aadhaar") >= 0) {   
        show = true
        photo_type = "aadhaar"
    }

    if (tags.indexOf("pan") >= 0) {   
        show = true
        photo_type = "pan"
    }

    if(tags.includes('openform')) {
      openform = true;
    }

    let video = false
    let videoDuration = 15;
    if(tags.includes('video')) {
       video = true;
       // submission.video_button = 1
       let duration_string = tags.filter((dur)=> dur.substring(0,8) === 'duration')
       videoDuration = duration_string[0] ? duration_string[0].split(':')[1] : 15
       
    }
    
    this.setState({
      submission: { data: submission},
      transactionId : submission.transaction_id,
      show,
      video,
      videoDuration,
      photo_type,
      openform
    }); 
  };

  videoCaptureSubmit = (data) => {
    // data : {url: "htpps://local.codzelocal.com.....", size: 123412, }
    if(!data) {
      this.setState({
        video: false
      });
      return
    }
    // eslint-disable-next-line react/no-access-state-in-setstate
    let submission = this.state.submission.data;
    submission.videoFile = fileToFormData({...data});
    submission.video_button = 1 
    this.setState({
      submission: {data: submission},
      video: false
    })

  }

  currnecy_comp_select() {
    this.select();
  }

  render() {
    return (
      <div className="formio_form_wrapper">
        {this.state.video && (
          <EzeReactMediarecorder
            transactionId={this.state.transactionId}
            onSubmit={this.videoCaptureSubmit}
            durationInSec={this.state.videoDuration}
            onClose={() => {
              this.setState({video: false})
            }} 
            token="token"
            orgId={this.props.submission.data.tenantId}
          />
        )}
        {this.state.show && (
          <ImageCaptureOCR
            openform={this.state.openform}
            transactionId={this.state.transactionId} 
            show={this.state.show} 
            onSubmit={this.aadharSubmit}
            photo_type={this.state.photo_type}
            orgId={this.props.submission.data.tenantId}
          />
        )}
        <ImageCropper token={TOKEN} orgId={this.props.submission.data.tenantId}/> 
        <Form
          options={this.props.options}
          onSubmit={this.onSubmit}
          form={this.props.form}
          submission={this.state.submission}
          onRender={this.onRender}
          onChange={this.onChange}
          onCustomEvent={this.interalUploadFileForOCR}
        />
      </div>
    );
  }
}
