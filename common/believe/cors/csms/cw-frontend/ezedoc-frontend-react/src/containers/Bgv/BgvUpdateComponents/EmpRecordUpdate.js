import React from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import moment from "moment";

import FormikInput from "components/UI/FormikInput";
import { getUrlFromFile } from "containers/utils";
import { useParams } from "react-router-dom";
import { BgvUpdateFormActions, FileInput, formatDateBgv } from "./BgvUpdateCommon";

import "./styles.css";

const checkFile = (fileData) => {
  if (fileData && fileData.length) {
    return fileData[0].url || "";
  }
  return "";
};

const EmpRecordUpdate = (props) => {
  const {
    annualCompensation = "",
    employerName = "",
    joiningDate = "",
    lastDesignation = "",
    lastWorkingCity = "",
    lastWorkingDate = "",
    record_name = "",
    appointmentletter = "",
    experienceletter = "",
    salaryslip = "",
    previousEmployeeId = "",
    previousManagerEmail = "",
    previousManagerPhone = ""
  } = (!!props.data?.previous_employment_record.length && props.data.previous_employment_record[0]) || {};

  const domainKey = props.domain_key || ""

  const initialValues = {
    annualCompensation,
    employerName,
    joiningDate: formatDateBgv(joiningDate),
    lastDesignation,
    lastWorkingCity: lastWorkingCity,
    lastWorkingDate: formatDateBgv(lastWorkingDate),
    record_name,
    salary_slips_file: checkFile(salaryslip),
    appointment_letter: checkFile(appointmentletter),
    exp_letter: checkFile(experienceletter),
    previousEmployeeId,
    previousManagerEmail,
    previousManagerPhone
  };

  const { uuid: orgId } = useParams();

  const recordNameFlag = domainKey === "i_name"
  const annualCompensationFlag = domainKey === "i_emp_compensation"
  const previousEmployeeIdFlag = domainKey === "i_emp_employeeid"
  const lastWorkingDateFlag = domainKey === "i_emp_last_working_date"
  const joiningDateFlag = domainKey === "i_emp_joining_date"
  const previousManagerEmailFlag = domainKey === "i_emp_manager_email"
  const previousManagerPhoneFlag = domainKey === "i_emp_manager_phone"
  const appointmentletterFlag = domainKey === "i_emp_appointment_letter"
  const experienceLetterFlag = domainKey === "i_emp_experience_letter"
  const salarySlipFlage = domainKey === "i_emp_salary_slip"
  const buttonFlag = !((recordNameFlag || annualCompensationFlag || previousEmployeeIdFlag || joiningDateFlag || previousManagerEmailFlag || previousManagerPhoneFlag || appointmentletterFlag || salarySlipFlage || experienceLetterFlag))
  const hide_fields = true
  let validationSchema = {}
  if (recordNameFlag) {
    validationSchema.record_name = Yup.string().required(`Name is required`)
  }
  if (annualCompensationFlag) {
    validationSchema.annualCompensation = Yup.string().required(`Annual Compensation is required`)
  }
  if (previousEmployeeIdFlag) {
    validationSchema.previousEmployeeId = Yup.string().required(`Employee Id is required`)
  }
  if (joiningDateFlag) {
    validationSchema.joiningDate = Yup.string().required(`Joining Date is required`)
  }
  if (previousManagerEmailFlag) {
    validationSchema.previousManagerEmail = Yup.string().email().required(`Previous Manager Email is required`).nullable()
  }
  if (previousManagerPhoneFlag) {
    validationSchema.previousManagerPhone = Yup.string().required(`Previous Manager Phone is required`)
  }
  if (appointmentletterFlag) {
    validationSchema.appointment_letter = Yup.mixed().required("File is required")
  }
  if (salarySlipFlage) {
    validationSchema.salary_slips_file = Yup.mixed().required("File is required")
  }
  if (experienceLetterFlag) {
    validationSchema.exp_letter = Yup.mixed().required("File is required")
  }

  return (
    <div>
      <Formik
        enableReinitialize
        initialValues={{ ...initialValues }}
        onSubmit={async (values) => {
          props.setLoader(true);
          const { salary_slips_file, appointment_letter, exp_letter } = values;
          let payload = {
            employerName: values.employerName,
            lastDesignation: values.lastDesignation,
            lastWorkingCity: values.lastWorkingCity,
            joiningDate: moment(values.joiningDate).format('DD MMM YYYY'),
            lastWorkingDate: lastWorkingDate,
            annualCompensation: values.annualCompensation,
            record_name: values.record_name,
            bgv_required: true,
            previousEmployeeId: values.previousEmployeeId,
            previousManagerEmail: values.previousManagerEmail,
            previousManagerPhone: values.previousManagerPhone
          };

          let updatedSalarySlips = "";

          if (salary_slips_file instanceof File) {
            try {
              updatedSalarySlips = await getUrlFromFile(orgId, {
                uploadedFile: salary_slips_file,
                label: "salary_slips",
                initialFile: initialValues.salary_slips_file,
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

          let updatedAptLetter = "";
          if (appointment_letter instanceof File) {
            try {
              updatedAptLetter = await getUrlFromFile(orgId, {
                uploadedFile: appointment_letter,
                label: "appointment_letter",
                initialFile: initialValues.appointment_letter,
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

          let updatedExpLetter = "";
          if (exp_letter instanceof File) {
            try {
              updatedExpLetter = await getUrlFromFile(orgId, {
                uploadedFile: exp_letter,
                label: "exp_letter",
                initialFile: initialValues.exp_letter,
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
          if (updatedSalarySlips) payload.salaryslip = updatedSalarySlips;
          if (updatedExpLetter) payload.experienceletter = updatedExpLetter;
          if (updatedAptLetter) payload.appointmentletter = updatedAptLetter;

          if (recordNameFlag) {
            if (record_name === values.record_name) {
              props.addToast('error', 'Error', 'No changes detected')
            } else props.onSubmit({ "employmentRecords": [payload] });
          } else if (annualCompensationFlag) {
            if (annualCompensation === values.annualCompensation) {
              props.addToast('error', 'Error', 'No changes detected')
            } else props.onSubmit({ "employmentRecords": [payload] });
          } else if (previousEmployeeIdFlag) {
            if (previousEmployeeId === values.previousEmployeeId) {
              props.addToast('error', 'Error', 'No changes detected')
            } else props.onSubmit({ "employmentRecords": [payload] });
          } else if (joiningDateFlag) {
            if (joiningDate === moment(values.joiningDate).format('DD MMM YYYY')) {
              props.addToast('error', 'Error', 'No changes detected')
            } else props.onSubmit({ "employmentRecords": [payload] });
          } else if (previousManagerEmailFlag) {
            if (previousManagerEmail === values.previousManagerEmail) {
              props.addToast('error', 'Error', 'No changes detected')
            } else props.onSubmit({ "employmentRecords": [payload] });
          } else if (previousManagerPhoneFlag) {
            if (previousManagerPhone === values.previousManagerPhone) {
              props.addToast('error', 'Error', 'No changes detected')
            } else props.onSubmit({ "employmentRecords": [payload] });
          } else if (appointmentletterFlag) {
            if (updatedAptLetter === "") {
              props.addToast('error', 'Error', 'No changes detected')
            } else props.onSubmit({ "employmentRecords": [payload] });
          } else if (salarySlipFlage) {
            if (updatedSalarySlips === "") {
              props.addToast('error', 'Error', 'No changes detected')
            } else props.onSubmit({ "employmentRecords": [payload] });
          } else if (experienceLetterFlag) {
            if (updatedExpLetter === "") {
              props.addToast('error', 'Error', 'No changes detected')
            } else props.onSubmit({ "employmentRecords": [payload] });
          } else props.onSubmit({ "employmentRecords": [payload] });
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
                  {(!(buttonFlag) || lastWorkingDateFlag) ? (
                    <FormikInput
                      name="employerName"
                      label="Employer Name"
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
                  {recordNameFlag ? (
                    <FormikInput
                      name="record_name"
                      label="Name on Employment Document"
                      values={values}
                      errors={errors}
                      touched={touched}
                      handleChange={handleChange}
                      handleBlur={handleBlur}
                      className="col-md-12 mb-10"
                      autoComplete="off"
                    />
                  ) : null}
                  {hide_fields ? null : (
                    <>
                      <FormikInput
                        name="lastDesignation"
                        label="Last Designation"
                        values={values}
                        errors={errors}
                        touched={touched}
                        handleChange={handleChange}
                        handleBlur={handleBlur}
                        className="col-md-12 mb-10"
                        autoComplete="off"
                      />
                      <FormikInput
                        name="lastWorkingCity"
                        label="Last Working City"
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
                  {joiningDateFlag ? (
                    <FormikInput
                      name="joiningDate"
                      label="Joining Date"
                      type="date"
                      values={values}
                      errors={errors}
                      touched={touched}
                      handleChange={handleChange}
                      handleBlur={handleBlur}
                      className="col-md-6 mb-10"
                      autoComplete="off"
                    />
                  ) : null}
                  {lastWorkingDateFlag ? (
                    <FormikInput
                      name="lastWorkingDate"
                      label="Last Working Date"
                      type="date"
                      disabled
                      values={values}
                      errors={errors}
                      touched={touched}
                      handleChange={handleChange}
                      handleBlur={handleBlur}
                      className="col-md-6 mb-10"
                      autoComplete="off"
                    />
                  ) : null}
                  {annualCompensationFlag ? (
                    <FormikInput
                      name="annualCompensation"
                      label="Annual Compensation"
                      values={values}
                      errors={errors}
                      touched={touched}
                      handleChange={handleChange}
                      handleBlur={handleBlur}
                      className="col-md-12 mb-10"
                      autoComplete="off"
                    />
                  ) : null}
                  {previousEmployeeIdFlag ? (
                    <FormikInput
                      name="previousEmployeeId"
                      label="Employee Id"
                      values={values}
                      errors={errors}
                      touched={touched}
                      handleChange={handleChange}
                      handleBlur={handleBlur}
                      className="col-md-12 mb-10"
                      autoComplete="off"
                    />
                  ) : null}
                  {previousManagerEmailFlag ? (
                    <FormikInput
                      name="previousManagerEmail"
                      label="Manager Email"
                      values={values}
                      type="email"
                      errors={errors}
                      touched={touched}
                      handleChange={handleChange}
                      handleBlur={handleBlur}
                      className="col-md-12 mb-10"
                      autoComplete="off"
                    />
                  ) : null}
                  {previousManagerPhoneFlag ? (
                    <FormikInput
                      name="previousManagerPhone"
                      label="Manager Phone Number"
                      values={values}
                      type="email"
                      errors={errors}
                      touched={touched}
                      handleChange={handleChange}
                      handleBlur={handleBlur}
                      className="col-md-12 mb-10"
                      autoComplete="off"
                    />
                  ) : null}
                </div>
                {salarySlipFlage ? (
                  <FileInput
                    name="salary_slips_file"
                    error={errors.salary_slips_file}
                    touched={touched.salary_slips_file}
                    onBlur={handleBlur}
                    setFieldValue={setFieldValue}
                    value={values.salary_slips_file}
                    label="Choose Salary slip"
                  />
                ) : null}
                {appointmentletterFlag ? (
                  <FileInput
                    name="appointment_letter"
                    error={errors.appointment_letter}
                    touched={touched.appointment_letter}
                    onBlur={handleBlur}
                    setFieldValue={setFieldValue}
                    value={values.appointment_letter}
                    label="Choose Appointment letter"
                  />
                ) : null}
                {experienceLetterFlag ? (
                  <FileInput
                    name="exp_letter"
                    error={errors.exp_letter}
                    touched={touched.exp_letter}
                    onBlur={handleBlur}
                    setFieldValue={setFieldValue}
                    value={values.exp_letter}
                    label="Choose Experience letter"
                  />
                ) : null}
                {(buttonFlag || lastWorkingDateFlag) ? (
                  <h5 style={{ textAlign: "center" }}>To resolve this insufficiency please email the required details to the service provider.</h5>
                ) : null}
              </form>
              <BgvUpdateFormActions
                onClose={props.onClose}
                onSubmit={handleSubmit}
                disabled={!!((buttonFlag || lastWorkingDateFlag))}
              />
            </>
          );
        }}
      </Formik>
    </div>
  );
};

export default EmpRecordUpdate;
