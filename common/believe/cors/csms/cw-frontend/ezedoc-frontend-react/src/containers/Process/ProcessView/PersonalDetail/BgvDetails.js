import React, { useState, useCallback } from "react";
import { connect } from "react-redux";
import moment from "moment";
import Axios from "axios";
import Modal from "components/Modal";

import { Button } from "components/UI/AppButton/AppButton";
import UserAvatar from "assets/images/userProfile.png";
import PanUpdate from "containers/Bgv/BgvUpdateComponents/PanUpdate";
import VoterIdUpdate from "containers/Bgv/BgvUpdateComponents/VoterIdUpdate";
import DrivingLicenseUpdate from "containers/Bgv/BgvUpdateComponents/DrivingLicenseUpdate";
import PresentAddressUpdate from "containers/Bgv/BgvUpdateComponents/PresentAddressUpdate";
import PermanentAddressUpdate from "containers/Bgv/BgvUpdateComponents/PermanentAddressUpdate";
import EduRecordUpdate from "containers/Bgv/BgvUpdateComponents/EduRecordUpdate";
import EmpRecordUpdate from "containers/Bgv/BgvUpdateComponents/EmpRecordUpdate";
import ProReferenceUpdate from "containers/Bgv/BgvUpdateComponents/ProReferenceUpdate";
import CCRVUpdate from "containers/Bgv/BgvUpdateComponents/CCRVUpdate";
import Spinner from "components/UI/Spinner/Spinner";
import { addToast } from "components/Toast/actions";
import {
  BGV_COLOR_CODES,
  BGV_STATUS_CODE,
  BGV_CHECK_TYPES,
  BGV_STATUS_MORE_DATA_NEEDED,
} from "containers/Bgv/BgvConstants";

import "./bgv.css";
import { NoRecordsFound } from "./AttachmentCondition";

export const FormattedDateTime = ({ date }) => {
  if (!date)
    return (
      <div className="formatted-date-time">
        <span>-</span>
        <span>-</span>
      </div>
    );
  return (
    <div className="formatted-date-time">
      <span>{moment(date).format("DD MMM YYYY")}</span>
      <span>{new Date(date).toLocaleTimeString()}</span>
    </div>
  );
};

const CheckTypeComponentMap = {
  DLV: {
    component: DrivingLicenseUpdate,
    title: "Driving license update",
  },
  PANV: {
    component: PanUpdate,
    title: "PAN update",
  },
  CCRV: {
    component: CCRVUpdate,
    title: "CCRV details update",
  },
  VIDV: { component: VoterIdUpdate, title: "Voter ID update" },
  EDUV: { component: EduRecordUpdate, title: "Education records update" },
  EMPV: { component: EmpRecordUpdate, title: "Employee records update" },
  LAV: { component: PresentAddressUpdate, title: "Present address update" },
  PAV: { component: PermanentAddressUpdate, title: "Permanent address update" },
  PRC: {
    component: ProReferenceUpdate,
    title: "Professional reference update",
  },
};

export const BgvCard = (props) => {
  const {
    partner_transaction_id,
    check_id,
    status,
    profile,
    check_type,
    description,
    created_at,
    valid_upto,
    updated_at,
    entity_photo,
    entity_name,
    doc_ref_id,
    individual_id,
    domain_key
  } = props.item;

  const { showEntityPhoto } = props;

  const [show, setShow] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);

  const setLoader = useCallback(setIsLoading, []);

  const fetchProfileData = () => {
    setIsLoading(true);
    setShow(true);

    let additonalParams = '';
    if (['EDUV', 'EMPV', 'PRC'].includes(check_type)) {
      additonalParams = `?bgv_required=true&check_type=${check_type}&doc_ref_id=${doc_ref_id}`
    }

    Axios.get(
      `/api/entity/master/data/${profile}/get_complete_entity_data${additonalParams}`
    )
      .then((res) => {
        setProfileData(res.data.data);
        setShow(true);
      })
      .catch(() => {
        props.addToast('error', 'Error', "Failed to fetch entity data.")
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const closeModal = () => {
    setShow(false);
  };

  const handleSubmit = (data) => {
    setIsLoading(true);
    Axios.patch(`/api/entity/master/data/${profile}`, {
      bgv: {
        check_type,
        individual_id: individual_id, // individual_id => updated on Apr-7-21
        bgv_instance_id: check_id, // check_id
        request_id: partner_transaction_id, // partner_transaction_id
        doc_ref_id: doc_ref_id
      },
      entity_data: {
        ...data,
      },
    })
      .then(() => {
        closeModal();
      })
      .catch(() => {
        props.addToast('error', 'Error', "Failed to update entity data.")
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  let updateComponent = null;
  let hideUpdateBtn = true;

  if (CheckTypeComponentMap[check_type]) {
    const { title, component } = CheckTypeComponentMap[check_type];
    updateComponent = {};
    updateComponent.title = title;
    updateComponent.component = component;
    hideUpdateBtn = false;
  }

  let entityPhotoUrl = null;
  if (entity_photo && entity_photo.length) {
    entityPhotoUrl = entity_photo[0].url;
  }

  return (
    <div
      id={props.id}
      className={`a ${props.active ? "bgv-card-active" : ""}`}
      style={{
        borderColor: BGV_COLOR_CODES[status],
      }}
    >
      {isLoading && <Spinner />}
      <Modal
        show={show}
        title={updateComponent ? updateComponent.title : ""}
        onClose={() => setShow(false)}
      >
        <div>
          {!!(profileData && updateComponent) && (
            <>
              {!!description && <div className="well" style={{ textAlign: 'center', padding: '8px' }}>{description}</div>}
              {updateComponent.component({
                onClose: closeModal,
                data: profileData || {},
                onSubmit: handleSubmit,
                addToast: props.addToast,
                entityId: profile,
                setLoader,
                domain_key: domain_key || ""
              })}
            </>
          )}
        </div>
      </Modal>
      <div
        className="d-flex en"
        style={{
          justifyContent: "space-between",
          width: "50%",
          display: "flex",
        }}
      >
        {showEntityPhoto && (
          <div className="b e">
            <img style={{ borderRadius: '50%' }} src={entityPhotoUrl || UserAvatar} alt="avatar" width="48" height="auto" />
            <span className="text-center">{entity_name || "-"}</span>
          </div>
        )}
        <div className="b v" style={{ flexBasis: "75%" }}>
          <span style={{ fontSize: 18 }}>{BGV_CHECK_TYPES[check_type]}</span>
          <span>{BGV_STATUS_CODE[status] || "-"}</span>
        </div>
      </div>
      <div className="d">
        <div>
          <span>Created at</span>
          <FormattedDateTime date={created_at} />
        </div>
        <div>
          <span>Updated at</span>
          <FormattedDateTime date={updated_at} />
        </div>
        <div>
          <span>Expires at</span>
          <FormattedDateTime date={valid_upto} />
        </div>
        <div className="d-flex" style={{ alignItems: "center" }}>
          {props.item.report_url ? (
            <a className="appear-like-link" href={props.item.report_url} target="_blank" rel="noopener noreferrer">
              Download Report
            </a>
          ) : (
            <button
              disabled
              type="button"
              className="appear-like-link disabled-btn"
            >
              Download Report
            </button>
          )}
          {(status === BGV_STATUS_MORE_DATA_NEEDED && !hideUpdateBtn) ? (
            <Button variant="table-row-edit" onClick={fetchProfileData}>
              Update
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const Bgv = (props) => {
  if (!props.bgvInfo || !props.bgvInfo.length)
    return (<NoRecordsFound />);

  return (
    <div className="bgv-detail-container">
      {props.bgvInfo.map((item) => (
        <BgvCard
          key={item.check_id}
          item={item}
          addToast={props.addToast}
        />
      ))}
    </div>
  );
};

export default connect(null, { addToast })(Bgv);
