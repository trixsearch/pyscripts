import React, { useCallback, useEffect, useMemo } from'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, NavLink, useLocation, useHistory } from 'react-router-dom';
import FilterDropdown from '../../components/UI/FilterDropdown/FilterDropdown';
import { DEFAULT_PAGE_SIZE, WORKFLOW_BULKINITIATE, WORKFLOW_INITIATE, WORKFLOW_VIEW } from '../../Data/constants';
import ProcessesList, { HistoryPushHandler } from './ProcessesList';
import SearchBar from '../../components/Navigation/Toolbar/searchBar';
import { getDebugText, getUrlVars, isMobile } from '../utils';
import HasWorkflowPermission from '../../components/UI/HasWorkflowPermission';
import routes from '../../urls';
import { addToast } from '../../components/Toast/actions';
import { Button } from '../../components/UI/AppButton/AppButton'
import { EmptyProcess } from './ProcessComponents';
import { getFilterProcess } from '../../store/actions';
import Spinner from '../../components/UI/Spinner/Spinner';
import { selectApp, updateSearchData } from '../../store/actions/Process/Process';


const ProcessBody = ({
    selectedVendor,
    vendorList,
    setSelectedVendor
}) => {
    const apps = useSelector(state => state?.process?.apps);
    const appData = useSelector(state => {
        return state?.process?.appData
    });
    const loader = useSelector(state => state?.process?.appLoader || state?.process?.loader);
    const processType = useSelector(state => state?.process?.processType);
    const size = useSelector(state => state?.process?.size);
    const processFilter = useSelector(state => state.auth.processFilter);
    const filterOptions = useSelector(state => state?.process?.filterOptions);
    const selectedOption = useSelector(state => state?.process?.selectedOption);
    const { uuid: orgId } = useParams();
    const location = useLocation();
    const history = useHistory();
    const dispatch = useDispatch();
    const valueForFilter = useMemo(() => {
        return Array.isArray(filterOptions)
        && filterOptions.map(item => ({ id: item, name: item }))
    }, [filterOptions])

    const processAppSelect = useCallback((name, processKey) => {
        if (appData?.name !== name) {
            const urlData = getUrlVars();
            HistoryPushHandler(orgId, history, processKey, processType, 1, urlData?.size || DEFAULT_PAGE_SIZE, getDebugText)
            dispatch(updateSearchData(null));
            dispatch(selectApp(apps?.find(app => app.process_key === processKey)));
        }
    }, [orgId, dispatch, appData, history, apps])

    const filterChangeHandler = useCallback((filterName) => {
        const urlData = getUrlVars();
        HistoryPushHandler(orgId, history, appData?.process_key, processType, 1,  urlData?.size || DEFAULT_PAGE_SIZE, getDebugText)
        dispatch(getFilterProcess({
            orgId,
            processType,
            name:appData?.name,
            id: appData?.id,
            processKey,
            pageSize:urlData?.size,
            filters:processFilter,
            selectedFilter:filterName,
            vTenantId: selectedVendor?.id
        }))
    }, [appData, dispatch, orgId, history, processType, processFilter, selectedVendor])

    useEffect(() => {
        let urlData = getUrlVars();
        if(appData?.process_key && !urlData?.process_key){
            HistoryPushHandler(orgId, history, appData?.process_key, processType, 1, urlData?.size || DEFAULT_PAGE_SIZE, getDebugText)
        }
    }, [appData, history, orgId, processType])

    const startANewProcess = useCallback(() => {
        if(appData?.is_admin_initiable) {
            if(appData?.is_process_initiable_from_app_context) {
                dispatch(addToast('error', 'Error', 'This process can not be initiated from this view.'))
            } else{
                history.push({
                    pathname: routes.START_NEW_PROCESS.to(orgId, appData.id),
                    state: {
                        redirectTo: `${location.pathname}${location.search}`,
                        returnBackTo: `${location.pathname}${location.search}`
                    }
                });
            }
        } else {
            dispatch(addToast('error', 'Error', 'Sorry! This process can only be initiated by an external user by clicking on the web link or scanning the QR code.'))
        }  
    }, [appData, history, dispatch, orgId, location])

    return (
        <div>
            <div className='processPage_workflow_dropdown row'>
                <div className='d-flex'>
                    {!!apps?.length &&
                        <FilterDropdown
                            list={apps}
                            selectedItem={appData?.name}
                            disableComponent={loader}
                            isDisableSplitButton={loader}
                            classes='workflow_dropdown_processPage'
                            onItemClickHandler={processAppSelect}
                            selectedItemIconName='icon-apps'
                            showSearch
                        />
                    }
                    {(appData?.process_key && valueForFilter && valueForFilter.length > 1 && selectedOption) && (
                        <FilterDropdown
                            list={valueForFilter}
                            selectedItem={selectedOption}
                            onItemClickHandler={filterChangeHandler}
                            classes='process_filter_dropdown'
                        />
                    )}
                </div>
                <div className="process_searchbar col-md-6 p-0">
                    <HasWorkflowPermission
                        permissions={[WORKFLOW_VIEW]}
                        workflowId={appData?.id}
                        yes={() => (
                            <SearchBar
                                showSearchBar
                                pathName='/process'
                                clearSearchData={() => {}}
                            />
                        )}
                    />
                </div>
                <div className="process_buttons d-flex justify-content-end">
                    <HasWorkflowPermission
                        permissions={[WORKFLOW_INITIATE]}
                        workflowId={appData?.id}
                        yes={() => (
                            <button
                                type='button'
                                className='fancy_btn active  process_btn'
                                onClick={startANewProcess}
                            >
                                Start New
                            </button>                     
                        )}
                    />

                    {
                        !isMobile() && (
                            <HasWorkflowPermission
                                permissions={[WORKFLOW_BULKINITIATE]}
                                workflowId={appData?.id}
                                yes={() => (
                                    <NavLink to='process/import-history'>
                                        <Button
                                            variant='secondary'
                                            customStyle={{
                                                minWidth: "142px"
                                            }}
                                        >
                                            Import History
                                        </Button>
                                    </NavLink>
                                )}
                            />
                        )
                    }
                </div>
            </div>
            
            <div className='main_changable_container process_container'>
                <div className='process_page'>
                    {loader && (<Spinner />)}
                    <HasWorkflowPermission
                        permissions={[WORKFLOW_VIEW]}
                        workflowId={appData?.id}
                        yes={() => {
                            return (
                                <ProcessesList
                                    launchAppProcess={startANewProcess}
                                    selectedVendor={selectedVendor}
                                    setSelectedVendor={setSelectedVendor}
                                    vendorList={vendorList}
                                />
                            )
                        }}
                        no={() => {
                            return (
                                <EmptyProcess
                                    message={`You don't have permission to view processes. Please contact system administrator.`}
                                />
                            )
                        }}
                    />
                </div>
            </div>
        </div>
    )
}

export default ProcessBody;
