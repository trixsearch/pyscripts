import React from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import moment from "moment";

import FormikInput from "components/UI/FormikInput";
import { getUrlFromFile } from "containers/utils";
import { useParams } from "react-router-dom";
import { BgvUpdateFormActions, FileInput, formatDateBgv } from "./BgvUpdateCommon";

import "./styles.css";

const EduRecordUpdate = (props) => {
  const {
    eduDocIssueDate = "",
    grade = "",
    level = "",
    nameOfInstitute = "",
    record_name = "",
    registrationNumber = "",
    eduDocUrl,
  } = (!!props.data?.educational_record.length
    && props.data.educational_record[0]) || {};

  let initial_edu_file_url = "";
  if (eduDocUrl && eduDocUrl[0]) {
    initial_edu_file_url = eduDocUrl[0].url;
  }

  const domainKey = props.domain_key || ""
  const nameFlag = domainKey === "i_name"
  const registrationNumberFlag = domainKey === "i_edu_registration_number"
  const nameOfInstituteFlag = domainKey === "i_edu_college_name"
  const eduDocUrlFlag = domainKey === "i_edu_certificate"
  const buttonFlag = !((nameFlag || registrationNumberFlag || nameOfInstituteFlag || eduDocUrlFlag))
  const hide_fields = true

  const initialValues = {
    record_name: record_name,
    level: level,
    nameOfInstitute: nameOfInstitute,
    registrationNumber: registrationNumber,
    eduDocIssueDate: formatDateBgv(eduDocIssueDate),
    marksheet_file: initial_edu_file_url,
    grade: grade,
  };

  const { uuid: orgId } = useParams();

  let validationSchema = {}
  if (nameFlag) {
    validationSchema.record_name = Yup.string().required(`Name is required`)
  }
  if (registrationNumberFlag) {
    validationSchema.registrationNumber = Yup.string().required(`Registration number is required`)
  }
  if (nameOfInstituteFlag) {
    validationSchema.nameOfInstitute = Yup.string().required(`Institute Name is required`)
  }
  if (eduDocUrlFlag) {
    validationSchema.marksheet_file = Yup.mixed().required("File is required")
  }

  return (
    <div>
      <Formik
        enableReinitialize
        initialValues={{ ...initialValues }}
        onSubmit={async (values) => {
          props.setLoader(true);
          const { marksheet_file } = values;
          let payload = {
            eduDocIssueDate: moment(values.eduDocIssueDate).format('DD MMM YYYY'),
            grade: values.grade,
            level: values.level,
            nameOfInstitute: values.nameOfInstitute,
            registrationNumber: values.registrationNumber,
            record_name: values.record_name,
            "bgv_required": true
          };

          let updatedFile = "";

          if (marksheet_file instanceof File) {
            try {
              updatedFile = await getUrlFromFile(orgId, {
                uploadedFile: marksheet_file,
                label: "education_record_file",
                initialFile: eduDocUrl,
                entityId: props.entityId,
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
          props.setLoader(false);
          if (updatedFile) {
            payload.eduDocUrl = updatedFile;
          }
          if (nameFlag) {
            if (record_name === values.record_name) {
              props.addToast('error', 'Error', 'No changes detected')
            } else props.onSubmit({ "educationRecords": [payload] });
          } else if (registrationNumberFlag) {
            if (registrationNumber === values.registrationNumber) {
              props.addToast('error', 'Error', 'No changes detected')
            } else props.onSubmit({ "educationRecords": [payload] });
          } else if (nameOfInstituteFlag) {
            if (nameOfInstitute === values.nameOfInstitute) {
              props.addToast('error', 'Error', 'No changes detected')
            } else props.onSubmit({ "educationRecords": [payload] });
          } else if (eduDocUrlFlag) {
            if (updatedFile === "") {
              props.addToast('error', 'Error', 'No changes detected')
            } else props.onSubmit({ "educationRecords": [payload] });
          } else props.onSubmit({ "educationRecords": [payload] });
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
                  {!(buttonFlag) ? (
                    <FormikInput
                      name="level"
                      label="Level"
                      disabled
                      values={values}
                      errors={errors}
                      touched={touched}
                      handleChange={handleChange}
                      handleBlur={handleBlur}
                      className="col-md-12 mb-10"
                      autoComplete="off"
                    />
                  ) : null}
                  {nameFlag ? (
                    <FormikInput
                      name="record_name"
                      label="Name on Educational Certificate"
                      values={values}
                      errors={errors}
                      touched={touched}
                      handleChange={handleChange}
                      handleBlur={handleBlur}
                      className="col-md-12 mb-10"
                      autoComplete="off"
                    />
                  ) : null}
                  {nameOfInstituteFlag ? (
                    <FormikInput
                      name="nameOfInstitute"
                      label="Name of Institute"
                      values={values}
                      errors={errors}
                      touched={touched}
                      handleChange={handleChange}
                      handleBlur={handleBlur}
                      className="col-md-12 mb-10"
                      autoComplete="off"
                    />
                  ) : null}
                  {hide_fields ? null
                    : (
                      <>
                        <FormikInput
                          name="grade"
                          label="Grade"
                          values={values}
                          errors={errors}
                          touched={touched}
                          handleChange={handleChange}
                          handleBlur={handleBlur}
                          className="col-md-12 mb-10"
                          autoComplete="off"
                        />
                        <FormikInput
                          name="eduDocIssueDate"
                          label="Education Document Issue Date"
                          type="date"
                          values={values}
                          errors={errors}
                          touched={touched}
                          handleChange={handleChange}
                          handleBlur={handleBlur}
                          className="col-md-12 mb-10"
                          autoComplete="off"
                        />
                      </>
                    )}

                  {registrationNumberFlag ? (
                    <FormikInput
                      name="registrationNumber"
                      label="Registration Number"
                      values={values}
                      errors={errors}
                      touched={touched}
                      handleChange={handleChange}
                      handleBlur={handleBlur}
                      className="col-md-12 mb-10"
                      autoComplete="off"
                    />
                  ) : null}
                </div>
                {eduDocUrlFlag ? (
                  <FileInput
                    name="marksheet_file"
                    error={errors.marksheet_file}
                    touched={touched.marksheet_file}
                    onBlur={handleBlur}
                    setFieldValue={setFieldValue}
                    value={values.marksheet_file}
                    label="Choose Education document"
                  />
                ) : null}
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

export default EduRecordUpdate;
