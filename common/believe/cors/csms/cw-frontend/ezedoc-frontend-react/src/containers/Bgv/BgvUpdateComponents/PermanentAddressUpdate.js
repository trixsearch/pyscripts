import React from "react";
import { Formik } from "formik";
import * as Yup from "yup";

import FormikInput from "components/UI/FormikInput";
import { BgvUpdateFormActions } from "./BgvUpdateCommon";

import "./styles.css";

const PermanentAddressUpdate = (props) => {
  const {
    permanent_address_line,
    permanent_address_city,
    permanent_address_district,
    permanent_address_state,
    permanent_address_locality,
    permanent_address_landmark,
    permanent_address_pincode,
    entity_phone_number,
    alternatePhone
  } = props.data;

  const domainKey = props.domain_key || ""

  const initialValues = {
    permanent_address: permanent_address_line || "",
    locality: permanent_address_locality || "",
    landmark: permanent_address_landmark || "",
    city: permanent_address_city || "",
    district: permanent_address_district || "",
    state: permanent_address_state || "",
    pincode: permanent_address_pincode || "",
    entity_phone_number: entity_phone_number || "",
    alternatePhone: alternatePhone || ""
  };

  const addressFlag = domainKey === "i_permanent_address"
  const mobiileNumberFlag = domainKey === "i_mobile"
  const alternateMobileFlag = domainKey === "i_alternate_phone"
  const buttonFlag = !((addressFlag || mobiileNumberFlag || alternateMobileFlag))


  let validationSchema = {}
  if (addressFlag) {
    validationSchema.permanent_address = Yup.string().required(`Address is required`);
    validationSchema.locality = Yup.string().required(`Locality Name is required`);
    validationSchema.landmark = Yup.string().required(`Landmark Name is required`);
    validationSchema.city = Yup.string().required(`City Name is required`);
    validationSchema.district = Yup.string().required(`District Name is required`);
    validationSchema.state = Yup.string().required(`State Name is required`);
    validationSchema.pincode = Yup.string().required('Pincode is required');
  }

  let phoneNumberSchema = {}
  if (mobiileNumberFlag) {
    phoneNumberSchema = {
      entity_phone_number: Yup.string()
        .required(`Mobile Number is required`)
        .test('len', 'Please enter a valid 10 digit phone number', val => {
          let valid = false;
          let phoneno = /^\d{10}$/;
          if (val) valid = val.match(phoneno)
          return valid;
        })
        .nullable()
    }
  }

  let alternatePhoneNumberSchema = {}
  if (alternateMobileFlag) {
    alternatePhoneNumberSchema = {
      alternatePhone: Yup.string()
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
          let phone_number = values.entity_phone_number ? `+91${values.entity_phone_number}` : "";
          const payload = {
            permanent_address_line: values.permanent_address,
            permanent_address_city: values.city,
            permanent_address_district: values.district,
            permanent_address_state: values.state,
            permanent_address_locality: values.locality,
            permanent_address_landmark: values.landmark,
            permanent_address_pincode: values.pincode,
            entity_phone_number: phone_number,
            alternatePhone: values.alternatePhone
          };
          if (addressFlag) {
            if (permanent_address_line === values.permanent_address && permanent_address_city === values.city && permanent_address_district === values.district && permanent_address_state === values.state && permanent_address_locality === values.locality && permanent_address_landmark === values.landmark && permanent_address_pincode === values.pincode) {
              props.addToast('error', 'Error', 'No changes detected')
            } else props.onSubmit(payload);
          } else if (mobiileNumberFlag) {
            if (entity_phone_number === values.entity_phone_number) {
              props.addToast('error', 'Error', 'No changes detected')
            } else props.onSubmit(payload);
          } else if (alternateMobileFlag) {
            if (alternatePhone === values.alternatePhone) {
              props.addToast('error', 'Error', 'No changes detected')
            } else props.onSubmit(payload);
          } else props.onSubmit(payload);
        }}
        validationSchema={Yup.object().shape({ ...validationSchema, ...alternatePhoneNumberSchema, ...phoneNumberSchema })}
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
                  {addressFlag ? (
                    <>
                      <FormikInput
                        name="permanent_address"
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
                        name="locality"
                        label="Locality"
                        values={values}
                        errors={errors}
                        touched={touched}
                        handleChange={handleChange}
                        handleBlur={handleBlur}
                        className="col-md-12 mb-10"
                        autoComplete="off"
                      />
                      <FormikInput
                        name="landmark"
                        label="Landmark"
                        values={values}
                        errors={errors}
                        touched={touched}
                        handleChange={handleChange}
                        handleBlur={handleBlur}
                        className="col-md-12 mb-10"
                        autoComplete="off"
                      />
                      <FormikInput
                        name="city"
                        label="City"
                        values={values}
                        errors={errors}
                        touched={touched}
                        handleChange={handleChange}
                        handleBlur={handleBlur}
                        className="col-md-12 mb-10"
                        autoComplete="off"
                      />
                      <FormikInput
                        name="district"
                        label="District"
                        values={values}
                        errors={errors}
                        touched={touched}
                        handleChange={handleChange}
                        handleBlur={handleBlur}
                        className="col-md-12 mb-10"
                        autoComplete="off"
                      />
                      <FormikInput
                        name="state"
                        label="State"
                        values={values}
                        errors={errors}
                        touched={touched}
                        handleChange={handleChange}
                        handleBlur={handleBlur}
                        className="col-md-12 mb-10"
                        autoComplete="off"
                      />
                      <FormikInput
                        name="pincode"
                        label="Pincode"
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
                  {mobiileNumberFlag ? (
                    <FormikInput
                      name="entity_phone_number"
                      label="Mobile Number"
                      values={values}
                      errors={errors}
                      touched={touched}
                      handleChange={handleChange}
                      handleBlur={handleBlur}
                      className="col-md-12 mb-10"
                      autoComplete="off"
                    />
                  ) : null}
                  {alternateMobileFlag ? (
                    <FormikInput
                      name="alternatePhone"
                      label="Alternate Mobile Number"
                      values={values}
                      errors={errors}
                      touched={touched}
                      handleChange={handleChange}
                      handleBlur={handleBlur}
                      className="col-md-12 mb-10"
                      autoComplete="off"
                    />
                  ) : null}
                  {buttonFlag ? (
                    <h5 style={{ textAlign: "center" }}>To resolve this insufficiency please email the required details to the service provider.</h5>
                  ) : null}
                </div>
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

export default PermanentAddressUpdate;
