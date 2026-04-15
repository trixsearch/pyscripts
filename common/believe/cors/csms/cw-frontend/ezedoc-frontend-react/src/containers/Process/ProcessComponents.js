import React from "react";
import ReactTooltip from "react-tooltip";

import ImageOrientation from "../../components/UI/ImageOrientation/ImageOrientation";
import UserAvatar from "../../assets/images/svg/userprofile.svg";
import NoRecordsImg from '../../assets/images/no_records.png';
import { isMobile } from '../utils';
import { 
  ENTITY_EMAIL,ENTITY_PHONE_NUMBER,ENTITY_NAME,ENTITY_PHOTO,ENTITY_INITIATOR 
} from "../../Data/constants";
import TickCross from "../../components/UI/TickCross/TickCross";


export const email_test = (data) =>{
  let test = false;
  let patt = new RegExp("^[0-9]{6,14}@ezedox.com$");
  test = patt.test(data);
  return test;
}

export const display_var_check = (data) => {
  let value = "-";
  value = data && typeof (data) !== "object" ? data : "-";
  return value
}

// Entity photo component for process card
export const EntityPhoto = React.memo(({ url, children }) => {
  return (
    <div
      className="process_details_text user_img"
      style={{ maxWidth: 80, paddingRight: 4 }}
    >
      <div className="image-cropper">
        {url.startsWith("http") ? (
          <ImageOrientation
            fileType="image"
            maximumWidth={null}
            maximumHeight={null}
            imageUrl={url}
            showLoader={false}
            classes="process-card-image"
            errorImagePlaceholder={UserAvatar}
          />
        ) : (
            <img className="process-card-image" src={url} alt="" />
          )}
      </div>
      {children}
    </div>
  );
});

export const ProcessText = React.memo(({ heading, value, children }) => {
  return (
    <div className="process_details_text">
      <p>{heading}</p>
      {value ? <h6 className="process-ongoing-overflow">{value}</h6> : children}
    </div>
  );
});

export const SelectedProcessVars = React.memo(({ displayVars }) => {
  return (
    <div className="process-cards-grid">
      {displayVars.map((val, i) => {        
        let [[key, value]] = Object.entries(val);
    
        return (
          <ProcessText
            key={`${value}__${i + i}`}
            heading={key}
          >
            <h6
              data-tip
              data-for={`${value}_${i}`}
              className="process-ongoing-overflow"
            >
              {TickCross(value)}
            </h6>
            {!isMobile() ? (
              <ReactTooltip
                id={`${value}_${i}`}
                place="bottom"
                delayShow={1000}
                aria-haspopup="true"
                className="app_btn_bg_color"
              >
                <h6 style={{ color: "white" }}>{value}</h6>
              </ReactTooltip>
            ) : null}
          </ProcessText>
        );
      })}
    </div>
  );
});

export const EmptyProcess = React.memo(({ message, children }) => (
  <div
    className="tab-pane active"
    id="ongoing_process"
    role="tabpanel"
    aria-labelledby="ongoing_process-tab"
  >
    <div className="no_records_cont">
      <div className="no_records_img_text">
        <img src={NoRecordsImg} alt="" />
        <p>
          {message}
          {children}
        </p>
      </div>
    </div>
  </div>
));

export const ProcessCard = React.memo(({ 
  count, children, type, isAdvProcessFilterActive
}) => {
  let height;
  let spaceForActiveFilterBanner = isAdvProcessFilterActive ? 30 : 0;
  if(isMobile())
    height = count > 5 ? window.innerHeight - spaceForActiveFilterBanner - 274 : window.innerHeight - spaceForActiveFilterBanner - 200;
  else
    height = window.innerHeight - 228;
  
  return (
    <div
      className="tab-content tab_content scrollable_content"
      style={{ height }}
    >
      <div
        className="tab-pane active"
        id={type.toLowerCase().split(' ').join('_')}
        role="tabpanel"
        aria-labelledby={`${type}-tab`}
      >
        <div className="completed_process_details_cont_row">{children}</div>
      </div>
    </div>
  );
});

export const getEntityDetails = (variables, selectedFormFields) => {
  // Enitity Name is filtered from variables and assigned to 'entity_name'
  let [entity_name] = variables.filter(varl => varl.name === ENTITY_NAME);

  // Initator value is filtered from variables and assigned to 'initiator'
  let [initiator] = variables.filter(varl => varl.name === ENTITY_INITIATOR);


  // Entity photo value is filtered and assigned to entity_photo, the value is sometimes stringified
  // hence parsing it, if valid url is not available , default userAvatar is assigned.
  let [entity_photo] = variables.filter(varl => varl.name === ENTITY_PHOTO);
  let [email] = variables.filter(varl => varl.name === ENTITY_EMAIL);
  let [phone] = variables.filter(varl => varl.name === ENTITY_PHONE_NUMBER)
  let email_value = ""
  let phone_value = ""
  if(email) {
    email_value = (!email_test(email.value)) ? email.value : ""
  }
  if(phone) {
    phone_value = (phone.value) ? phone.value : ""
  }
  let new_entity_photo = UserAvatar;
    try {
        if (entity_photo) {
            if (typeof (entity_photo.value) === "string") {
                new_entity_photo = JSON.parse(entity_photo.value)[0].data.url;
            } else if (typeof (entity_photo.value) === "object") {
                new_entity_photo = entity_photo.value[0].data.url;
            }
        }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("Entity Photo not found, default will be used")
    } finally {
        entity_photo = new_entity_photo;
    }


  // All process variables and selected-form-fileds(from config-view) are processed below
  // to make a JSON
  let displayVars = [];
  try {
      let newVariables = new Map();
      variables.map(item => {
        newVariables.set(item.name, item.value);
        return newVariables
      })
      displayVars = selectedFormFields.map(item => {
      let [key, value] = Object.entries(item)[0]
      let itemVal = newVariables.get(key);
        if(typeof (itemVal) === "object") {
          itemVal = '-'
        }
        if(key === ENTITY_EMAIL) {
          return {[value] : email_test(itemVal) ? "Candidate User" : itemVal}
        }
        return {[value]: itemVal} 
      });
  } catch (err) {
    displayVars = [];
  }
  return [initiator, entity_name, entity_photo, displayVars,email_value,phone_value];
}

export const ProcessTab = ({
  process, type, selectProcess, count
}) => {
  let countNum;
  if(isMobile())
    countNum = count > 999 ? `999+` : count
  else 
    countNum = count > 99999 ? `99999+` : count
  
  return (
    <li
      role="presentation"
      className={type === process ? "nav-item active process_tabs" : "nav-item"}
      onClick={() => selectProcess(process, true)}
      style={{paddingTop: 12}}
    >
      <a
        data-cy={process.split(' ')[0]}
        href={`#${process.toLowerCase().split(' ').join('-')}`}
        className="nav-link"
        data-toggle="tab"
        role="tab"
        aria-selected="true"
      >
        {process.split(' ')[0]}
        <span className="badge badge-pill badge-secondary p-1" style={{marginLeft: "5px"}}>{countNum}</span>
      </a>
    </li>
  )
}