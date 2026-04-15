# How to generate the library

step1: Generate API client or server using the online generators(https://generator.swagger.io/)

step2: client > [post] request to /gen/clients/{language}

step3: select language: python

step4: To set package name to process_engine, the HTTP body of the request is as follows:

{
  "spec": {},
  "options": {
    "packageName": "process_engine"
  },
  "swaggerUrl": "https://codzedev.com/rest/docs/specfile/process/flowable.json",
  "authorizationValue": {
    "value": "string",
    "type": "string",
    "keyName": "string"
  },
  "securityDefinition": {
    "type": "string",
    "description": "string"
  }
}

step5: you will get the response like this:

200 response body
{
  "code": "095d948f-1f52-488b-96a6-24a2d04de46e",
  "link": "https://generator.swagger.io/api/gen/download/095d948f-1f52-488b-96a6-24a2d04de46e"
}

step6: Open the link to download the zipped code.

step7: Copy only the process_engine folder and paste it in our project.

# Dependency required

REQUIRES = [
    "certifi>=2017.4.17",
    "python-dateutil>=2.1",
    "six>=1.10",
    "urllib3>=1.23"
]


# How to use the library:

step1: import process_engine # to get the module name and function name from process_engine

step2: from utils.process_engine_proxy import call

step3: check for the module name and function name, you will get the module name and function name from process_engine

exmaple:
    # create an instance of the API class
    # HistoryProcess
    HistoryProcess = process_engine.HistoryProcessApi
    # GET /history/historic-process-instances
    list_historic_process = HistoryProcess.list_historic_process_instances 

# how to pass variables to the proxy Api:
inside the proxy api function you will get the reference how to pass the variables.


action = call(module=HistoryProcess,func= list_historic_process, data=req_data, request=request, type="get")

to get the data >> action[0]
to get the status >> action[1]

type can be(mendatory):
1.post
2.get
3.retrieve
4.put 
5.delete
