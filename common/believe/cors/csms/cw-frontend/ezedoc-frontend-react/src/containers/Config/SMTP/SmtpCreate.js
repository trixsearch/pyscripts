import React from 'react';
import { connect } from 'react-redux';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useParams } from 'react-router-dom';

import { createSMTP, testSMTP } from '../../../store/actions/index';
import Spinner from '../../../components/UI/Spinner/Spinner';
import { Button } from '../../../components/UI/AppButton/AppButton';
import FormikInput from '../../../components/UI/FormikInput';

const SmtpCreate = (props) => {
  const { uuid: orgId } = useParams();
  const {
    host, encryption, port, password, username, email
  } = props.smtp;
  const {
    editPermission, loader, isTested
  } = props;

  return (
    <Formik
      enableReinitialize
      initialValues={{
        encryption: encryption || 1, password, username, email, host, port: port || "", isTested
      }}
      onSubmit={(values) => {
        props.createSMTP(orgId, values)
      }}
      validationSchema={Yup.object().shape({
        host: Yup.string().required(`Host can't be empty`),
        port: Yup.string().required(`Port can't be empty`),
        username: Yup.string().required(`User name can't be empty`),
        password: Yup.string().required(`Password can't be empty`),
        email: Yup.string().email().required(`Email address can't be empty`)
      })}
    >
      {formikProps => {
        const {
          values, touched, errors, handleChange, validateForm, setTouched, handleBlur,
          handleSubmit, dirty
        } = formikProps;
        return (
          <>
            {!!loader && (<Spinner />)}
            <div className="edit_app_detils_form_cont">
              <form autoComplete="off">
                <div className="form_up_box">
                  <FormikInput
                    name="host"
                    type="text"
                    label="Host"
                    values={values}
                    errors={errors}
                    touched={touched}
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                    autoComplete="off"
                    className="col-md-6 smtp-port-input"
                    data-cy="host"
                  />
                  <div className="floating-label col-md-6" style={{ marginTop: "5px" }}>
                    <select data-cy="protocol" onChange={handleChange} name="encryption" className="floating-select" value={values.encryption}>
                      <option value="1">TLS</option>
                      <option value="2">SSL</option>
                    </select>
                    <label>Protocol</label>
                  </div>
                  <FormikInput
                    type="text"
                    name="port"
                    label='Port'
                    values={values}
                    errors={errors}
                    touched={touched}
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                    autoComplete="off"
                    className="col-md-4 smtp-port-input"
                    data-cy="port"
                  />
                </div>
                <div className="form_up_box" style={{ paddingTop: 8 }}>
                  <FormikInput
                    type="text"
                    name="username"
                    label='User Name'
                    values={values}
                    errors={errors}
                    touched={touched}
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                    autoComplete="new-password"
                    className="col-md-6"
                    data-cy="username"
                  />
                  <FormikInput
                    name="password"
                    type='password'
                    label="Password"
                    values={values}
                    errors={errors}
                    touched={touched}
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                    autoComplete="new-password"
                    className="col-md-6"
                    data-cy="password"
                  />
                  <FormikInput
                    name="email"
                    type="text"
                    label="From Email"
                    values={values}
                    errors={errors}
                    touched={touched}
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                    autoComplete="new-password"
                    className="col-md-6 lowercase"
                    data-cy="from-email"
                  />
                </div>
              </form>
            </div>
            {!!editPermission && (
              <div className="pt-0 cancel_publish_btn">
                <Button
                  variant="secondary"
                  onClick={() => {
                    validateForm().then(fields => {
                      if (!Object.keys(fields).length)
                        return props.testSMTP(orgId, values)
                      return setTouched(
                        {
                          host: true,
                          port: true,
                          username: true,
                          password: true,
                          email: true
                        }
                      )
                    })
                  }}
                >
                  Test
                </Button>
                <Button variant="primary" disabled={!values.isTested || dirty} onClick={handleSubmit}>Save</Button>
              </div>
            )}
          </>
        )
      }}
    </Formik>
  )
}
const mapStateToProps = (state) => ({
  loader: state.Smtp.loader,
  data: state.Smtp.data,
  editPermission: state.auth.uiPermissions.smtpsettings.change,
  isTested: state.Smtp.isTested,
  smtp: state.Smtp.smtp_values
})

const mapDispatchToProps = (dispatch) => ({
  createSMTP: (orgId, data) => dispatch(createSMTP(orgId, data)),
  testSMTP: (orgId, data) => dispatch(testSMTP(orgId, data))
});

export default connect(mapStateToProps, mapDispatchToProps)(SmtpCreate);
