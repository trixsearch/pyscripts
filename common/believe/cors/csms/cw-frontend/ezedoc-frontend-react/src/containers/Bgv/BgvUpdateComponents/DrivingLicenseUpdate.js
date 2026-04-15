import React from "react";
import { Formik } from "formik";
import * as Yup from "yup";

import FormikInput from "components/UI/FormikInput";
import { getUrlFromFile } from "containers/utils";
import { useParams } from "react-router-dom";
import { BgvUpdateFormActions, FileInput } from "./BgvUpdateCommon";

import "./styles.css";

const DrivingLicenseUpdate = (props) => {

  const { name_on_dl, drivingLicense, dlUrl } = props.data;
  const domainKey = props.domain_key || ""
  const { uuid: orgId } = useParams();

  let initial_dl_file_url = "";
  if (dlUrl && dlUrl[0]) {
    initial_dl_file_url = dlUrl[0].url;
  }

  const initialValues = {
    name: name_on_dl || "",
    dl_number: drivingLicense || "",
    dl_file: initial_dl_file_url || "",
  };
  const dlNumberFlag = domainKey === "i_dl_id"
  const hide_fields = true
  const buttonFlag = !dlNumberFlag
  let validationSchema = {}
  if (dlNumberFlag) {
    validationSchema.dl_number = Yup.string().required(`DL number is required`)
  }

  return (
    <div>
      <Formik
        enableReinitialize
        initialValues={{ ...initialValues }}
        onSubmit={async (values) => {
          props.setLoader(true);
          const {
            name,
            dl_number,
            dl_file
          } = values;
          let payload = {
            name_on_dl: name,
            drivingLicense: dl_number
          };

          let dl_file_url = "";

          if (dl_file instanceof File) {
            try {
              const fileURL = await getUrlFromFile(orgId, {
                label: "driving_license_file",
                uploadedFile: dl_file,
                initialFile: dlUrl,
                entityId: props.entityId
              });
              dl_file_url = fileURL;
            } catch (error) {
              // show error toast
              props.addToast(
                "error",
                "Error",
                "Failed to upload file, please try later."
              );
              return;
            }
          }
          if (dl_file_url) {
            payload.dlUrl = dl_file_url;
          }
          props.setLoader(false);
          if (drivingLicense === dl_number) {
            props.addToast('error', 'Error', 'No changes detected')
          } else props.onSubmit(payload);
        }}
        validationSchema={Yup.object().shape({ ...validationSchema })}
      >
        {(formikProps) => {
          const {
            values,
            touched,
            errors,
            handleChange,
            handleBlur,
            handleSubmit,
            setFieldValue,
          } = formikProps;
          return (
            <>
              <form>
                <div className="form_up_box bgv-modal">
                  {dlNumberFlag ? (
                    <>
                      <FormikInput
                        name="name"
                        label="Candidate Name"
                        values={values}
                        errors={errors}
                        touched={touched}
                        disabled
                        handleChange={handleChange}
                        handleBlur={handleBlur}
                        className="col-md-12 mb-10"
                        autoComplete="off"
                      />
                      <FormikInput
                        name="dl_number"
                        label="DL Number"
                        values={values}
                        errors={errors}
                        touched={touched}
                        handleChange={handleChange}
                        handleBlur={handleBlur}
                        className="col-md-12 mb-10"
                        autoComplete="off"
                      />
                    </>
                  ) : null}
                </div>
                {hide_fields ? null : (
                  <FileInput
                    name="dl_file"
                    label="Choose Driving License file"
                    error={errors.dl_file}
                    touched={touched.dl_file}
                    onBlur={handleBlur}
                    setFieldValue={setFieldValue}
                    value={values.dl_file}
                  />
                )}
                {buttonFlag ? (
                  <h5 style={{ textAlign: "center" }}>To resolve this insufficiency please email the required details to the service provider.</h5>
                ) : null}
              </form>
              <BgvUpdateFormActions
                onClose={props.onClose}
                onSubmit={handleSubmit}
                disabled={buttonFlag}
              />
            </>
          );
        }}
      </Formik>
    </div>
  );
};

export default DrivingLicenseUpdate;
