import Base from "@ezedoxbp/formiojs/components/base/Base";

export default class PanFile extends Base {
  static schema() {
    return Base.schema({
        "type": "panel",
        "label": "Panel",
        "clearOnHide": true,
        "input": false,
        "collapsible": false,
        "logic": [],
        "mask": false,
        "key": "panel3",
        "reorder": false,
        "persistent": true,
        "tableView": false,
        "components": [
            {
                "type": "columns",
                "label": "Columns",
                "input": false,
                "logic": [],
                "mask": false,
                "key": "columns4",
                "reorder": false,
                "columns": [
                    {
                        "push": 0,
                        "components": [
                            {
                                "url": "/api/forms/files?token=",
                                "key": "panCard",
                                "logic": [],
                                "mask": false,
                                "storage": "url",
                                "validate": {
                                    "json": "",
                                    "customMessage": "",
                                    "required": true
                                },
                                "tableView": true,
                                "attributes": {},
                                "dir": "",
                                "defaultValue": [],
                                "disabled": true,
                                "properties": {},
                                "type": "file",
                                "options": "",
                                "label": "Pan Card",
                                "fileNameTemplate": "",
                                "input": true,
                                "reorder": false,
                                "webcamSize": "",
                                "alwaysEnabled": false,
                                "webcam": false,
                                "customConditional": "",
                                "encrypted": false,
                                "tags": [],
                                "fileTypes": [
                                    {
                                        "value": "",
                                        "label": ""
                                    }
                                ],
                                "conditional": {
                                    "show": "",
                                    "json": "",
                                    "when": ""
                                }
                            },
                            {
                                "url": "",
                                "action": "event",
                                "input": true,
                                "logic": [],
                                "mask": false,
                                "defaultValue": false,
                                "validate": {
                                    "json": "",
                                    "customMessage": ""
                                },
                                "tableView": true,
                                "attributes": {},
                                "shortcut": "",
                                "showValidations": false,
                                "properties": {},
                                "type": "button",
                                "label": "Upload Again",
                                "key": "uploadAgain2",
                                "reorder": false,
                                "state": "interalUploadFileForOCR",
                                "alwaysEnabled": false,
                                "event": "",
                                "customConditional": "show = data && data.pan_button === \"0\"",
                                "encrypted": false,
                                "tags": [
                                    "panClear"
                                ],
                                "custom": "",
                                "conditional": {
                                    "show": "",
                                    "json": "",
                                    "when": ""
                                }
                            },
                            {
                                "url": "",
                                "action": "event",
                                "input": true,
                                "logic": [],
                                "mask": false,
                                "defaultValue": false,
                                "validate": {
                                    "json": "",
                                    "customMessage": ""
                                },
                                "tableView": true,
                                "attributes": {},
                                "shortcut": "",
                                "showValidations": false,
                                "properties": {},
                                "type": "button",
                                "label": "Upload Pan",
                                "key": "submit3",
                                "reorder": false,
                                "state": "",
                                "alwaysEnabled": false,
                                "event": "interalUploadFileForOCR",
                                "customConditional": "show = data && data.pan_button !== \"0\"",
                                "encrypted": false,
                                "tags": [
                                    "pan"
                                ],
                                "custom": "",
                                "conditional": {
                                    "show": "",
                                    "json": "",
                                    "when": ""
                                }
                            },
                            {
                                "hidden": true,
                                "clearOnHide": false,
                                "input": true,
                                "logic": [],
                                "alwaysEnabled": false,
                                "defaultValue": "",
                                "validate": {
                                    "json": "",
                                    "customMessage": ""
                                },
                                "tableView": true,
                                "attributes": {},
                                "showCharCount": false,
                                "properties": {},
                                "type": "textfield",
                                "allowMultipleMasks": false,
                                "label": "panOCRData",
                                "widget": {
                                    "type": ""
                                },
                                "key": "panOCRData",
                                "reorder": false,
                                "inputFormat": "plain",
                                "showWordCount": false,
                                "customConditional": "",
                                "encrypted": false,
                                "tags": [],
                                "conditional": {
                                    "show": "",
                                    "json": "",
                                    "when": ""
                                }
                            }
                        ],
                        "label": "Column",
                        "width": 6,
                        "input": false,
                        "hideOnChildrenHidden": false,
                        "offset": 0,
                        "key": "column",
                        "tableView": true,
                        "type": "column",
                        "pull": 0
                    },
                    {
                        "push": 0,
                        "components": [
                            {
                                "hidden": true,
                                "clearOnHide": false,
                                "input": true,
                                "logic": [],
                                "alwaysEnabled": false,
                                "defaultValue": "",
                                "validate": {
                                    "json": "",
                                    "customMessage": ""
                                },
                                "tableView": true,
                                "attributes": {},
                                "showCharCount": false,
                                "properties": {},
                                "type": "textfield",
                                "allowMultipleMasks": false,
                                "label": "data",
                                "widget": {
                                    "type": ""
                                },
                                "key": "pan_button",
                                "reorder": false,
                                "inputFormat": "plain",
                                "showWordCount": false,
                                "customConditional": "",
                                "encrypted": false,
                                "tags": [],
                                "conditional": {
                                    "show": "",
                                    "json": "",
                                    "when": ""
                                }
                            }
                        ],
                        "label": "Column",
                        "width": 6,
                        "input": false,
                        "hideOnChildrenHidden": false,
                        "offset": 0,
                        "key": "column",
                        "tableView": true,
                        "type": "column",
                        "pull": 0
                    }
                ],
                "tableView": false,
                "customConditional": "",
                "attributes": {},
                "alwaysEnabled": false,
                "conditional": {
                    "show": "",
                    "json": "",
                    "when": ""
                },
                "properties": {}
            }
        ],
        "title": "Pan",
        "customConditional": "",
        "attributes": {},
        "collapsed": false,
        "alwaysEnabled": false,
        "conditional": {
            "show": "",
            "json": "",
            "when": ""
        },
        "properties": {}
    });
  }

  static builderInfo = {
    title: "Pan File",
    group: "basic",
    icon: "fa fa-file",
    weight: 70,
    documentation:
      "https://formio.github.io/formio.js/app/examples/customcomponent.html",
    schema: PanFile.schema()
  };
}
