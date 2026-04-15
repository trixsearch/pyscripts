import React from "react";
import { Formik } from "formik";
import * as Yup from "yup";

import FormikInput from "components/UI/FormikInput";
import { BgvUpdateFormActions } from "./BgvUpdateCommon";

import "./styles.css";

const CCRVUpdate = (props) => {
  const {
    entity_name,
    father_name,

    present_address_line,
    present_address_city,
    present_address_district,
    present_address_state,
    present_address_locality,
    present_address_landmark,
    present_address_pincode,

    permanent_address_line,
    permanent_address_city,
    permanent_address_district,
    permanent_address_state,
    permanent_address_locality,
    permanent_address_landmark,
    permanent_address_pincode,
  } = props.data;

  const domainKey = props.domain_key || ""
  const initialValues = {
    entity_name,
    father_name,

    present_address_line,
    present_address_city,
    present_address_district,
    present_address_state,
    present_address_locality,
    present_address_landmark,
    present_address_pincode,

    permanent_address_line,
    permanent_address_city,
    permanent_address_district,
    permanent_address_state,
    permanent_address_locality,
    permanent_address_landmark,
    permanent_address_pincode,
  }

  const nameFlag = domainKey === "i_name"
  const fatherNameFlag = domainKey === "i_fathername"
  const presentAddressFlag = domainKey === "i_current_address"
  const permanentAddressFlag = domainKey === "i_permanent_address"
  const buttonFlag = !((nameFlag || fatherNameFlag || presentAddressFlag || permanentAddressFlag))

  let validationSchema = {}
  if (nameFlag) {
    validationSchema.entity_name = Yup.string().required('Entity Name is required')
  }
  if (fatherNameFlag) {
    validationSchema.father_name = Yup.string().required('Father Name is required')
  }
  if (presentAddressFlag) {
    validationSchema.present_address_line = Yup.string().required('Present address is required').nullable()
    validationSchema.present_address_city = Yup.string().required('Present city is required').nullable()
    validationSchema.present_address_district = Yup.string().required('Present district is required').nullable()
    validationSchema.present_address_state = Yup.string().required('Present state is required').nullable()
    validationSchema.present_address_locality = Yup.string().required('Present address locality is required').nullable()
    validationSchema.present_address_landmark = Yup.string().required('Present address locality is required').nullable()
    validationSchema.present_address_pincode = Yup.string().required('Present address locality is required').nullable()
  }
  if (permanentAddressFlag) {
    validationSchema.permanent_address_line = Yup.string().required('Permanent address is required').nullable()
    validationSchema.permanent_address_city = Yup.string().required('Permanent address city is required').nullable()
    validationSchema.permanent_address_district = Yup.string().required('Permanent address district is required').nullable()
    validationSchema.permanent_address_state = Yup.string().required('Permanent address state is required').nullable()
    validationSchema.permanent_address_locality = Yup.string().required('Permanent address locality is required').nullable()
    validationSchema.permanent_address_landmark = Yup.string().required('Permanent address landmark is required').nullable()
    validationSchema.permanent_address_pincode = Yup.string().required('Permanent address pincode is required').nullable()
  }

  return (
    <div>
      <Formik
        enableReinitialize
        initialValues={{ ...initialValues }}
        onSubmit={(values) => {
          if (nameFlag) {
            if (entity_name === values.entity_name) {
              props.addToast('error', 'Error', 'No changes detected')
            } else props.onSubmit(values);
          } else if (fatherNameFlag) {
            if (father_name === values.father_name) {
              props.addToast('error', 'Error', 'No changes detected')
            } else props.onSubmit(values);
          } else if (presentAddressFlag) {
            if (present_address_line === values.present_address_line && present_address_city === values.present_address_city && present_address_district === values.present_address_district && present_address_state === values.present_address_state && present_address_locality === values.present_address_locality && present_address_landmark === values.present_address_landmark && present_address_pincode === values.present_address_pincode) {
              props.addToast('error', 'Error', 'No changes detected')
            } else props.onSubmit(values);
          } else if (permanentAddressFlag) {
            if (permanent_address_line === values.permanent_address_line && permanent_address_city === values.permanent_address_city && permanent_address_district === values.permanent_address_district && permanent_address_state === values.permanent_address_state && permanent_address_locality === values.permanent_address_locality && permanent_address_landmark === values.permanent_address_landmark && permanent_address_pincode === values.permanent_address_pincode) {
              props.addToast('error', 'Error', 'No changes detected')
            } else props.onSubmit(values);
          } else props.onSubmit(values);
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
          } = formikProps;
          return (
            <>
              <form>
                <div className="form_up_box bgv-modal">
                  {nameFlag ? (
                    <FormikInput
                      name="entity_name"
                      label="Entity Name"
                      values={values}
                      errors={errors}
                      touched={touched}
                      handleChange={handleChange}
                      handleBlur={handleBlur}
                      className="col-md-12 mb-10"
                      autoComplete="off"
                    />
                  ) : null}
                  {fatherNameFlag ? (
                    <FormikInput
                      name="father_name"
                      label="Father Name"
                      values={values}
                      errors={errors}
                      touched={touched}
                      handleChange={handleChange}
                      handleBlur={handleBlur}
                      className="col-md-12 mb-10"
                      autoComplete="off"
                    />
                  ) : null}
                  {presentAddressFlag ? (
                    <>
                      <FormikInput
                        name="present_address_line"
                        label="Present Address"
                        values={values}
                        errors={errors}
                        touched={touched}
                        handleChange={handleChange}
                        handleBlur={handleBlur}
                        className="col-md-12 mb-10"
                        autoComplete="off"
                      />
                      <FormikInput
                        name="present_address_city"
                        label="Present Address City"
                        values={values}
                        errors={errors}
                        touched={touched}
                        handleChange={handleChange}
                        handleBlur={handleBlur}
                        className="col-md-12 mb-10"
                        autoComplete="off"
                      />
                      <FormikInput
                        name="present_address_district"
                        label="Present Address District"
                        values={values}
                        errors={errors}
                        touched={touched}
                        handleChange={handleChange}
                        handleBlur={handleBlur}
                        className="col-md-12 mb-10"
                        autoComplete="off"
                      />
                      <FormikInput
                        name="present_address_state"
                        label="Present Address State"
                        values={values}
                        errors={errors}
                        touched={touched}
                        handleChange={handleChange}
                        handleBlur={handleBlur}
                        className="col-md-12 mb-10"
                        autoComplete="off"
                      />
                      <FormikInput
                        name="present_address_locality"
                        label="Present address locality"
                        values={values}
                        errors={errors}
                        touched={touched}
                        handleChange={handleChange}
                        handleBlur={handleBlur}
                        className="col-md-12 mb-10"
                        autoComplete="off"
                      />
                      <FormikInput
                        name="present_address_landmark"
                        label="Present address landmark"
                        values={values}
                        errors={errors}
                        touched={touched}
                        handleChange={handleChange}
                        handleBlur={handleBlur}
                        className="col-md-12 mb-10"
                        autoComplete="off"
                      />
                      <FormikInput
                        name="present_address_pincode"
                        label="Present address pincode"
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
                  {permanentAddressFlag ? (
                    <>
                      <FormikInput
                        name="permanent_address_line"
                        label="Permanent Address"
                        values={values}
                        errors={errors}
                        touched={touched}
                        handleChange={handleChange}
                        handleBlur={handleBlur}
                        className="col-md-12 mb-10"
                        autoComplete="off"
                      />
                      <FormikInput
                        name="permanent_address_city"
                        label="Permanent Address City"
                        values={values}
                        errors={errors}
                        touched={touched}
                        handleChange={handleChange}
                        handleBlur={handleBlur}
                        className="col-md-12 mb-10"
                        autoComplete="off"
                      />
                      <FormikInput
                        name="permanent_address_district"
                        label="Permanent Address District"
                        values={values}
                        errors={errors}
                        touched={touched}
                        handleChange={handleChange}
                        handleBlur={handleBlur}
                        className="col-md-12 mb-10"
                        autoComplete="off"
                      />
                      <FormikInput
                        name="permanent_address_state"
                        label="Permanent Address State"
                        values={values}
                        errors={errors}
                        touched={touched}
                        handleChange={handleChange}
                        handleBlur={handleBlur}
                        className="col-md-12 mb-10"
                        autoComplete="off"
                      />
                      <FormikInput
                        name="permanent_address_locality"
                        label="Permanent address locality"
                        values={values}
                        errors={errors}
                        touched={touched}
                        handleChange={handleChange}
                        handleBlur={handleBlur}
                        className="col-md-12 mb-10"
                        autoComplete="off"
                      />
                      <FormikInput
                        name="permanent_address_landmark"
                        label="Permanent address landmark"
                        values={values}
                        errors={errors}
                        touched={touched}
                        handleChange={handleChange}
                        handleBlur={handleBlur}
                        className="col-md-12 mb-10"
                        autoComplete="off"
                      />
                      <FormikInput
                        name="permanent_address_pincode"
                        label="Permanent address pincode"
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

export default CCRVUpdate;
