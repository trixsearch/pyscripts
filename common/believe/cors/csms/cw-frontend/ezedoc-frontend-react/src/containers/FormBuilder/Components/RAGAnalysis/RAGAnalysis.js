/* eslint-disable no-useless-escape */
import Base from '@ezedoxbp/formiojs/components/base/Base';

export default class RAGAnalysis extends Base {
    static schema() {
        return Base.schema({
            "attributes": {},
            "key": "columns2",
            "logic": [],
            "customClass": "well well-sm",
            "reorder": false,
            "customConditional": "",
            "mask": false,
            "label": "Columns",
            "properties": {},
            "tableView": false,
            "conditional": {
                "show": "",
                "json": "",
                "when": ""
            },
            "alwaysEnabled": false,
            "columns": [
                {
                    "push": 0,
                    "tableView": true,
                    "key": "column",
                    "pull": 0,
                    "components": [
                        {
                            "attributes": {},
                            "refreshOnChange": false,
                            "key": "html",
                            "attrs": [
                                {
                                    "value": "",
                                    "attr": ""
                                }
                            ],
                            "logic": [],
                            "conditional": {
                                "show": "",
                                "json": "",
                                "when": ""
                            },
                            "reorder": false,
                            "content": "<h3>RAG Analysis</h3>\n<h5>Click one of these to give a score</h5>",
                            "mask": false,
                            "label": "HTML",
                            "className": "",
                            "properties": {},
                            "tableView": true,
                            "validate": {
                                "customMessage": "",
                                "json": ""
                            },
                            "alwaysEnabled": false,
                            "encrypted": false,
                            "type": "htmlelement",
                            "input": false,
                            "customConditional": ""
                        }
                    ],
                    "hideOnChildrenHidden": false,
                    "width": 12,
                    "type": "column",
                    "label": "Column",
                    "input": false,
                    "offset": 0
                },
                {
                    "push": 0,
                    "tableView": true,
                    "key": "column",
                    "pull": 0,
                    "components": [
                        {
                            "attributes": {},
                            "defaultValue": false,
                            "key": "rag_red",
                            "encrypted": false,
                            "logic": [],
                            "conditional": {
                                "show": "",
                                "json": "",
                                "when": ""
                            },
                            "reorder": false,
                            "customConditional": "show = !(data.rag_amber || data.rag_green);",
                            "mask": false,
                            "customClass": "ragclass rag-red",
                            "label": "Red",
                            "properties": {},
                            "tableView": true,
                            "validate": {
                                "customMessage": "",
                                "json": ""
                            },
                            "alwaysEnabled": false,
                            "shortcut": "",
                            "type": "checkbox",
                            "input": true
                        },
                        {
                            "attributes": {},
                            "defaultValue": false,
                            "key": "rag_amber",
                            "encrypted": false,
                            "logic": [],
                            "conditional": {
                                "show": "",
                                "json": "",
                                "when": ""
                            },
                            "reorder": false,
                            "customConditional": "show = !(data.rag_red || data.rag_green);",
                            "mask": false,
                            "tags": [],
                            "customClass": "ragclass rag-amber",
                            "label": "Amber",
                            "properties": {},
                            "tableView": true,
                            "validate": {
                                "customMessage": "",
                                "json": ""
                            },
                            "alwaysEnabled": false,
                            "shortcut": "",
                            "type": "checkbox",
                            "input": true
                        },
                        {
                            "attributes": {},
                            "defaultValue": false,
                            "key": "rag_green",
                            "encrypted": false,
                            "logic": [],
                            "conditional": {
                                "show": "",
                                "json": "",
                                "when": ""
                            },
                            "reorder": false,
                            "customConditional": "show = !(data.rag_red || data.rag_amber);",
                            "mask": false,
                            "tags": [],
                            "customClass": "ragclass rag-green",
                            "label": "Green",
                            "properties": {},
                            "tableView": true,
                            "validate": {
                                "customMessage": "",
                                "json": ""
                            },
                            "alwaysEnabled": false,
                            "shortcut": "",
                            "type": "checkbox",
                            "input": true
                        }
                    ],
                    "hideOnChildrenHidden": false,
                    "width": 6,
                    "type": "column",
                    "label": "Column",
                    "input": false,
                    "offset": 0
                },
                {
                    "push": 0,
                    "tableView": true,
                    "key": "column",
                    "pull": 0,
                    "components": [],
                    "hideOnChildrenHidden": false,
                    "width": 6,
                    "type": "column",
                    "label": "Column",
                    "input": false,
                    "offset": 0
                }
            ],
            "type": "columns",
            "input": false
        });
    }

    static builderInfo = {
        title: 'RAG Analysis',
        group: 'basic',
        icon: 'fa fa-smile-o',
        weight: 70,
        documentation: 'https://formio.github.io/formio.js/app/examples/customcomponent.html',
        schema: RAGAnalysis.schema()
    }
}