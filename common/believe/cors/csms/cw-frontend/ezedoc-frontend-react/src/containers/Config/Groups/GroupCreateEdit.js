import React, { useState } from "react";
import { connect } from "react-redux";
import Axios from "axios";
import { useParams } from "react-router-dom";

import Spinner from "components/UI/Spinner/Spinner";
import { addToast } from "components/Toast/actions";
import { GROUP_ERROR } from "store/actions/actionTypes";
import { useQueryParams } from "CustomHooks/usePagination";
import { handleError } from "store/authConfig";
import GroupForm from "./GroupForm";
import { HasAccess } from "../../../platformDataStoreContext";
import UnauthorizedPage from "../../UnauthorizedPage";
import { CW_SERVICE_GROUP_CREATE, CW_SERVICE_GROUP_UPDATE } from "../../../Data/constants";

const APP_URL = process.env.REACT_APP_APP_URL;

const GroupCreateEdit = (props) => {
  const { history, match } = props;

  const [loader, setloader] = useState(false);
  const [type] = useState(match.params.id ? "edit" : "create");

  const { uuid: orgId } = useParams();
  const { next = 1 } = useQueryParams();

  const handleSubmit = (data) => {
    setloader(true);
    let payload = {
      name: data.name,
      users: data.users,
      filter_by: data.filterBy,
    };

    Axios({
      method: type === "create" ? "POST" : "PUT",
      url:
        type === "create" ? `${APP_URL}/${orgId}/groups/` : `${APP_URL}/${orgId}/groups/${match.params.id}`,
      data: payload,
    })
      .then((response) => {
        props.addToast("success", "Success", response.data.message);
        history.push(`/custom-workflow/org/${orgId}/config/groups?page=${next}`);
      })
      .catch((err) => {
        handleError({
          error: err,
          payload: {},
          type: GROUP_ERROR,
          showToast: true,
        });
        setloader(false);
      });
  };

  const active = type === "edit" ? "Edit Group" : "Add Group";

  const RenderGroupForm = () => {
    return (
      <div>
        <div className="app_category_head">
            <p>{active}</p>
          </div>
          <GroupForm
            edit={type === "edit"}
            saveGroup={handleSubmit}
            id={match.params.id}
            history={history}
            next={next}
          />
      </div>
    )
  }

  return (
    <>
      {loader && <Spinner />}
      <div className="main_changable_container">
        <div className="config_add_group_form">
          {type === "edit" && (
            <HasAccess
              permissions={[CW_SERVICE_GROUP_UPDATE]}
              yes={() => (
                <RenderGroupForm />
              )}
              no={() => (
                <UnauthorizedPage />
              )}
            />
          )}
          {type !== "edit" && (
            <HasAccess
              permissions={[CW_SERVICE_GROUP_CREATE]}
              yes={() => (
                <RenderGroupForm />
              )}
              no={() => (
                <UnauthorizedPage />
              )}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default connect(null, { addToast: addToast })(GroupCreateEdit);
