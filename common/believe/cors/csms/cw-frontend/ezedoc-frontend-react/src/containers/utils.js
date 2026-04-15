/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable no-unused-vars */
import React, { Fragment } from 'react'
import { NavLink } from 'react-router-dom'
import axios from 'axios';
import ReactTooltip from 'react-tooltip';
import { email_test } from "containers/Process/ProcessComponents";

import {
  DEFAULT_PAGE_SIZE,
  ENTITY_EMAIL,
  ENTITY_PHONE_NUMBER,
  BACK_SLASH_REGEX,
  SPECIAL_CHARACTERS_ERROR_REGEX
} from "../Data/constants";

const APP_URL = process.env.REACT_APP_APP_URL;

export const getFullName = (firstName, middleName, lastName) => {
  let fullName = "";
  fullName = middleName ? (`${firstName} ${middleName} ${lastName}`) : (`${firstName} ${lastName}`);
  return fullName;
}

export const getKeyValuePair = (object = {}) => {
  /*
  Given a object, {firstName: 'John', lastName: 'Doe' }
  getKeyValuePair function returns, 
    [
      {key: firstName, value: 'John'}, 
      {key: 'lastName', value: 'Doe'}
    ] 
  */
  return Object.keys(object).map(entry => ({
    key: entry,
    name: object[entry]
  }))
};

export const getObjectFromArray = (array = []) => {

  /* 
    Given an array of objects, [
      {key: firstName, value: 'John'}, 
      {key: 'lastName', value: 'Doe'}
    ],
    getObjectFromArray returns {firstName: 'John', lastName: 'Doe' }
  */

  return array.reduce((result, entry) => ({
    ...result,
    [entry.key]: entry.name
  }), {});
}

export const toCamelCase = (str="") => (str
  .replace(/\s(.)/g, $1 => ($1.toUpperCase()))
  .replace(/\s/g, '')
  .replace(/^(.)/, $1 => ($1.toLowerCase()))
);

export const msToTime = (ms) => {
  let days = Math.floor(ms / (24*60*60*1000));
  let daysms=ms % (24*60*60*1000);
  let hours = Math.floor((daysms)/(60*60*1000));
  let hoursms=ms % (60*60*1000);
  let minutes = Math.floor((hoursms)/(60*1000));
  let minutesms=ms % (60*1000);
  let sec = Math.floor((minutesms)/(1000));
  // eslint-disable-next-line no-nested-ternary
  days = days ? (days > 1 ? `${days}days` : `${days} day `) : "";
  hours = hours ? `${hours} hrs ` : "";
  return `${days + hours + minutes} min ${sec} sec`;
}

export const showScrollArrows = (reference) => {
  let childNode = reference;
  let showArrow = childNode ? childNode.offsetWidth < childNode.scrollWidth : false;
  return showArrow;
}

export const handleArrowsClick = (e, reference, moveLeft) => {
  e.preventDefault();
  if(reference) {
    let node = reference;
    if(moveLeft === true || moveLeft === false) {
      let newPos = moveLeft ? node.scrollLeft - 200 : node.scrollLeft + 200;
      node.scrollLeft = newPos;
    }
  }
}

export const arrowButtons = (reference) => (
  <>
    <button type="button" className="button-slider" onClick={(e) => handleArrowsClick(e, reference, true)}>
      <span className="glyphicon glyphicon-menu-left" />
    </button>
    <button type="button" className="button-slider" onClick={(e) => handleArrowsClick(e, reference, false)}>
      <span className="glyphicon glyphicon-menu-right" />
    </button>
  </>
)

export const isMobile = () => {
  return window.innerWidth <= 576;
}

export const isPDF = (type) => {
  return type === "application/pdf"
}

export const isImage = (type) => {
  return type.startsWith('image')
}

export const isSVG = (type) => {
  return type.endsWith('svg+xml')
}

export const isVideo = (type) => {
  return /^video{1,}\/\w+/.test(type)
}

export const isNumber = (value) => {
  const result = `${value}`;
  // eslint-disable-next-line no-restricted-globals
  return !isNaN(result) && !isNaN(parseFloat(result))
}


export const checkEtag = (last_tag_value,data) => {
  let tag_value = last_tag_value
  let found = false
  // eslint-disable-next-line no-unused-expressions
  data && data.map((e) => {
    if(e.name === "e_tag") {
      tag_value = e.value
      found = true
    }
    return e.value
  })
  if(!found) {
    // eslint-disable-next-line no-console
    console.warn("Form saved successfully, Expected to be returned a etag but no etag found.")
  } 
  return tag_value;
}

// for outputting designed jsx
export const getTaskName = (taskName='') => {
      let forRegex = taskName;
      let arr = [];
      let myRegexp = /(\$\{.*?})/g;
      let match = myRegexp.exec(forRegex);
      let variables = [];

      while (match != null) {
        variables.push(match[0])
        match = myRegexp.exec(forRegex);
      }

      variables.forEach(item=>{
        let taskArr = taskName.split(item);
        if (taskArr.length > 1) {
          arr.push(<span key={item} >{taskArr[0]}</span>);
          arr.push(<span key={`${item}value`} style={{color: '#32a89d'}} > 
                      <i>{` ${item.slice(2,-1)}`}</i>
                   </span>);
          // eslint-disable-next-line no-param-reassign
          taskName = taskArr[1];
        }
      })
      if (arr.length > 0) {
        return arr;
      }
        return taskName;
      
  }

  // for outputting simple text for breadcrum
  export const getTaskNameString = (taskName='') => {
    let taskArr = taskName.split(' ');
    let result = taskArr.map(eachWord => {
        if (eachWord.startsWith('${') && eachWord.endsWith('}')) {
            return eachWord.slice(2,-1)
        }
        return eachWord;
    });
    return result.join(' ');
}

export const submissionTransformer = (data, type) => {
  let submission = {...data}
  if(type === "start_form") {
    Object.keys(submission).map(item => {
      if (item.startsWith('current_user_') || item === 'submit') delete submission[item]
      return null
    })
  }
  if(submission[ENTITY_EMAIL]) {
    submission[ENTITY_EMAIL] = submission[ENTITY_EMAIL].toLowerCase()
  }
  delete submission.client_info;
  return submission;
}

const tooltipDataStyle = {
  display: 'block',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
}

export const Item = ({
  id,
  name,
  type,
  data,
  path,
  children,
  multiData,
  placement = 'bottom',
  onClick,
}) => {
  let content = null

  if (type === 'text') content = (
    <p
      data-tip
      style={tooltipDataStyle}
      data-for={`${name}-${id}`}
      onClick={onClick}
    >
      {data}
    </p>
  )
  if (type === 'list') content = (
    <p
      data-tip
      style={tooltipDataStyle}
      data-for={`${name}-${id}`}
      onClick={onClick}
    >
      {multiData.join()}
    </p>
  )
  if (type === 'navlink' && path) content = (
    <NavLink
      data-tip
      to={path}
      style={tooltipDataStyle}
      data-for={`${name}-${id}`}
      onClick={onClick}
    >
      {data}
    </NavLink>
  )
  if (type === 'icon' && children) content = <span data-tip data-for={`${name}-${id}`}>{children}</span>

  const fillData = (text, index) => <h6 key={index} style={{color: '#fff'}}>{text}</h6>

  let content2 = null

  if (multiData) content2 = multiData.map((text, index) => fillData(text, index))
  else if (data) content2 = data
  return (
    <Fragment>
      {content}
      {
        !isMobile() ? (
          <ReactTooltip
            delayShow={1000}
            place={placement}
            aria-haspopup='true'
            id={`${name}-${id}`}
            className='app_btn_bg_color'
          >
            {content2}
          </ReactTooltip>
        ) : null
      }
    </Fragment>
  )
}

export const handleRedirect = (url_data, hash) => {
  let url = new URL(url_data);
  let redirect = url.searchParams.get("redirect");
  let back_url = url.searchParams.get("url");
  let hash_url = hash;
  redirect = `${redirect}&url=${back_url}${hash_url}`;
  return redirect;
};

export const emailPhone = (data) => {
  let result = data.reduce((acc, key) => {
    let temp = { id: key.id };
    key.variables.map((vars) => {
      if (vars.name === ENTITY_EMAIL) {
        if (!email_test(vars.value)) {
          temp.email = vars.value;
        }
      } else if (vars.name === ENTITY_PHONE_NUMBER) {
        temp.phone = vars.value;
      }
      return vars;
    });
    acc.push(temp);
    return acc;
  }, []);
  return result;
};


export const getUrlVars = () => {
  let vars = {};
  let hashes = window.location.href
    .slice(window.location.href.indexOf("?") + 1)
    .split("&");
  for (let i = 0; i < hashes.length; i+=1) {
    let [key, value] = hashes[i].split("=");

    if((key === 'page' || key === 'size') && !parseInt(value, 10)) {
      if(key === 'page') {
        value = 1;
      } else if(key === 'size') {
        // The default page size is 5 for process and task pages
        value = DEFAULT_PAGE_SIZE;
      }
    }

    vars[key] = value;
  }
  return vars;
};

export const isCompletedWithdrawnActive = () => {
  const urlData = getUrlVars();
  const showCompletedWithdrawn = process.env.REACT_APP_SHOW_COMPLETED_WITHDRAWN;
  if(showCompletedWithdrawn){
    return true;
  }
  if(urlData?.showDebug){
    return true;
  }

  return false;
}

export const parseQueryString = (urlData) => {
  let list = [];
  let hashData = {};

  if (urlData) {
    list = urlData.slice(urlData.indexOf("?") + 1).split("&");
    list.map((item) => {
      hashData[item.split("=")[0]] = item.split("=")[1];
      return null;
    });
  }

  return hashData;
};

export const getHost = () => {
  const current_url = new URL(window.location);
  const hostname = current_url.hostname;
  return hostname;
};

/**
 * usage
 * 
 * if error message is a JSON object
 * clientLogger.log({
 *  message: {
 *    key : "value",
 *    key2: "value2"
 *  }
 * });
 * 
 * if it is a simple string message
 * clientLogger.log({
 *    message: "Hello world , how is it there."
 *  });
 */

export const clientLogger = {
  log({ message }) {
    const webHookURL = process.env.REACT_APP_LOG_URL;

    if(!webHookURL) return;

    const data = JSON.stringify({
      text: `\`\`\`${JSON.stringify(message)}\`\`\``,
    });

    fetch(webHookURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: data,
    }).catch(() => {
      // eslint-disable-next-line no-console
      console.log("Failed to log error");
    });
  },
};

export const filterPayloadData = (data, keyTypePair) => {
  let payloadVariables = {}
  let otherFields = [
    {key: 'e_tag', 'type': 'string'},
    {key: 'transaction_id', 'type': 'string'}
  ]
  let allFields = [
    ...otherFields,
    ...keyTypePair
  ]

  allFields.map(item => {
    payloadVariables[item.key] = (data[item.key] === undefined || data[item.key] === null) ? '' : data[item.key];
    return null;
  })

  return payloadVariables
}

export const DocumentFetchHandler = (instance, orgId, setLoader, isEntity, data1, data2) => {
  if (instance.state.docData.length === 0) {
      if (data1) {
          setLoader(true)
          const DOCUMENTS_FETCH_API = isEntity
            ? `${APP_URL}/${orgId}/forms/user_files?entityId=${data2}`
            : `${APP_URL}/${orgId}/forms/user_files?processInstanceId=${data1}&processDefinitionKey=${data2}`
          axios.get(DOCUMENTS_FETCH_API)
              .then(response => {
                  instance.setState({
                      currentFormId: null,
                      currentTab: 'documents',
                      docData: response.data.data,
                  })
              })
              .catch(() => {
                  instance.setState({
                      currentFormId: null,
                      currentTab: 'documents'
                  })
              })
              .finally(() => {
                  instance.showArrows()
                  setLoader(false)
              })
      }
  } else {
      instance.showArrows()
      instance.setState({
          currentFormId: null,
          currentTab: 'documents'
      })
  }
}

export const FormHandler = (instance, orgId, setLoader, formName, index, current_user = {}, type, id) => {

  function setData() {
      const data = instance.state.allFormData[index]
      let currentFormData = data.content
      const components = currentFormData.components
      const componentsLength = components.length

      if (currentFormData.display === 'form' && components[componentsLength - 1].type === 'button')
          currentFormData.components.pop() // Removing the 'Submit' button on the forms

      if (currentFormData.display === 'wizard' && componentsLength > 0) {
          components.map((component, i) => {
              if(currentFormData.components[i].buttonSettings) currentFormData.components[i].buttonSettings.cancel = false // Removing the 'Cancel' button on the wizards
              return null
          })
      }
      instance.showArrows()
      instance.setState({
          currentFormData,
          currentTab: 'form',
          currentFormId: index
      })
  }

  if (instance.state.formNames[index] === formName) {
      const data = instance.state.allFormData[index]
      if (data) setData()
      else {
          setLoader(true)
          const FORM_DATA_FETCH_API = (type === "process")
            ? `${APP_URL}/${orgId}/apps/get_form_data?name=${formName}&processDefinitionKey=${id}`
            : `${APP_URL}/${orgId}/apps/get_form_data?name=${formName}&master_model_id=${id}`
          axios.get(FORM_DATA_FETCH_API)
              .then(response => {
                  const { allFormData } = instance.state
                  allFormData[index] = response.data.data.forms[0]
                  instance.setState({
                      allFormData
                  }, () => {
                      setData()
                  })
              })
              .catch((error) => {
                instance.setState({
                  currentTab: 'form',
                  currentFormId: index,
                  currentFormData: null,
                })
                if(error.response && error.response.status === 404) {
                  clientLogger.log({
                    message: {
                      error: "User is trying to fetch the deleted form",
                      form_name: formName,
                      url: window.location.href,
                      current_user: current_user.userId 
                    }
                  });
                }
              })
              .finally(() => setLoader(false))
      }
  }
}

export const getRegexErrorMessage = fieldName => (
  <span>
    Only following special characters are allowed: comma, underscore, hyphen.
    <br />
    The&nbsp;
    {fieldName}
    &nbsp;can not start with special character, space or number and can not end with special character and space
  </span>
)

export const validator = value => {
  return value ? !(SPECIAL_CHARACTERS_ERROR_REGEX.test(value)) : false
}

export const getEscCharRegexErrorMessage = fieldName => `Backslash is not allowed in ${fieldName}`

export const escCharValidator = value => {
  return value ? !(BACK_SLASH_REGEX.test(value)) : false
}

export const getDebugText = () => {
  const debug = parseQueryString(window.location.search).showDebug === 'true'
  return debug ? '&showDebug=true' : ''
}

export const truncateStringFromMiddle = (text = "", maxSize = 20) => {
  const textLength = text.length;
  if (textLength < maxSize) return text;

  const firstHalf = text.substring(0, 10);
  const secondHalf = text.substring(textLength - 6, textLength);

  return `${firstHalf}...${secondHalf}`;
};

export const UploadFile = async (fileInfo) => {
  const {
 url, file: uploadedFile, method, label 
} = fileInfo;

  const USER_TOKEN = localStorage.getItem("token");
  let config = {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `JWT ${USER_TOKEN}`,
    },
  };

  try {
    const formData = new FormData();
    if (uploadedFile.name) {
      formData.append("name", uploadedFile.name);
    }
    formData.append("file", uploadedFile, label);

    const { data } = await axios({
      method,
      url,
      data: formData,
      headers: config.headers,
    });

    return Promise.resolve(data);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
    return Promise.reject(e);
  }
};

export async function getUrlFromFile(orgId, {
  label,
  uploadedFile,
  entityId,
  initialFile = {},
}) {
  let uploadMethod = "POST";
  let urlEndPoint = `${APP_URL}/${orgId}/forms/files?label=${label}&entityId=${entityId}`;


  if (initialFile && initialFile.length && initialFile[0].data) {
    uploadMethod = "PUT";
    urlEndPoint = initialFile[0].url;
  }

  try {
    const fileResponse = await UploadFile({
      url: urlEndPoint,
      label,
      method: uploadMethod,
      file: uploadedFile,
    });
    // let initialFile = { data : {
    //   baseUrl: "https://api.form.io",
    //   form: "",
    //   name: "IMG_20201006_141327_2 (1).jpg",
    //   project: "",
    //   size: 992070,
    //   url: "http://avimit.codzelocal.com/api/forms/files/bbbb5849-c630-4886-8d3c-afda6b8dfd3d"
    //   },
    //   name: "IMG_20201006_141327_2 -1--53e9b456-70b8-48e6-bd4d-9cdbe64f74c2.jpg",
    //   originalName: "IMG_20201006_141327_2 (1).jpg",
    //   size: 992070,
    //   storage: "url",
    //   type: "image/jpeg",
    //   url: "http://avimit.codzelocal.com/api/forms/files/bbbb5849-c630-4886-8d3c-afda6b8dfd3d"
    // }

    let result = [
      {
        data: {
          // ...initialFile?.data,
          form: "",
          project: "",
          baseUrl: "https://api.form.io",
          size: fileResponse.size,
          url: fileResponse.url,
          name: uploadedFile.name,
        },
        storage: "url",
        size: fileResponse.size,
        name: uploadedFile.name,
        type: uploadedFile.type,
        originalName: uploadedFile.name,
        url: fileResponse.url
      },
    ];

    return Promise.resolve(result);
  } catch (error) {
    return Promise.reject(error);
  }
}