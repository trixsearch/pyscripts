import React, { Component, lazy } from 'react';
import { NavLink } from 'react-router-dom';
import routes from '../../../../urls';
import { HasAccess } from '../../../../platformDataStoreContext';
import UnauthorizedPage from '../../../UnauthorizedPage';

import './index.css';
import { CW_SERVICE_LIST_VIEW } from '../../../../Data/constants';

const CustomDataList = lazy(() => import('../CustomDataList'));

const ListTab = (props) => {
    
    const { 
        activeListType, listType, 
        selectedList, href 
    } = props;

    return (
        <li
            role="presentation"
            onClick={() => selectedList(listType)}
            className={activeListType === listType ? "nav-item active" : "nav-item"}
        >
            <NavLink
                role="tab"
                data-toggle="tab"
                aria-selected="true"
                className="nav-link"
                to={href}
            >
                {listType}
            </NavLink>
        </li>
    )
}

class CustomListAdvList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            activeListType: this.props.activeListTab
        }
    }

    selectedList = activeListType => {
        this.setState({
            activeListType
        })

        const orgId = this.props.match?.params?.uuid;
        let route = null;
        if(activeListType === "Simple List") {
            route = routes.CUSTOM_DATA.to(orgId)
        } else if(activeListType === "Advanced List") {
            route = routes.ADVANCED_LIST.to(orgId)
        }
        this.props.history.push(route);
    }

    render() {
        const {activeListType} = this.state;
        let tabData = null;
        const orgId = this.props.match?.params?.uuid;

        if(activeListType === "Simple List") {
            tabData = <CustomDataList {...this.props} />
        } else if(activeListType === "Advanced List") {
            tabData = <routes.ADVANCED_LIST.component {...this.props} />
        }

        return (
            <HasAccess
                permissions={[CW_SERVICE_LIST_VIEW]}
                yes={() => (
                    <div className="lists_pages">
                        <ul className="nav nav-tabs process_tab_ongoing_comp_ul document_details_tabs" role="tablist">
                            <ListTab
                                listType="Simple List"
                                activeListType={activeListType}
                                selectedList={this.selectedList}
                                href={routes.CUSTOM_DATA.to(orgId)}
                            />
                            <ListTab
                                listType="Advanced List"
                                activeListType={activeListType}
                                selectedList={this.selectedList}
                                href={routes.ADVANCED_LIST.to(orgId)}
                            />
                        </ul>
                        <div className="tab-content lists_pages_container">
                            {tabData}
                        </div>
                    </div>        
                )}
                no={() => (
                    <UnauthorizedPage />
                )}
            />
        )
    }
}

export default CustomListAdvList;