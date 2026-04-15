// eslint-disable-next-line import/no-extraneous-dependencies
import Base from '@ezedoxbp/formiojs/components/base/Base';

export default class EzedoxFile extends Base {
    static schema() {
      return Base.schema({
        "dir": "",
        "key": "upload",
        "url": "",
        "mask": false,
        "type": "file",
        "fileMaxSize":"10MB",
        "input": true,
        "filePattern":"image/*",
        "label": "Upload",
        "logic": [
        {
            "name": "L1",
            "actions": [
                {
                "name": "A1",
                "type": "value",
                "value": "const label =instance.component.label;\nvar id = data.transaction_id;\nvar quality = 0.5;\nwindow.getCroppedImage(instance.value,label,id,quality)\n.then(function(res){\n if(res[0]) res[0].isEdited = false;\n instance.setValue(res);\n}).catch(function(e){\n  instance.setValue([]);\n}).finally(function() {\n  instance.triggerChange();\n});"
                }
        ],
        "trigger": {
                "type": "javascript",
                "javascript": "result = (instance?.value?.length && (instance.value[0].isEdited === undefined || instance.value[0].isEdited)) ? true : false"
                }
            }
        ],
        "webcam": false,
        "options": "",
        "reorder": false,
        "storage": "base64",
        "validate": {
        "json": "",
        "customMessage": ""
        },
        "encrypted": false,
        "fileTypes": [
                {
                "label": "",
                "value": ""
                }
        ],
        "tableView": true,
        "attributes": {},
        "properties": {},
        "webcamSize": "",
        "conditional": {
        "json": "",
        "show": "",
        "when": ""
        },
        "defaultValue": [],
        "alwaysEnabled": false,
        "fileNameTemplate": "",
        "customConditional": ""
      });
    }

    static builderInfo = {
      title: 'Ezedox File',
      group: 'basic',
      icon: 'fa fa-file',
      weight: 70,
      documentation: 'https://formio.github.io/formio.js/app/examples/customcomponent.html',
      schema: EzedoxFile.schema()
    }
  
  }
