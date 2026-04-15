import Base from '@ezedoxbp/formiojs/components/base/Base';

export default class AadhaarMask extends Base {
    static schema() {
        return Base.schema({
            "label": "Panel",
            "collapsible": false,
            "components": [
                {
                    "label": "Aadhaar Number",
                    "encrypted": false,
                    "tags": [],
                    "defaultValue": "",
                    "showWordCount": false,
                    "logic": [],
                    "showCharCount": false,
                    "input": true,
                    "attributes": {},
                    "properties": {},
                    "conditional": {
                        "when": "",
                        "json": "",
                        "show": ""
                    },
                    "type": "textfield",
                    "reorder": false,
                    "customConditional": "",
                    "inputFormat": "plain",
                    "validate": {
                        "minLength": 12,
                        "custom": "const d = [\n[0, 1, 2, 3, 4, 5, 6, 7, 8, 9],\n[1, 2, 3, 4, 0, 6, 7, 8, 9, 5], \n[2, 3, 4, 0, 1, 7, 8, 9, 5, 6], \n[3, 4, 0, 1, 2, 8, 9, 5, 6, 7], \n[4, 0, 1, 2, 3, 9, 5, 6, 7, 8], \n[5, 9, 8, 7, 6, 0, 4, 3, 2, 1], \n[6, 5, 9, 8, 7, 1, 0, 4, 3, 2], \n[7, 6, 5, 9, 8, 2, 1, 0, 4, 3], \n[8, 7, 6, 5, 9, 3, 2, 1, 0, 4], \n[9, 8, 7, 6, 5, 4, 3, 2, 1, 0]\n]\n\n// permutation table\nconst p = [\n[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], \n[1, 5, 7, 6, 2, 8, 3, 0, 9, 4], \n[5, 8, 0, 3, 7, 9, 6, 1, 4, 2], \n[8, 9, 1, 6, 0, 4, 3, 5, 2, 7], \n[9, 4, 5, 3, 1, 2, 6, 8, 7, 0], \n[4, 2, 8, 6, 5, 7, 3, 9, 0, 1], \n[2, 7, 9, 3, 8, 0, 6, 4, 1, 5], \n[7, 0, 4, 6, 9, 1, 3, 2, 5, 8]\n]\n\n// validates Aadhar number received as string\nfunction validate(aadharNumber) {\nlet c = 0; aadharNumber = aadharNumber.toString();\nlet invertedArray = aadharNumber.split('').map(Number).reverse()\n\ninvertedArray.forEach((val, i) => {\nc = d[c][p[(i % 8)][val]]\n})\n\nreturn (c === 0)\n}\nvalid= validate(data.entity_aadhaar);",
                        "maxLength": 12,
                        "required": true,
                        "pattern": "^\\d{12}$",
                        "json": "",
                        "customMessage": "Enter valid 12 digit Aadhaar number"
                    },
                    "allowMultipleMasks": false,
                    "tableView": false,
                    "alwaysEnabled": false,
                    "key": "entity_aadhaar",
                    "widget": {
                        "type": ""
                    }
                },
                {
                    "customConditional": "",
                    "hidden": true,
                    "showWordCount": false,
                    "logic": [],
                    "showCharCount": false,
                    "conditional": {
                        "when": "",
                        "json": "",
                        "show": ""
                    },
                    "label": "Aadhaar Masked Number",
                    "reorder": false,
                    "encrypted": false,
                    "allowMultipleMasks": false,
                    "tableView": true,
                    "key": "entity_aadhaar_masked",
                    "type": "textfield",
                    "inputFormat": "plain",
                    "tags": [],
                    "clearOnHide": false,
                    "defaultValue": "",
                    "input": true,
                    "attributes": {},
                    "properties": {},
                    "validate": {
                        "json": "",
                        "customMessage": ""
                    },
                    "alwaysEnabled": false,
                    "widget": {
                        "type": ""
                    }
                },
                {
                    "customConditional": "",
                    "hidden": true,
                    "showWordCount": false,
                    "logic": [],
                    "showCharCount": false,
                    "conditional": {
                        "when": "",
                        "json": "",
                        "show": ""
                    },
                    "label": "Aadhaar Hashed Number",
                    "reorder": false,
                    "encrypted": false,
                    "allowMultipleMasks": false,
                    "tableView": false,
                    "key": "entity_aadhaar_hashed",
                    "type": "textfield",
                    "inputFormat": "plain",
                    "tags": [],
                    "clearOnHide": false,
                    "defaultValue": "",
                    "input": true,
                    "attributes": {},
                    "properties": {},
                    "validate": {
                        "json": "",
                        "customMessage": ""
                    },
                    "alwaysEnabled": false,
                    "widget": {
                        "type": ""
                    }
                }
            ],
            "logic": [],
            "input": false,
            "attributes": {},
            "properties": {},
            "conditional": {
                "when": "",
                "json": "",
                "show": ""
            },
            "type": "panel",
            "reorder": false,
            "customConditional": "",
            "mask": false,
            "hideLabel": true,
            "tableView": false,
            "alwaysEnabled": false,
            "collapsed": false,
            "key": "panel2"
        });
    }

    static builderInfo = {
        title: 'Aadhaar Mask',
        group: 'basic',
        icon: 'fa fa-id-card',
        weight: 70,
        documentation: 'https://formio.github.io/formio.js/app/examples/customcomponent.html',
        schema: AadhaarMask.schema()
    }

}