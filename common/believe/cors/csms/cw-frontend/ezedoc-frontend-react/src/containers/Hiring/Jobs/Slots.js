/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-nested-ternary */
import React, {
    Fragment, useState, useEffect, useCallback 
   } from 'react';
   import { connect } from 'react-redux';
   import {
     useHistory, useLocation, useParams,
   } from 'react-router-dom';
   import { Dropdown, Menu } from 'antd';
   import { PlayCircleOutlined } from '@ant-design/icons';
   import axios from 'axios';
   
   import routes from 'urls';
   import Empty from 'components/Empty';
   import { parseQueryString, Item, isMobile } from 'containers/utils';
   import Spinner from 'components/UI/Spinner/Spinner';
   import BulkImport from 'components/UI/DocumentUpload/BulkImport';
  //  import DropDownButton from 'components/UI/AppButton/DropDownButton';
   import {
     AdvTable,
     clearFiltersHandler,
     getColumnSearchProps,
     tableOnChangeHandler,
     getFilteredValueProp,
   } from 'components/UI/AntDesignTable/AdvTable';
   import {
    //  getCandidates,
     getSlots,
     deleteSlot,
     claimTask,
     getTaskAction,
   } from 'store/actions/index';
   import { addToast } from 'components/Toast/actions';
   
  //  import { BULK_CANDIDATES_TITLE } from '../utils';
   import menuIcon from '../../../assets/images/svg/ellipsis-vertical.svg'
   
   import '../hiring-routes-common.css';
   import './jobView.css';
   import DeleteModel from '../../../components/UI/DeleteModel/DeleteModal';
import { isVendor } from '../../../platformDataStoreContext';

   const APP_URL = process.env.REACT_APP_APP_URL;
   
   const Slots = (props) => {
     const {
       loader,
       jobDetail,
       totalCount,
       addToaster,
       jobFeature,
      //  partnerName,
       storedSorter,
      //  authUserRole,
       storedFilters,
       slotList,
       addPermission,
       // viewPermission,
       storedPageSize,
      //  getCandidateList,
       getSlotList,
       storedActiveSorter,
       storedActiveFilters,
      //  jobCandidateFeature,
      //  entityList,
      //  taskClaim,
      //  taskAction,
      //  currentTaskOwner,
     } = props;
   
     const history = useHistory();
     const locationInfo = useLocation();
     const {
       page = 1,
       next = 1,
       eventId = null,
       profileButton = 'show',
     } = parseQueryString(locationInfo.search);
     const { uuid: orgId, id: urlParamJobId } = useParams();
   
     const {
       job_id: jobId,
       role_name: jobRole,
       work_location_name: jobLocation,
       available_positions: availablePosition,
       status: jobStatus,
     } = jobDetail;
   
     const [filterData, setFilterData] = useState(storedFilters);
     const [activeFilters, setActiveFilters] = useState(storedActiveFilters);
     const [sorterData, setSorterData] = useState(storedSorter);
     const [activeSorter, setActiveSorter] = useState(storedActiveSorter);
     const [currentPage, setCurrentPage] = useState(Number(page) || 1);
     const [currentPageSize, setCurrentPageSize] = useState(storedPageSize);
     const [isOpenImportModal, setIsOpenImportModal] = useState(false);
    //  const [hiringPartners, setHiringPartners] = useState([]);
    //  const [stateData, setStateData] = useState([]);
     const [isChartView, setChartView] = useState(false);
     const [dynamicCharts, setDynamicCharts] = useState([]);
     const [stateLoader, setStateLoader] = useState(false);
     const [showFilter, setShowFilter] = useState(false);
     const [dynamicChartFilters, setDynamicChartFilters] = useState({});
     const [primaryApps, setPrimaryApps] = useState([]);
     const [allApps, setAllApps] = useState([]);
     const [bulkProcess, setBulkProcess] = useState()
     const [inContextApps, setInContextApps] = useState([]);
     const [showWarning, setShowWarning] = useState(false);
   
     const [selectedGroup, setSelectedGroup] = useState({
      id: null
    });
    const isVendorFlag = isVendor();
    //  let commonVariables = {
    //    job: jobId || '',
    //    hiring_event: eventId || '',
    //    sourcing_partner: partnerName || '',
    //    role: jobRole || '',
    //    workLocation: jobLocation || '',
    //  };

    const showWarningModal = (id, name) => {
      setShowWarning(true);
      setSelectedGroup({
        id
      });
    };
  
    const handleDelete = () => {
      props.slotDelete(orgId, selectedGroup.id, totalCount, currentPageSize, currentPage);
      setShowWarning(false);
    };

    const getInContextApps = useCallback(
      () => {
        setInContextApps([]);
        if (orgId) {
          axios
          .get(`${APP_URL}/${orgId}/apps/?workflow_type=SLOT_CONTEXT`)
          .then((res) => {
            setInContextApps(res.data?.data ?? []);
          })
          .catch((err) => {
            addToaster(
              'error',
              'Error',
              err.response?.data?.message ?? 'Something went wrong'
            );
          });
        }
      },
      [orgId]
    );

    const onStartInContextWorkflow = async (app) => {
      try {
        history.push({
          pathname: routes.START_NEW_PROCESS.to(orgId, app.id),
          state: {
            appName: app.name,
            returnBackTo: routes.SLOTS.to(orgId, urlParamJobId, currentPage),
            redirectTo: routes.SLOTS.to(orgId, urlParamJobId, currentPage),
          },
        });
      } catch (err) {
        addToaster(
          'error',
          'Error',
          err.response?.data?.message ?? 'Something went wrong'
        );
      }
    };

    const candidateActions = (record) => (
      <Menu>
        {inContextApps.map((item) => (
          <Menu.Item onClick={() => onStartInContextWorkflow(item, record)}>
            {item?.name}
          </Menu.Item>
        ))}
      </Menu>
    );
   
    //  const handleCandiateProfile = (e, record) => {
    //    e.preventDefault();
    //    let masterModelPermision = false;
    //    entityList.forEach((item) => {
    //      if (item.master_model_id === record.entity_master_model_id)
    //        masterModelPermision = item.show;
    //    });
    //    if (masterModelPermision) {
    //      if (record.entity_view_id)
    //        history.push(
    //          routes.ENTITY_DETAILS.jobTo(
    //            orgId,
    //            record.entity_master_model_id,
    //            record.entity_view_id,
    //            record.candidate,
    //            jobDetail.id,
    //            eventId,
    //            profileButton
    //          )
    //        );
    //      else
    //        addToaster(
    //          'error',
    //          'Error',
    //          'No view is set for your role. Please contact system administrator.'
    //        );
    //    } else {
    //      addToaster(
    //        'error',
    //        'Error',
    //        'You do not have permission to view profile. Please contact system administrator.'
    //      );
    //    }
    //  };
   
    //  const fetchSourcingPartner = () => {
    //    axios
    //      .get(`${APP_URL}/${orgId}/jobs/hiring_partner`)
    //      .then((res) => setHiringPartners(res.data.data));
    //  };
   
    //  const fetchStateData = () => {
    //    axios
    //      .get(`${APP_URL}/${orgId}/jobs/hiring_state/hiring_state_and_status`)
    //      .then((res) => setStateData(res.data.data));
    //  };
   
    //  useEffect(() => {
    //    // Fetch Sourcing Partner Data
    //    fetchSourcingPartner();
    //    // Fetch Status Data
    //    fetchStateData();
    //  }, []);
   
    //  const getCandidateDetails = async (candidateId) => {
    //    setStateLoader(true);
    //    return axios
    //      .get(
    //        `${APP_URL}/${orgId}/entity/master/data/${candidateId}/get_complete_entity_data`
    //      )
    //      .then((res) => {
    //        return res.data?.data;
    //      })
    //      .catch((err) => {
    //        throw err;
    //      })
    //      .finally(() => setStateLoader(false));
    //  };

    //  const fixed_partner_data = [
    //    { text: 'Referral', value: 'Referral' },
    //    { text: 'Walkin', value: 'Walkin' },
    //  ];
   
    //  let surcing_partner_data = hiringPartners.map((partner) => {
    //    return { text: partner.name, value: partner.name };
    //  });
   
    //  let partnerChoices = [...surcing_partner_data, ...fixed_partner_data];
   
    //  let stateChoices = stateData.map((hiringState) => {
    //    return { text: hiringState.name, value: hiringState.value };
    //  });
   
     let columns = [
      //  {
      //    title: () => (
      //      <div className="adv-table-total-items-parent">
      //        Slot ID
      //        <div className="adv-table-total-items">
      //          {totalCount > 99999 ? '99999+' : totalCount}
      //        </div>
      //      </div>
      //    ),
      //    width: 205,
      //    dataIndex: 'id',
      //    key: 'id',
      //    backendKey: 'id',
      //    sorter: true,
      //    ellipsis: true,
      //    defaultSortOrder: 'ascend',
      //    sortDirections:
      //      sorterData === 'slotId' ? ['descend'] : ['ascend', 'descend'],
      //    ...getColumnSearchProps(filterData, 'slotId', 'slot id'),
      //    render: (text, record) => <Item type='text' data={text} id={record.id} name='slot-id' />,
      //    sortOrder:
      //      activeSorter.columnKey === 'slotId' ? activeSorter.order : false,
      //  },
       {
         title: 'Date',
         dataIndex: 'date',
         key: 'date',
         backendKey: 'date',
         sorter: true,
         ellipsis: true,
         render: (text, record) => (
           <Item type="text" data={text} id={record.id} name="slot-date" />
         ),
         ...getFilteredValueProp(filterData, 'date'),
         sortOrder:
           activeSorter.columnKey === 'date'
             ? activeSorter.order
             : false,
       },
       {
         title: 'Start Time',
         dataIndex: 'start_time',
         key: 'start_time',
         backendKey: 'start_time',
         sorter: true,
         ellipsis: true,
         render: (text, record) => (text ? (
             <Item type="text" data={text} id={record.id} name="slot-start-time" />
           ) : (
             ''
           )),
         ...getColumnSearchProps(
           filterData,
           'start_time',
           'start time'
         ),
         sortOrder:
           activeSorter.columnKey === 'start_time' ? activeSorter.order : false,
       },
       {
         title: 'Alloted Slots',
         dataIndex: 'alloted_slots',
         key: 'alloted_slots',
         backendKey: 'alloted_slots',
         sorter: true,
         ellipsis: true,
         render: (text, record) => (text ? (
             <Item
               type="text"
               data={text}
               id={record.id}
               name="alloted-slots"
             />
           ) : (
             ''
           )),
        //  ...getColumnSearchProps(
        //    filterData,
        //    'alloted_slots',
        //    'alloted slots'
        //  ),
         sortOrder:
           activeSorter.columnKey === 'alloted_slots'
             ? activeSorter.order
             : false,
       },
       {
         title: 'Booked Slots',
         dataIndex: 'booked_slots',
         key: 'booked_slots',
         backendKey: 'booked_slots',
         ellipsis: true,
         sorter: true,
         filterMultiple: false,
         render: (text, record) => (text ? (
             <Item
               type="text"
               data={text}
               id={record.id}
               name="booked_slot"
             />
           ) : (
             ''
           )),
        //  ...getFilteredValueProp(filterData, 'booked_slots'),
         sortOrder:
           activeSorter.columnKey === 'booked_slots'
             ? activeSorter.order
             : false,
       },
      {
        title: 'Interview Location',
        dataIndex: 'interview_location',
        key: 'interview_location',
        backendKey: 'interview_location',
        sorter: true,
        ellipsis: true,
        render: (text, record) => (text ? (
            <Item
              type="text"
              data={text}
              id={record.id}
              name="interview_location"
            />
          ) : (
            ''
          )),
        ...getColumnSearchProps(
          filterData,
          'interview_location',
          'interview_location'
        ),
        sortOrder:
          activeSorter.columnKey === 'interview_location'
            ? activeSorter.order
            : false,
      },
      {
        title: 'Channel',
        dataIndex: 'channel',
        key: 'channel',
        backendKey: 'channel',
        sorter: true,
        ellipsis: true,
        render: (text, record) => (text ? (
            <Item
              type="text"
              data={text}
              id={record.id}
              name="slot-channel"
            />
          ) : (
            ''
          )),
        ...getColumnSearchProps(
          filterData,
          'channel',
          'channel'
        ),
        sortOrder:
          activeSorter.columnKey === 'candidate'
            ? activeSorter.order
            : false,
      }
     ];

     if(!isVendorFlag){
      columns.push({
        title: 'Actions',
        dataIndex: 'actions',
        key: 'actions',
        width: '7%',
        align: 'center',
        render: (text, record) => {
         let content1 = (
           <Dropdown
           trigger="click"
           placement="bottomCenter"
           overlay={candidateActions(record)}
           >
             <PlayCircleOutlined
               data-tip
               data-for={`candidate-start-icon-${record.id}`}
               onClick={() => getInContextApps(record)}
             />
           </Dropdown>
         )
         let content2 = null;
 
         // if (record.booked_slots === 0) content2 = (
         //   <Item
         //     type='icon'
         //     data='Delete'
         //     id={record.id}
         //     name='slot-delete-icon'
         //   >
         //     <DeleteOutlined
         //       data-tip
         //       data-for={`slot-delete-icon-${record.id}`}
         //       onClick={() => showWarningModal(record.id)}
         //     />
             
         //   </Item>
         // )
 
         return(
             <Fragment>
                 {content1 || null}
                 {content1 && content2 ? <span>&nbsp;&nbsp;&nbsp;</span> : null}
                 {content2 || null}
             </Fragment>
         )
        },
      })
     }
   
   
     useEffect(() => {
       setCurrentPage(Number(page) || 1);
     }, [page]);
   
    //  useEffect(() => {
    //    const search = `?${eventId ? `eventId=${eventId}&` : ''}${
    //      eventId ? `profileButton=${profileButton}&` : ''
    //    }${next ? `next=${next}&` : ''}page=${currentPage}`;
    //    history.replace({
    //      pathname: '',
    //      search,
    //    });
    //  }, [currentPage]);
   
     useEffect(() => {

      if (orgId && jobFeature && jobId) {
        
          getSlotList(
            orgId,
            currentPage,
            currentPageSize,
            jobId,
            filterData,
            sorterData,
            activeFilters,
            activeSorter,
            history
          );
       }
       // return () => clearCandidateList();
     }, [
       orgId,
       jobId,
       eventId,
       jobFeature,
       filterData,
       sorterData,
       currentPage,
       currentPageSize,
       getSlotList,
     ]);
   
     const handleTableChange = (pagination, filters, sorter) => {
       const data = {
         columns,
         setFilterData,
         setSorterData,
         setCurrentPage,
         setActiveSorter,
         setActiveFilters,
         setCurrentPageSize,
         initialSortData: 'slotId',
         firstColumnKey: columns[0].key,
         firstColumnCustomTitle: 'Slot ID',
       };
       tableOnChangeHandler(pagination, filters, sorter, 'jobView', data);
     };
   
     const handleClearFilters = () => {
       clearFiltersHandler(setFilterData, setActiveFilters);
     };

    useEffect(() => {
      function getApps() {
        axios
          .get(`${APP_URL}/${orgId}/apps/?workflow_type=SLOT`)
          .then((res) => {
            let apps = res.data?.data ?? [];
            if(apps.length > 1 && !apps[0]?.bulk_support && !apps[1]?.bulk_support) {
              setPrimaryApps(apps.splice(0,2));
              setAllApps(apps);
            } else {
              setPrimaryApps(apps.splice(0,1));
              setAllApps(apps);
            }
          })
          .catch((err) => {
            addToaster(
              'error',
              'Error',
              err.response?.data?.message ?? 'Something went wrong'
            );
          });
      }
      if (orgId) getApps();
    }, [orgId]);
  
    const onStartWorkflow = (app) => {
      history.push({
        pathname: routes.START_NEW_PROCESS.to(orgId, app.id),
        state: {
          appName: app.name,
          returnBackTo: routes.SLOTS.to(orgId, urlParamJobId, currentPage),
          redirectTo: routes.SLOTS.to(orgId, urlParamJobId, currentPage),
          data: jobDetail,
        },
      });
    };
  
    const onStartBulkUpload = (app) => {
      setBulkProcess(app);
      setIsOpenImportModal(true)
  }
  
   
     return (
       <Fragment>
         {stateLoader && <Spinner />}
         <div
           className="main_changable_container"
           style={{ height: window.innerHeight - 59 }}
         >
           <div className="process_details_tab_cont job-view">
             <ul className="process_tab_ongoing_comp_ul" id="myTab" role="tablist">
               <li className="process_tab_last_li">
                 {/* <div className="process_details_btn_cont2">
                 </div> */}
                 <div className="process_details_btn_cont">
                   {addPermission
                   && availablePosition > 0
                   && profileButton === 'show'
                   && !isChartView
                   && jobStatus === 'Active' ? (
                     <Fragment>
                      {primaryApps.map(app => (
                        <>
                          {app?.bulk_support ? (
                            <button
                              type='button'
                              className='process_fancy_btn fancy_btn active'
                              onClick={() => onStartBulkUpload(app)}
                            >
                              {`${app.name} Bulk`}
                            </button>
                          ) : null}
                         {!isVendorFlag &&  <button
                            type='button'
                            className='process_fancy_btn fancy_btn active'
                            onClick={() => onStartWorkflow(app)}
                          >
                            {app.name}
                          </button>}
                        </>
                      ))}
                      {allApps?.length ? (
                        <div className="menu_container">
                          <div className="menu_btn dropdown-toggle" data-toggle="dropdown" type="button">
                            <img src={menuIcon} alt="language" />
                          </div>
                          <div className="dropdown-menu">
                            {allApps.map((app) => (
                              <div key={app.id} className="start-new-process-item">
                                <div
                                    role="presentation"
                                    onClick={() => onStartWorkflow(app)}
                                    className="startNewProcessMenuItem"
                                >
                                  <div className="menuItemTextContainer">
                                    <p className="headerRow">{app.name}</p>
                                    <p className="descriptionRow">{app.description}</p>
                                  </div>
                                </div>
                                {app.bulk_support && !isMobile() && (
                                  <button
                                      type="button"
                                      className="bulk-init-button-container"
                                      onClick={() => onStartBulkUpload(app)}
                                  >
                                    <span className="icon-bulktasks bulk-init-icon" />
                                    <span className="bulk-init-text">Start Bulk</span>
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                     </Fragment>
                   ) : null}
                 </div>
               </li>
             </ul>
                 {slotList.length === 0 && isMobile() ? (<Empty/>)
                 : (
                 <AdvTable
                  loading={loader}
                  columns={columns}
                  dataSource={slotList}
                  pagination={{
                    total: totalCount,
                    current: currentPage,
                    pageSize: currentPageSize,
                  }}
                  rowKey={(record) => record.id}
                  onChange={handleTableChange}
                  activeFilters={activeFilters}
                  handleClearFilters={handleClearFilters}
                 /> 
                  )}
             <DeleteModel
            show={showWarning}
            itemName='slot'
            handleDelete={handleDelete}
            hideWarning={() => {
                setShowWarning(false);
            }}
             />
            <BulkImport
              history={history}
              show={isOpenImportModal}
              title={`Bulk Initiate ${bulkProcess?.name} Process.`}
              url={`${APP_URL}/${orgId}/apps/${bulkProcess?.id}/bulk_initiate`}
              redirectUrl={routes.SLOTS.to(orgId, urlParamJobId, currentPage)}
              handleShow={(value) => setIsOpenImportModal(value)}
            />
           </div>
         </div>
       </Fragment>
     );
   };
   
   const mapStateToProps = ({ jobView, auth }) => ({
     jobDetail: jobView.job,
     slotList: jobView.slots,
     loader: jobView.loader,
     totalCount: jobView.total,
     storedPageSize: jobView.size,
     storedFilters: jobView.filters,
     storedSorter: jobView.sorter,
     storedActiveSorter: jobView.activeSorter,
     storedActiveFilters: jobView.activeFilters,
   
     partnerName: auth.partner?.name,
     jobFeature: auth.uiFeatures.job.view,
     jobCandidateFeature: auth.uiFeatures.jobcandidate.view,
     viewPermission: auth.uiPermissions.jobcandidate.view,
     addPermission: auth.uiPermissions.jobcandidate.add,
     entityList: auth.entityList,
     authUserRole: auth.groupName,
     currentTaskOwner: auth.current_task_owner,
   });
   
   const mapDispatchToProps = {
     addToaster: addToast,
    //  getCandidateList: getCandidates,
     getSlotList: getSlots,
     slotDelete: deleteSlot,
     taskClaim: claimTask,
     taskAction: getTaskAction,
   };
   
   export default connect(mapStateToProps, mapDispatchToProps)(Slots);