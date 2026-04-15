import React from "react";
import { Formik } from "formik";
import * as Yup from "yup";

import FormikInput from "components/UI/FormikInput";
import { getUrlFromFile } from "containers/utils";
import { useParams } from "react-router-dom";
import { BgvUpdateFormActions, FileInput } from "./BgvUpdateCommon";

import "./styles.css";

const PanUpdate = (props) => {
  const { uuid: orgId } = useParams();
  
  if (!props.data) {
    return null;
  }
  let {
    pan,
    name_on_pan_card,
    pan_url
  } = props.data;
  const domainKey = props.domain_key || ""

  let initial_pan_file_url = "";
  if (pan_url && pan_url[0]) {
    initial_pan_file_url = pan_url[0].url;
  }

  const initialValues = {
    candidate_name: name_on_pan_card || "",
    pan_number: pan || "",
    pan_file: initial_pan_file_url,
  };

  const panFlag = domainKey === "i_pan_id"
  const hide_fields = true
  const buttonFlag = !panFlag
  let validationSchema = {}
  if (panFlag) {
    validationSchema.pan_number = Yup.string().min(10).max(10).required(`PAN number is required`)
  }

  return (
    <div>
      <Formik
        enableReinitialize
        initialValues={{ ...initialValues }}
        onSubmit={async (values) => {
          props.setLoader(true);
          const { candidate_name, pan_number, pan_file } = values;
          let payload = {
            name_on_pan_card: candidate_name,
            pan: pan_number,
          };

          let updatedFile = "";

          if (pan_file instanceof File) {
            try {
              updatedFile = await getUrlFromFile(orgId, {
                uploadedFile: pan_file,
                label: "pan_file",
                initialFile: pan_url,
                entityId: props.entityId
              });
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
          if (updatedFile) {
            payload.pan_url = updatedFile;
          }
          props.setLoader(false);
          if (pan === pan_number) {
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
                  {panFlag ? (
                    <>
                      <FormikInput
                        name="candidate_name"
                        label="Candidate Name as per PAN"
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
                        name="pan_number"
                        label="PAN Number"
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
                    name="pan_file"
                    label="Choose PAN file"
                    error={errors.pan_file}
                    touched={touched.pan_file}
                    onBlur={handleBlur}
                    setFieldValue={setFieldValue}
                    value={values.pan_file}
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

export default PanUpdate;
