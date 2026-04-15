/* eslint-disable no-shadow */
import React, { lazy, Suspense } from 'react';
import { Switch, Route } from 'react-router-dom';

import { PrivateRoute } from '../../../router/modularRoute';
import Spinner from '../../../components/UI/Spinner/Spinner';
import ErrorPage from '../../ErrorPage';
import './customdata.css';
import routes from '../../../urls';

const ListAdvList = lazy(() => import('./common'));
const CustomDataCreate = lazy(() => import('./CustomDataCreate'));
const CustomDataEdit = lazy(() => import('./CustomDataEdit'));

const CustomData = (props) => {

    // let list = [];
    // let active = "Lists";

    // switch (true) {
    //     case props.location.pathname === '/lists':
    //         list = [{ name: "Lists", path: "/lists" }];
    //         active = "Simple List";
    //         break;
    //     case props.location.pathname === '/lists/create':
    //         list = [{ name: "Lists", path: "/lists" }];
    //         active = "Create List";
    //         break;
    //     case props.location.pathname.startsWith('/lists/edit/'):
    //         list = [{ name: "Lists", path: "/lists" }];
    //         active = 'Edit List';
    //         break;
    //     case props.location.pathname === '/lists/advanced':
    //         list = [{ name: "Lists", path: "/lists" }];
    //         active = "Advanced List";
    //         break;
    //     case props.location.pathname.startsWith('/lists/advanced/edit/'):
    //         list= [
    //             { name: "Lists", path: "/lists" },
    //             { name: "Advanced List", path: "/lists/advanced" }
    //         ];
    //         active= "Edit Advanced List";
    //         break;
    //     case props.location.pathname.startsWith('/lists/'):
    //         list = [];
    //         active = 'Lists';
    //         break;
    //     default:
    //         break;
    // }

    const {history, match} = props;

    return (
        <Suspense fallback={<Spinner />}>
            <div className="main_changable_container" style={{ 'height': window.innerHeight - 56 - 3 }}>
                <Switch>
                    <PrivateRoute
                        exact
                        hasPermission
                        feature
                        path={match.path}
                        history={history}
                        render={(props) => (<ListAdvList {...props} activeListTab="Simple List" />)}
                    />
                    <PrivateRoute
                        exact
                        hasPermission
                        feature
                        path={`${match.path}/create`}
                        history={history}
                        render={(props) => (<CustomDataCreate {...props} />)}
                    />
                    <PrivateRoute
                        exact
                        hasPermission
                        feature
                        path={`${match.path}/edit/:id`}
                        history={history}
                        render={(props) => (<CustomDataEdit {...props} />)}
                    />
                    <PrivateRoute
                        exact
                        hasPermission
                        feature
                        history={history}
                        path={routes.ADVANCED_LIST.path}
                        render={(props) => (<ListAdvList {...props} activeListTab="Advanced List" />)}
                    />
                    <PrivateRoute
                        exact
                        hasPermission
                        feature
                        history={history}
                        path={routes.ADVANCED_LIST_DETAIL.path}
                        render={(props) => (<routes.ADVANCED_LIST_DETAIL.component {...props} />)}
                    />
                    <Route
                        path="*"
                        component={ErrorPage}
                    />
                </Switch>
            </div>
        </Suspense>
    );
}

export default CustomData;