import Base from "@ezedoxbp/formiojs/components/base/Base";

export default class VideoFile extends Base {
  static schema() {
    return Base.schema({
        "collapsed": false,
        "type": "panel",
        "attributes": {},
        "components": [
            {
                "dir": "",
                "tableView": true,
                "key": "videoFile",
                "defaultValue": [],
                "disabled": true,
                "label": "video",
                "mask": false,
                "validate": {
                    "required": true,
                    "json": "",
                    "customMessage": ""
                },
                "reorder": false,
                "fileNameTemplate": "",
                "conditional": {
                    "show": "",
                    "json": "",
                    "when": ""
                },
                "encrypted": false,
                "attributes": {},
                "storage": "url",
                "alwaysEnabled": false,
                "type": "file",
                "options": "",
                "input": true,
                "url": "/api/forms/files?token=",
                "logic": [],
                "customConditional": "",
                "webcam": false,
                "properties": {},
                "webcamSize": "",
                "fileTypes": [
                    {
                        "value": "",
                        "label": ""
                    }
                ]
            },
            {
                "showCharCount": false,
                "tableView": true,
                "attributes": {},
                "label": "Video tag ",
                "validate": {
                    "json": "",
                    "customMessage": ""
                },
                "reorder": false,
                "allowMultipleMasks": false,
                "conditional": {
                    "show": "",
                    "json": "",
                    "when": ""
                },
                "encrypted": false,
                "clearOnHide": false,
                "inputFormat": "plain",
                "type": "textfield",
                "widget": {
                    "type": ""
                },
                "tags": [],
                "logic": [],
                "hidden": true,
                "customConditional": "show = data && data.videoTag !== \"0\"",
                "alwaysEnabled": false,
                "properties": {},
                "key": "video_button",
                "defaultValue": "0",
                "showWordCount": false,
                "input": true
            },
            {
                "showValidations": false,
                "key": "startTheVideoCall",
                "tableView": true,
                "attributes": {},
                "label": "Start the video call",
                "mask": false,
                "event": "interalUploadFileForOCR",
                "state": "",
                "validate": {
                    "json": "",
                    "customMessage": ""
                },
                "reorder": false,
                "conditional": {
                    "show": "",
                    "json": "",
                    "when": ""
                },
                "encrypted": false,
                "theme": "primary",
                "type": "button",
                "tags": [
                    "video"
                ],
                "url": "",
                "logic": [],
                "customConditional": "show = data && data.video_button === \"0\";",
                "alwaysEnabled": false,
                "properties": {},
                "shortcut": "",
                "defaultValue": false,
                "custom": "",
                "input": true,
                "action": "event"
            },
            {
                "showValidations": false,
                "key": "uploadAgain2",
                "tableView": true,
                "attributes": {},
                "label": "Upload again",
                "mask": false,
                "event": "interalUploadFileForOCR",
                "state": "",
                "validate": {
                    "json": "",
                    "customMessage": ""
                },
                "reorder": false,
                "conditional": {
                    "show": "",
                    "json": "",
                    "when": ""
                },
                "encrypted": false,
                "theme": "primary",
                "type": "button",
                "tags": [
                    "videoClear"
                ],
                "url": "",
                "logic": [],
                "customConditional": "show = data && data.video_button !== \"0\";",
                "alwaysEnabled": false,
                "properties": {},
                "shortcut": "",
                "defaultValue": false,
                "custom": "",
                "input": true,
                "action": "event"
            }
        ],
        "mask": false,
        "input": false,
        "title": "Video call??",
        "reorder": false,
        "customConditional": "",
        "logic": [],
        "tableView": false,
        "conditional": {
            "show": "",
            "json": "",
            "when": ""
        },
        "properties": {},
        "key": "panel2",
        "label": "Panel",
        "collapsible": false,
        "alwaysEnabled": false
    });
  }

  static builderInfo = {
    title: "Video File",
    group: "basic",
    icon: "fa fa-file",
    weight: 70,
    documentation:
      "https://formio.github.io/formio.js/app/examples/customcomponent.html",
    schema: VideoFile.schema()
  };
}
