import React, { lazy, Suspense } from "react";

import Spinner from "components/UI/Spinner/Spinner";
import { Button } from "components/UI/AppButton/AppButton";
import { email_test } from "containers/Process/ProcessComponents";
import { TOKEN } from "../../../../Data/constants";
import ProcessStats from "./processStatistics";
import BgvDetails from "./BgvDetails";

import "./bgv.css";
import "./DocumentDetails.css";

const LazyAuditLog = lazy(() => import("./AuditLog"));
const LazyForm = lazy(() => import("components/Formio"));
const LazyDocumentDetails = lazy(() => import("./DocumentDetails"));
const LazyImageCropper = lazy(() => import("ezereactcomponents/ImageCropper"));

export const NoRecordsFound = () => {
  return (
    <div style={{padding: '10px'}}>
      <hr style={{margin: '10px'}} />
      <div className="NoDocs">
        No records found
      </div>
    </div>
  )
}

// eslint-disable-next-line no-unused-vars
const ProfileDetails = (props) => {
  if (!props.profileInfo) 
    return (<NoRecordsFound />)
  const {
    entity_name,
    entity_phone_number,
    role,
    designation,
    entity_email,
    gender,
    father_name,
    date_of_birth,
    date_of_joining,
    full_current_address,
    full_permanent_address,
    emergency_contact_name,
    emergency_contact_number,
    bank_account_name,
    bank_account_number,
    bank_ifsc_code,
  } = props.profileInfo;
  return (
    <div className="bgv-detail-container profile-details row">
      <div className="col-md-6">
        <div>Name</div>
        <div>{entity_name || "-"}</div>
      </div>
      <div className="col-md-6">
        <div>Mobile Number</div>
        <div>{entity_phone_number || "-"}</div>
      </div>
        <div className="col-md-6">
          <div>Role/Designation</div>
          <div>{role || designation || "-"}</div>
        </div>
        <div className="col-md-6">
          <div>Email ID</div>
          <div>{email_test(entity_email) ? "-" : entity_email}</div>
        </div>
      <div className="col-md-6">
        <div>Gender</div>
        <div>{gender || "-"}</div>
      </div>
      <div className="col-md-6">
        <div>Father name</div>
        <div>{father_name || "-"}</div>
      </div>
      <div className="col-md-6">
        <div>Date of Birth</div>
        <div>{date_of_birth || "-"}</div>
      </div>
      <div className="col-md-6">
        <div>Date of Joining</div>
        <div>{date_of_joining || "-"}</div>
      </div>
      <div className="col-md-6">
        <div>Present address</div>
        <div>{full_current_address || "-"}</div>
      </div>
      <div className="col-md-6">
        <div>Permanent address</div>
        <div>{full_permanent_address || "-"}</div>
      </div>
      <div className="col-md-6">
        <div>Emergency contact name</div>
        <div>{emergency_contact_name || "-"}</div>
      </div>
      <div className="col-md-6">
        <div>Emergency contact number</div>
        <div>{emergency_contact_number|| "-"}</div>
      </div>
      <hr style={{ width: "100%", borderTopWidth: "2px" }} />
      <div className="col-md-6">
        <div>Bank Name</div>
        <div>{bank_account_name || "-"}</div>
      </div>
      <div className="col-md-6">
        <div>Account Number</div>
        <div>{bank_account_number || "-"}</div>
      </div>
      <div className="col-md-6">
        <div>IFSC code</div>
        <div>{bank_ifsc_code || "-"}</div>
      </div>
      <hr style={{ width: "100%", border: "none", margin: 0 }} />
    </div>
  );
};

const AttachmentCondition = (props) => {
  let styleObj = {
    display: "flex",
    justifyContent: "center",
    paddingBottom: "5px",
    paddingRight: "5px",
  };

  return (
    <Suspense fallback={<Spinner />}>
      {props.tabType === "form" && props.form ? (
        <div
          className="ezedox_form_up"
          style={props.formScroll ? { height: window.innerHeight - 250 } : {}}
        >
          <LazyImageCropper token={TOKEN} />
          <LazyForm
            form={props.form || null}
            options={props.options || null}
            onSubmit={props.formSubmit || null}
            submission={props.submission || null}
          />
        </div>
      ) : null}

      {props.tabType === "form" && !props.form ? (
        <div style={{ padding: 20 }}>
          This form does not exist. Please contact system administrator.
        </div>
      ) : null}

      {props.tabType === "documents" ? (
        <LazyDocumentDetails
          type={props.type}
          doc_data={props.doc_data}
          submission={props.submission}
          fileTags={Object.keys(props.doc_data)}
        />
      ) : null}

      {props.tabType === "processStats" || props.tabType === "entityStats" ? (
        <ProcessStats
          type={props.type}
          data={
            props.type && props.type === "entity"
              ? props.entityData
              : props.processData
          }
        />
      ) : null}

      {props.tabType === "history" ? (
        <div>
          <LazyAuditLog auditData={props.auditData} />
          {props.historySize > 10 && props.viewAllHistoryShow ? (
            <div style={styleObj}>
              <Button
                variant="link"
                onClick={() => {
                  props.viewAllHistoryHandler();
                }}
              >
                View All History
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
      {props.tabType === "bgv" ? <BgvDetails {...props} /> : null}
      {props.tabType === "profileDetails" ? (
        <ProfileDetails {...props} />
      ) : null}
    </Suspense>
  );
};

export default AttachmentCondition;
