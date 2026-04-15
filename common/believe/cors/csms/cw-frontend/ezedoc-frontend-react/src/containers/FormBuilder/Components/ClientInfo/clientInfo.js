import Base from '@ezedoxbp/formiojs/components/base/Base';

export default class ClientInfo extends Base {
    static schema() {
      return Base.schema( {
        "properties": {},
        "allowMultipleMasks": false,
        "showWordCount": false,
        "clearOnHide": false,
        "label": "Client Info",
        "validate": {
            "json": "",
            "customMessage": ""
        },
        "key": "",
        "logic": [],
        "attributes": {},
        "calculateValue": "value = data.client_info ? JSON.stringify(data.client_info) : \"\";",
        "encrypted": false,
        "defaultValue": "",
        "type": "textfield",
        "inputFormat": "plain",
        "showCharCount": false,
        "customConditional": "show = false;",
        "reorder": false,
        "widget": {
            "type": ""
        },
        "tableView": true,
        "input": true,
        "alwaysEnabled": false,
        "conditional": {
            "json": "",
            "when": "",
            "show": ""
        }
    });
    }

    static builderInfo = {
      title: 'Client Info',
      group: 'basic',
      icon: 'fa fa-user',
      weight: 70,
      documentation: 'https://formio.github.io/formio.js/app/examples/customcomponent.html',
      schema: ClientInfo.schema()
    }
  
  }