import React, { lazy, Suspense } from 'react';
import { Switch, Route } from 'react-router-dom';
import { connect } from "react-redux";

import ErrorPage from '../ErrorPage';
import { PrivateRoute } from '../../router/modularRoute';
import Spinner from '../../components/UI/Spinner/Spinner';
import './master.css';

// const MasterCreate = lazy(() => import('./MasterCreate'));
// const MasterEdit = lazy(() => import('./MasterEdit'));
const MasterList = lazy(() => import('./MasterList'));
const MasterView = lazy(() => import('./NewMaster'));


const Master = (props) => {

    // let list = [];
    // let active = "Master";
    const {viewPermission, match} = props;
    // switch (true) {
    //     case props.location.pathname === '/master':
    //         list = [];
    //         active = "Master";
    //         break;
    //     // case props.location.pathname === '/master/create':
    //     //     list = [{ name: "Master", path: "/master" }];
    //     //     active = "Create Master";
    //     //     break;
    //     // case props.location.pathname.startsWith('/master/edit/'):
    //     //     list = [{ name: "Master", path: "/master" }];
    //     //     active = 'Edit Master';
    //     //     break;
    //     case props.location.pathname.startsWith('/master/'):
    //         list = [{ name: "Master", path: "/master" }];
    //         active = 'View';
    //         break;
    //     default:
    //         break;
    // }
    return (
        <Suspense fallback={(<Spinner/>)}>
            <div className="main_changable_container">
                <Switch>
                    <PrivateRoute
                        exact
                        hasPermission={viewPermission}
                        feature
                        path={match.path}
                        render={(routeProps) => (<MasterList {...routeProps} />)}
                    />
                    {/* <PrivateRoute
                        exact
                        hasPermission
                        path="/master/create"
                        render={(routeProps) => (<MasterCreate {...routeProps} />)}
                    />
                    <PrivateRoute
                        exact
                        hasPermission
                        path="/master/edit/:id"
                        render={(routeProps) => (<MasterEdit {...routeProps} />)}
                    /> */}
                    <PrivateRoute
                        exact
                        hasPermission={viewPermission}
                        feature
                        path={`${match.path}/:id`}
                        render={(routeProps) => (<MasterView {...routeProps} />)}
                    />
                    <Route
                        exact
                        path="*"
                        component={ErrorPage}
                    />
                </Switch>
            </div>
        </Suspense>
    );
}
const mapStateToProps = ({auth}) => ({
    viewPermission: auth.uiPermissions.masterrecords.manage
});

export default connect(mapStateToProps)(Master);
