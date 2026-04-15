import React from 'react';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Link } from 'react-router-dom';

import FormikInput from '../../components/UI/FormikInput';
import { Button } from '../../components/UI/AppButton/AppButton';
import Spinner from '../../components/UI/Spinner/Spinner';
import { toCamelCase } from '../utils';


const CreateModel = (props) => {

    return (
        <div className="config_add_group_form">
            {props.loader && (<Spinner />)}
            <div className="app_category_head">
                <p>Create Model</p>
            </div>
            <Formik
                enableReinitialize
                initialValues={props.initialState}
                onSubmit={(values) => {
                    props.saveData(values)
                }}
                validationSchema={Yup.object().shape({
                    name: Yup.string().required(`Model Name can't be empty`),
                    key: Yup.string().required(`Model Key can't be empty`)
                })}
            >
                {props => {
                    const { values, touched, errors, handleChange, handleBlur, handleSubmit, setFieldValue } = props;
                    return (
                        <div>
                            <div className="edit_app_detils_form_cont">
                                <div className="form_up_box">
                                    <FormikInput
                                        name="name"
                                        label="Name"
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        className="col-md-6"
                                        handleChange={(e) => {
                                            handleChange(e)
                                            setFieldValue('key', toCamelCase(e.target.value))
                                        }}
                                        handleBlur={handleBlur}
                                        autoComplete="off"
                                    />
                                    <FormikInput
                                        name="key"
                                        label="Key"
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        className="col-md-6"
                                        handleChange={handleChange}
                                        handleBlur={handleBlur}
                                        autoComplete="off"
                                    />
                                </div>
                            </div>
                            <div className="cancel_publish_btn">
                                <Link
                                    to="/master"
                                >
                                    <button
                                        type="button"
                                        className="fancy_btn"
                                    >
                                        Cancel
                                    </button>
                                </Link>
                                <Button
                                    variant="primary"
                                    onClick={handleSubmit}
                                >
                                    Save
                                </Button>
                            </div>
                        </div>
                    )
                }}
            </Formik>
        </div>
    )
}

export default CreateModel;