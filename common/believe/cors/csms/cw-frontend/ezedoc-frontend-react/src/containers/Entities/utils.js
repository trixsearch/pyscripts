import axios from "axios";
import {
  SeparateFiles,
  StorageFileRemover,
} from 'ezereactcomponents/utils/FormioFileDeletionUtils'

const APP_URL = process.env.REACT_APP_APP_URL;

export const handleHover = (instance, data) => {
    if (!Object.keys(instance.state.hoveredApps).includes(data.id)) {
        let { entity_id } = instance.state;
        instance.setState(
            prevState => ({
                hoveredApps: {
                    ...prevState.hoveredApps,
                    [data.id]: "pending"
                }
            }),
            () => {
                let requestBody = {
                    processDefinitionKey: data.process_key,
                    finished: false,
                    variables: [
                        {
                            name: "entity_id",
                            operation: "equals",
                            value: entity_id,
                            variableOperation: "EQUALS"
                        }
                    ]
                }

                axios.post(`/api/proxy-bpm/query/process`, requestBody)
                    .then(res => {
                        if (res.data.data.total) {
                            instance.setState(prevState => ({
                                hoveredApps: {
                                    ...prevState.hoveredApps,
                                    [data.id]: "yes"
                                }
                            }))
                        } else {
                            instance.setState(prevState => ({
                                hoveredApps: {
                                    ...prevState.hoveredApps,
                                    [data.id]: "no"
                                }
                            }))
                        }
                    })
                    .catch(() => {
                        instance.setState(prevState => ({
                            hoveredApps: {
                                ...prevState.hoveredApps,
                                [data.id]: "no"
                            }
                        }))
                    })
            }
        )
    }
}

export const handleStatus = instance => {
    instance.setState(prevState => ({
        status: {
            ...prevState.status,
            statusCheck: true
        }
    }))
}

export const FireFiles = instance => {
  // Async file deletion will be performed only user confirm the prompt when 
  // 1. navigating to other page
  // 2. pressing 'Cancel' button
  const { fileSetToBeDeleted } = SeparateFiles(instance.state.fileComponentKeys, instance.state.filesUploaded, instance.state.initialData)
  StorageFileRemover(fileSetToBeDeleted)
}

export const handleClose = instance => {
    instance.setState(prevState => ({
        status: {
            ...prevState.status,
            openForm: false
        }
    }), () => {
        if(instance.props.toggleEntitySearchBar) {
            instance.props.toggleEntitySearchBar(true);
        }
        FireFiles(instance)
    });
};

export const editForm = (instance, orgId, data) => {
  instance.setState(
    {
      workflow_id: data.id,
      loader: true,
    },
    () => {
      axios
        .get(`${APP_URL}/${orgId}/apps/start-form/${data.id}`)
        .then((res) => {
          let submission = res.data.data;
          let submissionData = instance.state.submissionData;
          let entity_id = { entity_id: instance.state.entity_id };
          submissionData = {
            data: { ...submissionData.data, ...submission.data, ...entity_id },
          };
          axios
            .get(
              `${APP_URL}/${orgId}/forms/formversionwrapper?form_key_version=${res.data.data.formkey}&transaction_id=${submission.data.transaction_id}&get_keytype=true`
            )
            .then((form) => {
              let startForm = form.data.data;
              let client_info = { client_info: startForm.client_info };
              submissionData = {
                data: { ...submissionData.data, ...client_info },
              };

              // Collect initial files which are all already uploaded & saved
              let fileKeys = []
              let fileComponentKeys = []
              let currentFilesUploaded = new Set()
              startForm.file_fields.map(obj => {
                fileKeys = fileKeys.concat(Object.keys(obj))
                return null
              })
              if (fileKeys.length > 0) {
                fileKeys.map(fileKey => {
                  const dataForFileKey = submissionData.data[fileKey]
                  if (
                    dataForFileKey
                    && Array.isArray(dataForFileKey)
                    && dataForFileKey.length > 0
                  ) {
                    fileComponentKeys.push(fileKey)
                    dataForFileKey.map(file => currentFilesUploaded.add(file.url))
                  }
                  return null
                })
              }

              instance.setState((prevState) => ({
                status: {
                  ...prevState.status,
                  openForm: true,
                },
                startForm: startForm,
                submissionData: submissionData,
                keyTypePair: startForm.keytypepair || [],
                fileComponentKeys,
                filesUploaded: currentFilesUploaded,
                initialData: JSON.parse(JSON.stringify(submissionData.data)),
              }), () => {
                if(instance.props.toggleEntitySearchBar) {
                    instance.props.toggleEntitySearchBar(false);
                }
              });
            });
        })
        .catch((err) => {
           let errorMessage = "There are no forms associated with this workflow";
           if(err.isAxiosError) {
            errorMessage = (err.response && err.response.data) ? err.response.data.message : errorMessage;
           }
          instance.props.addToast(
            "error",
            "Error",
            errorMessage
          );
          instance.setState((prevState) => ({
            status: {
              ...prevState.status, 
              openForm: false,
            },
          }));
        })
        .finally(() => {
          instance.setState({
            loader: false,
          });
        });
    }
  );
};

export const formSubmit = (instance, orgId, data) => {
    instance.setState({
      loader: true
    })
    let id = instance.state.workflow_id;
    let payloadVariables = {}
    let otherFields = [
        {key: 'e_tag', 'type': 'string'},
        {key: 'entity_id', 'type': 'string'},
        {key: 'client_info', 'type': 'object'},
        {key: 'transaction_id', 'type': 'string'}
    ]
    let allFields = [
        ...otherFields,
        ...instance.state.keyTypePair
    ]

    allFields.map(item => {
        payloadVariables[item.key] = (data.data[item.key] === undefined || data.data[item.key] === null) ? '' : data.data[item.key];
        return null;
    })

    let appData = {
      id,
      variables: payloadVariables
    };
    axios
      .post(`${APP_URL}/${orgId}/apps/${id}/launch_process`, appData)
      .then(response => {
        instance.props.addToast('success', 'Success', response.data.message)
        instance.setState(prevState => ({
          status: {
            ...prevState.status,
            openForm: false
          },
          keyTypePair: [],
          isChangedByUser: false,
        }), () => {
          if(instance.props.toggleEntitySearchBar) {
            instance.props.toggleEntitySearchBar(true);
          }
          const { fileSetToBeDeleted } = SeparateFiles(instance.state.fileComponentKeys, instance.state.filesUploaded, payloadVariables)
          StorageFileRemover(fileSetToBeDeleted) // File Deletion after 'Submit' action
        });
      })
      .catch(err => {
        let workflowData = {id:instance.state.workflow_id}
        instance.setState({
            submissionData: {data: data.data}
          }, () => {
            editForm(instance, orgId, workflowData)
          })
        if (
          err.response
          && err.response.data.error_code
          && err.response.data.error
        ) {
          instance.props.addToast('error', 'Error', err.response.data.error.exception)
        } else {
          instance.props.addToast('error', 'Error', 'Something Went Wrong!')
        }
      }).finally(()=>{
        instance.setState({
          loader: false
        })
      });
  };