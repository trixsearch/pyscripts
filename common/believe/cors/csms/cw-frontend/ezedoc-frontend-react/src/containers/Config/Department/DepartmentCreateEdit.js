import React, { useState } from "react";
import Axios from "axios";
import { useParams } from "react-router-dom";

import Spinner from "components/UI/Spinner/Spinner";
import { handleError } from "store/authConfig";
import { DEPARTMENT_ERROR } from "store/actions/actionTypes";
import { useQueryParams } from "CustomHooks/usePagination";
import { connect } from "react-redux";
import { addToast } from "components/Toast/actions";
import DepartmentForm from "./DepartmentForm";

const APP_URL = process.env.REACT_APP_APP_URL;

const DepartmentCreateEdit = (props) => {
  const { history, match } = props;
  const { uuid: orgId } = useParams();

  const [loader, setloader] = useState(false);
  const [type] = useState(match.params.id ? "edit" : "create");

  const { next = 1 } = useQueryParams();

  const handleSubmit = (name, head, extra_fields) => {
    setloader(true);
    let payload;

    if (type === "create") {
      payload = {
        head,
        department: { name, extra_fields },
      };
    } else {
      let deptName = name ? { name } : {};
      payload = {
        head,
        department: { ...deptName, extra_fields },
      };
    }

    Axios({
      method: type === "create" ? "POST" : "PUT",
      url:
        type === "create"
          ? `${APP_URL}/${orgId}/departments/`
          : `${APP_URL}/${orgId}/departments/${match.params.id}`,
      data: payload,
    })
      .then((response) => {
        props.addToast("success", "Success", response.data.message);
        history.push(`/custom-workflow/org/${orgId}/config/department?page=${next}`);
      })
      .catch((err) => {
        handleError({
          error: err,
          payload: {},
          type: DEPARTMENT_ERROR,
          showToast: true,
        });
        setloader(false);
      });
  };

  const active = type === "edit" ? "Edit Department" : "Add Department";

  return (
    <div>
      {loader && <Spinner />}
      <div className="main_changable_container">
        <div className="config_add_group_form">
          <div className="app_category_head">
            <p>{active}</p>
          </div>
          <DepartmentForm
            edit={type === "edit"}
            id={match.params.id}
            saveData={handleSubmit}
            history={history}
            orgId={orgId}
          />
        </div>
      </div>
    </div>
  );
};

export default connect(null, { addToast })(DepartmentCreateEdit);
