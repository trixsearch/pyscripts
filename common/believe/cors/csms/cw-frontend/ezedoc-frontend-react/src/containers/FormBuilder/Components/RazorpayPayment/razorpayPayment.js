/* eslint-disable no-useless-escape */
import Base from '@ezedoxbp/formiojs/components/base/Base';

export default class RazorpayPayment extends Base {
    static schema() {
        return Base.schema({
            "reorder": false,
            "type": "panel",
            "title": "Payment Gateway Panel",
            "conditional": {
              "when": "",
              "show": "",
              "json": ""
            },
            "label": "Panel",
            "mask": false,
            "components": [
              {
                "reorder": false,
                "type": "number",
                "input": true,
                "conditional": {
                  "when": "",
                  "show": "",
                  "json": ""
                },
                "label": "Amount to be paid in INR",
                "logic": [],
                "tableView": false,
                "delimiter": false,
                "alwaysEnabled": false,
                "encrypted": false,
                "tags": [],
                "customConditional": "",
                "attributes": {},
                "properties": {},
                "defaultValue": 100,
                "requireDecimal": false,
                "key": "amount",
                "validate": {
                  "required": true,
                  "min": 1,
                  "customMessage": "",
                  "json": ""
                },
                "mask": false
              },
              {
                "reorder": false,
                "type": "button",
                "input": true,
                "action": "event",
                "alwaysEnabled": false,
                "logic": [],
                "theme": "success",
                "event": "onPaymentRequest",
                "attributes": {},
                "showValidations": false,
                "defaultValue": false,
                "customConditional": "",
                "key": "pay",
                "conditional": {
                  "when": "paymentId",
                  "show": "true",
                  "json": ""
                },
                "custom": "",
                "label": "Make Payment",
                "mask": false,
                "encrypted": false,
                "tableView": false,
                "url": "",
                "state": "",
                "properties": {},
                "validate": {
                  "customMessage": "",
                  "json": ""
                },
                "shortcut": ""
              },
              {
                "reorder": false,
                "type": "textfield",
                "input": true,
                "properties": {},
                "inputFormat": "plain",
                "showWordCount": false,
                "logic": [
                  {
                    "actions": [
                      {
                        "type": "value",
                        "value": `var amount = data.amount;\nvar key = \"${process.env.REACT_APP_RZP_KEY}\";\n\nvar emailId = data.entity_email;\nvar regexPattern = /^91\\d{10}@ezedox\\.com$/g;\nvar isMatched = regexPattern.test(emailId);\n\nvar checkout = function() {\n    let options = {\n      \"key\": key,\n      \"amount\": amount * 100,\n      \"name\": data.businessName || \"ezeDox\",\n      \"description\": data.paymentDescription || \"Form Filling Payment\",\n      \"handler\": function (response){\n        instance.setValue(response.razorpay_payment_id);\n      },\n      \"prefill\": {\n        \"name\": data.entity_name,\n        \"contact\": data.entity_phone_number,\n        \"email\": isMatched ? '' : emailId\n      },\n      \"notes\": {\n        \"address\": \"Hello World\"\n      }\n    };\n    \n    let rzp = new Razorpay(options);\n    rzp.open();\n}\n\nif( typeof window.Razorpay == 'undefined') {\n    var script = document.createElement('script');\n    script.onload = checkout;\n    script.src = 'https://checkout.razorpay.com/v1/checkout.js';\n\n    document.body.appendChild(script);\n} else {\n    checkout();\n}`,
                        "name": "Action1"
                      }
                    ],
                    "trigger": {
                      "type": "event",
                      "event": "onPaymentRequest"
                    },
                    "name": "Logic1"
                  }
                ],
                "placeholder": "Payment reference will be shown on successful payment",
                "disabled": true,
                "attributes": {},
                "defaultValue": "",
                "customConditional": "",
                "key": "paymentId",
                "showCharCount": false,
                "conditional": {
                  "when": "",
                  "show": "",
                  "json": ""
                },
                "label": "Payment Reference",
                "allowMultipleMasks": false,
                "encrypted": false,
                "tableView": true,
                "widget": {
                  "type": ""
                },
                "alwaysEnabled": false,
                "validate": {
                  "required": true,
                  "customMessage": "",
                  "json": ""
                }
              }
            ],
            "logic": [],
            "collapsed": false,
            "alwaysEnabled": false,
            "tableView": false,
            "hideLabel": true,
            "attributes": {},
            "properties": {},
            "collapsible": false,
            "input": false,
            "customConditional": "",
            "key": "panel2"
          });
    }

    static builderInfo = {
        title: 'Razorpay Payment',
        group: 'basic',
        icon: 'fa fa-credit-card',
        weight: 70,
        documentation: 'https://formio.github.io/formio.js/app/examples/customcomponent.html',
        schema: RazorpayPayment.schema()
    }
}