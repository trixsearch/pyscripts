import React, { Component } from "react";
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css';
import "./portal.css"

class Portals extends Component {


  modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
      ['link', 'image', 'video'],
      ['clean'],
      [{ 'header': 1 }, { 'header': 2 }], // custom button values
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'script': 'sub' }, { 'script': 'super' }], // superscript/subscript
      [{ 'indent': '-1' }, { 'indent': '+1' }], // outdent/indent
      [{ 'direction': 'rtl' }], // text direction

      [{ 'size': ['small', false, 'large', 'huge'] }], // custom dropdown
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

      [{ 'color': [] }, { 'background': [] }], // dropdown with defaults from theme
      [{ 'font': [] }],
      [{ 'align': [] }],
    ],
  }

  modules2 = {
    toolbar: null,
  }

  formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'video'
  ]

  render() {
    if (this.props.preview === false) {
      return (
        <ReactQuill
          value={this.props.text}
          theme="snow"
          modules={this.modules}
          formats={this.formats}
          onChange={this.props.handleChange}
        />
      );
    }
    return (
      <ReactQuill
        value={this.props.text}
        theme="snow"
        readOnly
        modules={this.modules2}
        onChange={this.props.handleChange} 
      />
    );
  }
}

export default Portals;
