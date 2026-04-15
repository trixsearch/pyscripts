import React from "react";
// import PublicRoutes from "./publicRoute";
import ModularRoutes from "./modularRoute";
import '../App.css'
import '../assets/img_font/style.css';
// import Resources from "./Resources";


const MainRoutes = ({ user, history }) => {
  // const isAuthenticated = user.token && localStorage.getItem("token");

  return (
    <>
      {/* {isAuthenticated ? ( */}
        <React.Fragment>
          {/* <Resources /> */}
        <ModularRoutes user={user} history={history} />
        </React.Fragment>
      {/* ) : (
        <PublicRoutes />
      )} */}
    </>
  );
};

export default MainRoutes;
