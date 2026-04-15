import React from "react";
import { Formik } from "formik";
import * as Yup from "yup";

import FormikInput from "components/UI/FormikInput";
import { BgvUpdateFormActions } from "./BgvUpdateCommon";

import "./styles.css";

const ProReferenceUpdate = (props) => {
  const {
    referenceProviderName = "",
    referenceProviderEmail = "",
    organisation = "",
    referenceType = "",
    referenceProviderPhone = "",
    individualDesignation = "",
    startYearOfAssociation = "",
    endYearOfAssociation = "",
  } = (!!props.data?.professional_reference.length && props.data.professional_reference[0]) || {};

  const domainKey = props.domain_key || ""

  const initialValues = {
    endYearOfAssociation,
    individualDesignation,
    organisation,
    referenceProviderEmail,
    referenceProviderName,
    referenceProviderPhone,
    referenceType,
    startYearOfAssociation,
  };

  const referenceProviderNameFlag = domainKey === "i_name"
  const referenceProviderEmailFlag = domainKey === "i_prc_email"
  const referenceProviderPhoneFlag = domainKey === "i_prc_phone"
  // TODO : Once we have update funcationality available we will use this buttonflag
  // const buttonFlag = (referenceProviderNameFlag || referenceProviderEmailFlag || referenceProviderPhoneFlag) ? false : true
  const hide_fields = true

  let validationSchema = {}
  if (referenceProviderNameFlag) {
    validationSchema.referenceProviderName = Yup.string().required('Reference Provider Name is required')
  }
  if (referenceProviderEmail) {
    validationSchema.referenceProviderEmail = Yup.string().email().required('Reference Provider email is required')
  }

  let phoneNumberSchema = {}
  if (referenceProviderPhoneFlag) {
    phoneNumberSchema = {
      referenceProviderPhone: Yup.string()
        .required(`Mobile Number is required`)
        .test('len', 'Please enter a valid 10 digit mobile number', val => {
          let valid = false;
          let phoneno = /^\d{10}$/;
          if (val) valid = val.match(phoneno)
          return valid;
        })
        .nullable(),
    }
  }

  return (
    <div>
      <Formik
        enableReinitialize
        initialValues={{ ...initialValues }}
        onSubmit={(values) => {
          const payload = {
            referenceProviderName: values.referenceProviderName,
            referenceProviderPhone: values.referenceProviderPhone,
            referenceType: values.referenceType,
            referenceProviderEmail: values.referenceProviderEmail,
            startYearOfAssociation: values.startYearOfAssociation,
            endYearOfAssociation: values.endYearOfAssociation,
            organisation: values.organisation,
            individualDesignation: values.individualDesignation,
            "bgv_required": true
          };
          if (referenceProviderNameFlag) {
            if (referenceProviderName === values.referenceProviderName) {
              props.addToast('error', 'Error', 'No changes detected')
            } else props.onSubmit({ "professionalReferences": [payload] });
          } else if (referenceProviderEmailFlag) {
            if (referenceProviderEmail === values.referenceProviderEmail) {
              props.addToast('error', 'Error', 'No changes detected')
            } else props.onSubmit({ "professionalReferences": [payload] });
          } else if (referenceProviderPhoneFlag) {
            if (referenceProviderPhone === values.referenceProviderPhone) {
              props.addToast('error', 'Error', 'No changes detected')
            } else props.onSubmit({ "professionalReferences": [payload] });
          } else props.onSubmit({ "professionalReferences": [payload] });
        }}
        validationSchema={Yup.object().shape({ ...validationSchema, ...phoneNumberSchema })}
      >
        {(formikProps) => {
          const {
            values,
            touched,
            errors,
            handleChange,
            handleBlur,
            handleSubmit,
          } = formikProps;
          return (
            <>
              <form>
                <div className="form_up_box bgv-modal">
                  <FormikInput
                    name="referenceProviderName"
                    label="Reference Provider Name"
                    values={values}
                    errors={errors}
                    touched={touched}
                    disabled={!(referenceProviderNameFlag)}
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                    className="col-md-12 mb-10"
                    autoComplete="off"
                  />
                  <FormikInput
                    name="organisation"
                    label="Organisation"
                    values={values}
                    errors={errors}
                    touched={touched}
                    disabled
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                    className="col-md-12 mb-10"
                    autoComplete="off"
                  />
                  {referenceProviderEmailFlag ? (
                    <FormikInput
                      name="referenceProviderEmail"
                      label="Reference Provider Email"
                      values={values}
                      disabled
                      type="email"
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
                      <div className="floating-label col-md-12 mb-6">
                        <label className="react-select-label">Reference type</label>
                        <select
                          onChange={handleChange}
                          onBlur={handleBlur}
                          name="referenceType"
                          className={(touched.referenceType && errors.referenceType) ? 'floating-select Invalid' : "floating-select"}
                          value={values.referenceType || ""}
                        >
                          <option disabled value="">Select a reference type</option>
                          <option value="Academic">Academic</option>
                          <option value="Professional">Professional</option>
                        </select>
                      </div>
                      {/* <FormikInput
                        name="referenceType"
                        label="Reference Type"
                        values={values}
                        errors={errors}
                        touched={touched}
                        handleChange={handleChange}
                        handleBlur={handleBlur}
                        className="col-md-12 mb-10"
                        autoComplete="off"
                      /> */}
                      <FormikInput
                        name="individualDesignation"
                        label="Individual Designation"
                        values={values}
                        errors={errors}
                        touched={touched}
                        handleChange={handleChange}
                        handleBlur={handleBlur}
                        className="col-md-12 mb-10"
                        autoComplete="off"
                      />
                      <FormikInput
                        name="startYearOfAssociation"
                        label="Start year of Association"
                        values={values}
                        errors={errors}
                        touched={touched}
                        handleChange={handleChange}
                        handleBlur={handleBlur}
                        className="col-md-6 mb-10"
                        autoComplete="off"
                      />
                      <FormikInput
                        name="endYearOfAssociation"
                        label="End year of Association"
                        values={values}
                        errors={errors}
                        touched={touched}
                        handleChange={handleChange}
                        handleBlur={handleBlur}
                        className="col-md-6 mb-10"
                        autoComplete="off"
                      />
                    </>
                  )}
                  {referenceProviderPhoneFlag ? (
                    <FormikInput
                      name="referenceProviderPhone"
                      label="Reference Provider Phone"
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
                <h5 style={{ textAlign: "center" }}>To resolve this insufficiency please email the required details to the service provider.</h5>
              </form>
              <BgvUpdateFormActions
                onClose={props.onClose}
                onSubmit={handleSubmit}
                disabled
              />
            </>
          );
        }}
      </Formik>
    </div>
  );
};

export default ProReferenceUpdate;
