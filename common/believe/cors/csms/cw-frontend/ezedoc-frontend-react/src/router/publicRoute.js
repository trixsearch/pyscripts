import React from 'react';
import { Switch, Route } from "react-router-dom";
import routes from '../urls';


const PublicRoutes = () => {
    return (
        <Switch>
            <Route
                exact
                path={routes.LOGIN.path}
                render={(props) => (<routes.LOGIN.component {...props}/>)}
            />
            <Route
                exact
                path={routes.SET_PASSWORD.path}
                render={(props) =>(<routes.SET_PASSWORD.component {...props}/>)}
            />
            <Route
                exact
                path={routes.EMAIL_REQUEST.path}
                render={(props) => (<routes.EMAIL_REQUEST.component {...props}/>)}
            />
            <Route
                exact
                path={routes.JOB_PORTAL_LIST.path}
                render={props => <routes.JOB_PORTAL_LIST.component {...props}/>}
            />
            <Route
                exact
                path={routes.JOB_PORTAL_VIEW.path}
                render={props => <routes.JOB_PORTAL_VIEW.component {...props}/>}
            />
            <Route
                path="*"
                render={(props) => (<routes.LOGIN.component {...props}/>)}
            />
        </Switch>
    )
}

export default PublicRoutes;