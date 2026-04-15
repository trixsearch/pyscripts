// external components
import React from "react";

// Icon Constants
const IconConstants = {
  profile_create: "glyphicon glyphicon-ok",
  profile_update: "glyphicon glyphicon-pencil",
  profile_update_approve: "glyphicon glyphicon-thumbs-up",
  userTask: "glyphicon glyphicon-user"
};

const IconChooser = ({ type }) => (
  <span className={IconConstants[type] || "glyphicon glyphicon-ok"} />
);
export default IconChooser;
