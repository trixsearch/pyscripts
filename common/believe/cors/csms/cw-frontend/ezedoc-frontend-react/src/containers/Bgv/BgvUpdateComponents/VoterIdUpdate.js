import React from "react";
import { Formik } from "formik";
import * as Yup from "yup";

import FormikInput from "components/UI/FormikInput";
import { getUrlFromFile } from "containers/utils";
import { useParams } from "react-router-dom";
import { FileInput, BgvUpdateFormActions } from "./BgvUpdateCommon";

import "./styles.css";

const VoterIdUpdate = (props) => {
  const { name_on_voter_id, voterid, vidUrl } = props.data;
  const domainKey = props.domain_key

  let initial_vid_file_url = "";
  if (vidUrl && vidUrl[0]) {
    initial_vid_file_url = vidUrl[0].url;
  }

  const initialValues = {
    name: name_on_voter_id || "",
    voter_id_number: voterid || "",
    voter_id_file: initial_vid_file_url || "",
  };

  const voterIdFlag = domainKey === "i_vid_id"
  const hide_fields = true
  const buttonFlag = !voterIdFlag
  const { uuid: orgId } = useParams();

  let validationSchema = {}
  if (voterIdFlag) {
    validationSchema.voter_id_number = Yup.string().required(`Voter ID number is required`)
  }

  return (
    <div>
      <Formik
        enableReinitialize
        initialValues={{ ...initialValues }}
        onSubmit={async (values) => {
          props.setLoader(true);
          const payload = {
            name_on_voter_id: values.name,
            voterid: values.voter_id_number,
          };

          let vid_file_url = "";

          if (values.voter_id_file instanceof File) {
            try {
              const fileURL = await getUrlFromFile(orgId, {
                uploadedFile: values.voter_id_file,
                label: "voter_id_file",
                entityId: props.entityId,
                initialFile: vidUrl,
              });
              vid_file_url = fileURL;
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
          if (vid_file_url) {
            payload.vidUrl = vid_file_url;
          }
          props.setLoader(false);
          if (voterid === values.voter_id_number) {
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
                  {voterIdFlag ? (
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
                        name="voter_id_number"
                        label="Voter ID Number"
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
                    name="voter_id_file"
                    error={errors.voter_id_file}
                    touched={touched.voter_id_file}
                    onBlur={handleBlur}
                    setFieldValue={setFieldValue}
                    value={values.voter_id_file}
                    label="Choose Voter ID file"
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

export default VoterIdUpdate;
