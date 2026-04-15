/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-nested-ternary */
import React, {
  Fragment, useState, useEffect, useCallback
} from 'react';
import { connect } from 'react-redux';
import {
  NavLink,
  useHistory, useLocation, useParams,
} from 'react-router-dom';
import { Dropdown, Menu, Switch, Spin } from 'antd';
import { PlayCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import axios from 'axios';

import routes from 'urls';
import Empty from 'components/Empty';
import { parseQueryString, Item, isMobile } from 'containers/utils';
import Spinner from 'components/UI/Spinner/Spinner';
import BulkImport from 'components/UI/DocumentUpload/BulkImport';
import DropDownButton from 'components/UI/AppButton/DropDownButton';
import { Button } from 'components/UI/AppButton/AppButton'
import {
  AdvTable,
  clearFiltersHandler,
  getColumnSearchProps,
  tableOnChangeHandler,
  getFilteredValueProp,
} from 'components/UI/AntDesignTable/AdvTable';
import {
  getCandidates,
  claimTask,
  getTaskAction,
} from 'store/actions/index';
import { addToast } from 'components/Toast/actions';
import { DefaultChartComponents } from 'containers/Config/View/JobEventChartConfig/constants';

// import { BULK_CANDIDATES_TITLE } from '../utils';
import Chart, { Charts } from '../Charts';
import OverlayFilter from '../OverlayFilter/OverlayFilter';
import menuIcon from '../../../assets/images/svg/ellipsis-vertical.svg'
import { ASC_ORDER, CREATE_TIME } from '../../Tasks/TaskConstants';

import '../hiring-routes-common.css';
import './jobView.css';
import '../../Dashboard/WorkflowFloatingDropdown.css';
import { isVendor } from '../../../platformDataStoreContext';
import DrawerFilter from '../DrawerFilter/DrawerFilter';
import { getInvolvedUserGroup } from '../../../store/actions'

const APP_URL = process.env.REACT_APP_APP_URL;

const Applicants = (props) => {
  const {
    loader,
    jobDetail,
    totalCount,
    addToaster,
    jobFeature,
    partnerName,
    storedSorter,
    authUserRole,
    storedFilters,
    candidateList,
    addPermission,
    // viewPermission,
    storedPageSize,
    getCandidateList,
    storedActiveSorter,
    storedActiveFilters,
    jobCandidateFeature,
    entityList,
    taskClaim,
    taskAction,
    currentTaskOwner,
    involved_groups,
    usergroupId,
    getInvolvedUserGroupList
  } = props;
  const history = useHistory();
  const locationInfo = useLocation();
  const {
    page = 1,
    next = 1,
    eventId = null,
    profileButton = 'show',
    vendorId
  } = parseQueryString(locationInfo.search);
  const { uuid: orgId, id: urlParamJobId } = useParams();
  const isVendorFlag = isVendor();
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
  const [hiringPartners, setHiringPartners] = useState([]);
  const [stateData, setStateData] = useState([]);
  const [isChartView, setChartView] = useState(false);
  const [dynamicCharts, setDynamicCharts] = useState([]);
  const [stateLoader, setStateLoader] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showSideFilter, setShowSideFilter] = useState(false);
  const [dynamicChartFilters, setDynamicChartFilters] = useState({});
  const [disabled, setDisabled] = useState(false);
  const [primaryApps, setPrimaryApps] = useState([]);
  const [allApps, setAllApps] = useState([]);
  const [bulkProcess, setBulkProcess] = useState()
  const [inContextApps, setInContextApps] = useState(['No Apps']);
  const [tasks, setTasks] = useState(['No Tasks']);
  const [filters, setFilters] = useState({});
  const [drawerFilters, setDrawerFilters] = useState({});


  const [tabs, setTabs] = useState("");
  const [stages, setStages] = useState([]);
  const [allcount, setAllCount] = useState(0);
  const [customloader,setCustomLoader]=useState(true);

  let commonVariables = {
    job: jobId || '',
    hiring_event: eventId || '',
    sourcing_partner: partnerName || '',
    role: jobRole || '',
    workLocation: jobLocation || '',
  };

  const handleCandiateProfile = (e, record) => {
    e.preventDefault();
    let masterModelPermision = false;
    entityList.forEach((item) => {
      if (item.master_model_id === record.entity_master_model_id)
        masterModelPermision = item.show;
    });
    if (masterModelPermision) {
      if (record.entity_view_id)
        history.push(
          routes.ENTITY_DETAILS.jobTo(
            orgId,
            record.entity_master_model_id,
            record.entity_view_id,
            record.candidate,
            jobDetail.id,
            eventId,
            profileButton
          )
        );
      else
        addToaster(
          'error',
          'Error',
          'No view is set for your role. Please contact system administrator.'
        );
    } else {
      addToaster(
        'error',
        'Error',
        'You do not have permission to view profile. Please contact system administrator.'
      );
    }
  };

  const fetchSourcingPartner = () => {
    axios
      .get(`${APP_URL}/${orgId}/jobs/hiring_partner`)
      .then((res) => setHiringPartners(res.data.data));
  };

  const fetchStateData = () => {
    axios
      .get(`${APP_URL}/${orgId}/jobs/hiring_state/hiring_state_and_status`)
      .then((res) => {
        if(res.data.data){
           let response = res.data.data.map((hiringState) => {
            return { text: hiringState.name, value: hiringState.value };
          })
          setStateData(response)
        }
      });
  };




  useEffect(() => {
    if (jobDetail?.filter_stage_name) {
      let stages = [];
      let requests = jobDetail?.filter_stage_name?.map((a) => { axios.get(`${APP_URL}/${orgId}/jobs/candidate?job__job_id=${jobId}&filter_stage__name=${a}&page=1&page_count=0`) });
      Promise.allSettled(requests).then((responses) => {
        for (let i = 0; i < requests.length; i++) {
          stages.push({ label: jobDetail?.filter_stage_name[i], count: responses[i]?.value?.data?.pagination_data?.total_count })
        }
        setStages([...stages]);
      });
    }

  }, [jobId, jobDetail]);

  useEffect(() => {
    axios.get(`${APP_URL}/${orgId}/jobs/candidate?job__job_id=${jobId}&page=1&page_count=0`)
      .then((response) => setAllCount(response.data.pagination_data.total_count))
  }, [candidateList])

  useEffect(() => {
    getInvolvedUserGroupList(orgId , usergroupId);
    // Fetch Sourcing Partner Data
    fetchSourcingPartner();
    // Fetch Status Data
    fetchStateData();
  }, []);

  const fetchStateCandidate = (stage_name) => {
    setTabs(stage_name);

    getCandidateList(
      orgId,
      currentPage,
      currentPageSize,
      jobId,
      filterData,
      sorterData,
      activeFilters,
      activeSorter,
      history,
      eventId,
      vendorId,
      stage_name
    );

  }
  let columns = [
    {
      title: () => (
        <div className="adv-table-total-items-parent">
          Applicants ID
          <div className="adv-table-total-items">
            {totalCount > 99999 ? '99999+' : totalCount}
          </div>
        </div>
      ),
      width: 205,
      dataIndex: 'candidateId',
      key: 'candidateId',
      backendKey: 'candidateId',
      sorter: true,
      ellipsis: true,
      defaultSortOrder: 'ascend',
      sortDirections:
        sorterData === 'candidateId' ? ['descend'] : ['ascend', 'descend'],
      ...getColumnSearchProps(filterData, 'candidateId', 'candidate id'),
      // render: (text, record) => {
      //     return viewPermission
      //         ? <Item type='navlink' data={text} path={routes.CANDIDATE_VIEW.to(record.id, currentPage)} id={record.id} name='candidate-id-navlink' />
      //         : <Item type='text' data={text} id={record.id} name='candidate-id' />
      // },
      render: (text, record) => (text ? (
        <Item
          type="navlink"
          data={text}
          id={record.id}
          name="candidate-id"
          path="#"
          onClick={(e) => handleCandiateProfile(e, record)}
        />
      ) : (
        ''
      )),
      sortOrder:
        activeSorter.columnKey === 'candidateId' ? activeSorter.order : false,
    },
    {
      title: 'Source',
      dataIndex: 'sourcing_partner__name',
      key: 'sourcingPartner',
      backendKey: 'sourcing_partner__name',
      sorter: true,
      filters: partnerChoices,
      filterMultiple: false,
      render: (text, record) => (
        <Item type="text" data={text} id={record.id} name="candidate-source" />
      ),
      ...getFilteredValueProp(filterData, 'sourcing_partner__name'),
      sortOrder:
        activeSorter.columnKey === 'sourcingPartner'
          ? activeSorter.order
          : false,
    },
    {
      title: 'Applicants Name',
      dataIndex: 'candidate_name',
      key: 'candidateName',
      backendKey: 'candidate__entity_name',
      sorter: true,
      ellipsis: true,
      render: (text, record) => (text ? (
        <Item type="text" data={text} id={record.id} name="candidate-name" />
      ) : (
        ''
      )),
      ...getColumnSearchProps(
        filterData,
        'candidate__entity_name',
        'candidate name'
      ),
      sortOrder:
        activeSorter.columnKey === 'candidateName' ? activeSorter.order : false,
    },
    {
      title: 'Mobile',
      dataIndex: 'candidate_mobile',
      key: 'candidateMobile',
      backendKey: 'candidate__entity_phone_number',
      sorter: true,
      ellipsis: true,
      render: (text, record) => (text ? (
        <Item
          type="text"
          data={text}
          id={record.id}
          name="candidate-mobile"
        />
      ) : (
        ''
      )),
      ...getColumnSearchProps(
        filterData,
        'candidate__entity_phone_number',
        'mobile'
      ),
      sortOrder:
        activeSorter.columnKey === 'candidateMobile'
          ? activeSorter.order
          : false,
    },
    {
      title: 'Hiring Status',
      dataIndex: 'candidate_state',
      key: 'candidateHiringStatus',
      backendKey: 'state__name',
      ellipsis: true,
      sorter: true,
      filterMultiple: false,
      render: (text, record) => (text ? (
        <Item
          type="text"
          data={text}
          id={record.id}
          name="candidate-hiring-status"
        />
      ) : (
        'New'
      )),
      ...getFilteredValueProp(filterData, 'state__name'),
      sortOrder:
        activeSorter.columnKey === 'candidateHiringStatus'
          ? activeSorter.order
          : false,
    },
  ];
  let filterColumns = [...columns, { title: 'Job Type', key: 'jobType', backendKey: 'jobType' },
  { title: 'Compulsory Document', key: 'documents', backendKey: 'candidate_preferences__documents' },
  { title: 'Assets Required', key: 'assets', backendKey: 'candidate__entity_data__doYouHaveBike' },
  { title: 'Language', key: 'language', backendKey: 'candidate_preferences__language' },
  { title: 'Gender', key: 'gender', backendKey: 'candidate__gender' },
  { title: 'Source', key: 'vendor', backendKey: 'sourcing_partner__name' },
  { title: 'Age Preference', key: 'age', backendKey: 'candidate__entity_data__age' },
  { title: 'Min Salary', key: 'MinSalary', backendKey: 'candidate__entity_data__salary__gte' },
  { title: 'Max Salary', key: 'MaxSalary', backendKey: 'candidate__entity_data__salary__lte' },
  { title: 'Min Exp', key: 'MinExp', backendKey: 'candidate__entity_data__experienceInNumberOfYear__gte' },
  { title: 'Max Exp', key: 'MaxExp', backendKey: 'candidate__entity_data__experienceInNumberOfYear__lte' },
  { title: 'Education', key: 'education', backendKey: 'candidate__entity_data__educationalQualification'},
  { title: 'Experience type', key: 'ExpType', backendKey: 'candidate__entity_data__workExperience' },
  { title: 'Created By (Users)', key: 'teams', backendKey: 'candidate__entity_data__initiator' },
  { title: 'Hiring Status', key: 'status', backendKey: 'state__name', filters: stateData },
  { title: 'Location', key: 'work_city', backendKey: 'candidate__work_location' },
  { title: 'Date of creation from', key:'created_at_start', backendKey: 'created_at__gte'},
  { title: 'Date of creation to', key:'created_at_end', backendKey: 'created_at__lte'},
  { title: 'Date of action from', key:'date_of_action_from', backendKey: 'candidate_stage_date__gte'},
  { title: 'Date of action to', key:'date_of_action_to', backendKey: 'candidate_stage_date__lte'},
  { title: 'Actors', key: 'actor', backendKey: 'candidate_stage_assignee' },
  { title: 'Created by (Type)', key: 'created_by', backendKey: 'source'},
  { title: 'Stage', key: 'stage', backendKey: 'candidate_stage_name', filters: stages?.map(a=>({value:a.label, text:a.label}))}
  ]

  let mappedFields = {};
  filterColumns?.forEach(item => {
    mappedFields[item['key']] = { label: item['title'], options: item['filters'] }
  });
  useEffect(() => {
    // Fetch Sourcing Partner Data
    fetchSourcingPartner();
    // Fetch Status Data
    fetchStateData();
  }, []);


  useEffect(()=>{
    if (jobDetail?.filter_stage_name) {
      let stages = [];
      let filterParams='';
      Object.keys(filterData).map(item => {
        if (item === 'hiring_status') filterParams += `&${item}=${filterData[item]}`
        else if(filterData[item].split(',')?.length>1) {filterParams += `&${item}__in=${filterData[item]}`}
        else filterParams += `&${item}__icontains=${filterData[item]}`
        return null
    }) 

      let requests = jobDetail?.filter_stage_name?.map((a) => axios.get(`${APP_URL}/${orgId}/jobs/candidate?job__job_id=${jobId}&filter_stage__name=${a}${filterParams}&page=1&page_count=0`));
      Promise.allSettled(requests).then((responses)=>{
        for(let i = 0;i < requests.length;i++){
          stages.push({label:jobDetail?.filter_stage_name[i], count: responses[i]?.value?.data?.pagination_data?.total_count})
        }
        setStages([...stages]);
      });
    }

  },[jobId,jobDetail,filterData]);

  useEffect(()=>{
    let filterParams='';
    Object.keys(filterData).map(item => {
      if (item === 'hiring_status') filterParams += `&${item}=${filterData[item]}`
      else if(filterData[item].split(',')?.length>1) {filterParams += `&${item}__in=${filterData[item]}`}
      else filterParams += `&${item}__icontains=${filterData[item]}`
      return null
  }) 

    axios.get(`${APP_URL}/${orgId}/jobs/candidate?job__job_id=${jobId}${filterParams}&page=1&page_count=0`)
    .then((response)=>setAllCount(response.data.pagination_data.total_count))
  },[candidateList,filterData])

  useEffect(()=>{
    setTabs('');
    const data = {
      columns: filterColumns,
      setFilterData,
      setSorterData,
      setCurrentPage,
      setDrawerFilters,
      setActiveSorter,
      setActiveFilters,
      setCurrentPageSize,
      initialSortData: '-job_id',
      firstColumnKey: columns[0].key,
      firstColumnCustomTitle: 'Job ID',
    }
    tableOnChangeHandler({
      total: totalCount,
      current: currentPage,
      pageSize: currentPageSize,
    }, filters, {}, 'jobs', data)
  }, [filters]);

  const getTasks = useCallback(
    (record) => {
      // setTasks([]);
      const payload = {
        search: true,
        search_data: [
          {
            name: 'job',
            operation: 'equals',
            variableOperation: 'EQUALS',
            value: jobId,
          },
          {
            name: 'entity_id',
            operation: 'equals',
            variableOperation: 'EQUALS',
            value: record.candidate,
          },
        ],
      };
      if (orgId && jobId) {
        axios
          .post(
            `${APP_URL}/${orgId}/apps/search_task?order=${ASC_ORDER}&sort=${CREATE_TIME}`,
            payload
          )
          .then((res) => {
            setCustomLoader(false)
            setTasks(res.data?.data?.data ?? []);
          })
          .catch((err) => {
            addToast(
              'error',
              'Error',
              err?.response?.data?.message ?? 'Something went wrong!'
            );
          });
      }
    },
    [orgId, jobId]
  );

  const getInContextApps = useCallback(
    (record) => {
      // setInContextApps([]);
      if (orgId) {
        axios
          .get(`${APP_URL}/${orgId}/apps/?workflow_type=JOB_CANDIDATE_CONTEXT&available_from_status__name=${record?.candidate_state}`)
        .then((res) => {
          setCustomLoader(false)
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

  const getActions = (record) => {
    getTasks(record);
    getInContextApps(record);
  }

  const getCandidateDetails = async (candidateId) => {
    setStateLoader(true);
    return axios
      .get(
        `${APP_URL}/${orgId}/entity/master/data/${candidateId}/get_complete_entity_data`
      )
      .then((res) => {
        return res.data?.data;
      })
      .catch((err) => {
        throw err;
      })
      .finally(() => setStateLoader(false));
  };

  const onStartInContextWorkflow = async (app, record) => {
    try {
      const candidateData = await getCandidateDetails(record.candidate);
      candidateData['candidate_details'] = record;
      history.push({
        pathname: routes.START_NEW_PROCESS.to(orgId, app.id),
        state: {
          appName: app.name,
          returnBackTo: routes.JOB_VIEW.to(orgId, urlParamJobId, currentPage),
          redirectTo: routes.JOB_VIEW.to(orgId, urlParamJobId, currentPage),
          data: candidateData,
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

  const onStartTask = (task) => {
    if (task.assignee) {
      taskAction(
        orgId,
        task.id,
        history,
        task.assignee,
        currentTaskOwner?.email
      );
    } else {
      taskClaim(
        orgId,
        task.id,
        history,
        task.assignee,
        {involved_groups},
        () => { }
      );
    }
  };

  const fixed_partner_data = [
    { text: 'Referral', value: 'Referral' },
    { text: 'Walkin', value: 'Walkin' },
  ];

  let surcing_partner_data = hiringPartners.map((partner) => {
    return { text: partner.name, value: partner.name };
  });

  let partnerChoices = [...surcing_partner_data, ...fixed_partner_data];


  const Loader = () => (
    <div class="divLoader">
      <Menu>
      <Menu.Item>
      <Spin indicator={<LoadingOutlined style={{ fontSize: 20 }} spin />} />
      </Menu.Item>
      </Menu>
    </div>
 );

  const candidateActions = (record) => (
    <Menu>
      {inContextApps.length===0 && tasks.length===0 && customloader===false ? 
      <Menu.Item>No tasks</Menu.Item>
      : ''}

      {inContextApps?.map((item) => (
        <Menu.Item onClick={() => onStartInContextWorkflow(item, record)}>
          {item?.name}
        </Menu.Item>
      ))}
      {tasks?.map((item) => (
        <Menu.Item onClick={() => onStartTask(item)}>{item?.name}</Menu.Item>
      ))}

    </Menu>
  );

  
    columns.push({
      title: 'Actions',
      dataIndex: 'actions',
      key: 'actions',
      width: '7%',
      align: 'center',
      render: (text, record) => {
        let content = (
          <Dropdown
            trigger="click"
            placement="bottomCenter"
            overlay={customloader ? Loader() : candidateActions(record)}
          >
            <PlayCircleOutlined
              data-tip
              data-for={`candidate-start-icon-${record.id}`}
              onClick={() => getActions(record)}
            />
          </Dropdown>
        );
        return <Fragment>{content || null}</Fragment>;
      },
    })
  

  useEffect(() => {
    function fetchDynamicCharts() {
      const url = `${APP_URL}/${orgId}/config/job_config`;
      setStateLoader(true);
      axios
        .get(url)
        .then((res) => {
          const data = res.data.data;
          const selectedRecord = data
            && Array.isArray(data)
            && data.length > 0
            && data.filter((item) => item.role_name === authUserRole);
          if (selectedRecord && selectedRecord.length !== 0)
            setDynamicCharts(selectedRecord[0].grid_data);
        })
        .catch((err) => {
          if (err.response?.data.message)
            addToaster('error', 'Error', err.response.data.message);
          else addToaster('error', 'Error', 'Something went wrong');
        })
        .finally(() => setStateLoader(false));
    }

    if (isChartView) fetchDynamicCharts();
  }, [orgId, isChartView]);

  useEffect(() => {
    setCurrentPage(Number(page) || 1);
  }, [page]);

  useEffect(() => {
    const search = `?${eventId ? `eventId=${eventId}&` : ''}${eventId ? `profileButton=${profileButton}&` : ''
      }${next ? `next=${next}&` : ''}page=${currentPage}${vendorId ? '&vendorId=' + vendorId : ''}`;
    history.replace({
      pathname: '',
      search,
    });
  }, [currentPage]);

  useEffect(() => {
    if (orgId && jobFeature && jobCandidateFeature && jobId) {
      if (eventId)
        getCandidateList(
          orgId,
          currentPage,
          currentPageSize,
          jobId,
          filterData,
          sorterData,
          activeFilters,
          activeSorter,
          history,
          eventId
        );
      else if (vendorId)
        getCandidateList(
          orgId,
          currentPage,
          currentPageSize,
          jobId,
          filterData,
          sorterData,
          activeFilters,
          activeSorter,
          history,
          eventId,
          vendorId        );
      else
        getCandidateList(
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
    vendorId,
    jobFeature,
    filterData,
    sorterData,
    currentPage,
    currentPageSize,
    getCandidateList,
    jobCandidateFeature,
  ]);

  useEffect(() => {
    if (candidateList.length === 0) setDisabled(true);
    else setDisabled(false);
  });

  useEffect(() => {
    function getApps() {
      axios
        .get(`${APP_URL}/${orgId}/apps/?workflow_type=JOB_CANDIDATE`)
        .then((res) => {
          let apps = res.data?.data ?? [];
          if (apps.length > 1 && !apps[0]?.bulk_support && !apps[1]?.bulk_support) {
            setPrimaryApps(apps.splice(0, 2));
            setAllApps(apps);
          } else {
            setPrimaryApps(apps.splice(0, 1));
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
        returnBackTo: routes.JOB_VIEW.to(orgId, urlParamJobId, currentPage),
        redirectTo: routes.JOB_VIEW.to(orgId, urlParamJobId, currentPage),
        data: jobDetail,
      },
    });
  };

  const onStartBulkUpload = (app) => {
    setBulkProcess(app);
    setIsOpenImportModal(true)
  }

  const handleTableChange = (pagination, filters, sorter) => {
    const data = {
      columns,
      setFilterData,
      setSorterData,
      setCurrentPage,
      setActiveSorter,
      setActiveFilters,
      setCurrentPageSize,
      initialSortData: 'candidateId',
      firstColumnKey: columns[0].key,
      firstColumnCustomTitle: 'Candidate ID',
    };
    tableOnChangeHandler(pagination, filters, sorter, 'jobView', data);
  };

  const handleClearFilters = () => {
    setDrawerFilters({});
    clearFiltersHandler(setFilterData, setActiveFilters);
  };

  const toggleHandler = (checked) => {
    if (checked) setChartView(true);
    else setChartView(false);

    window.sendEvent("Hire_Actions_hiring_request_details",{
      HR_ID:jobId,
      Job_Role:jobRole,
      Job_Location_City:jobLocation,
      Clicks_on_toggle:true,
      Clicks_on_applicantstatusestab:false,
      Clicks_on_source_candidate:false
    })
  };

  let chartFilters = { ...dynamicChartFilters };
  if (eventId) chartFilters.event_id = eventId;
  // if (partnerName) chartFilters.sourcing_partner__name = [partnerName];
  let ChartComponents = vendorId ? [DefaultChartComponents[1]] : DefaultChartComponents;
  return (
    <Fragment>
      {stateLoader && <Spinner />}
      <div
        className="main_changable_container"
        style={{ height: window.innerHeight - 59 }}
      >
        <div className="process_details_tab_cont job-view">
          <ul className="process_tab_ongoing_comp_ul" id="myTab" role="tablist">

            <li className="process_tab_last_li candidate_tab_li ">
              <div className="process_details_btn_cont2">
                {!isVendorFlag && <Switch
                  disabled={disabled}
                  checkedChildren="Chart"
                  unCheckedChildren="List"
                  onChange={toggleHandler}
                />
                }

              </div>
              <div className="process_details_btn_cont">
                {addPermission
                  && availablePosition > 0
                  && profileButton === 'show'
                  && !isChartView
                  && jobStatus === 'Active' ? (
                  <Fragment>
                    <Button
                      variant='fancy_btn active'
                      onClick={() => setShowSideFilter(true)}
                    >
                      Filter
                    </Button>
                    {primaryApps.map(app => (
                      <>
                        {app?.bulk_support ? (
                          <DropDownButton
                            defaultButtonCondition
                            className='process_fancy_btn fancy_btn active'
                            defaultButtonName={`${app.name} Bulk`}
                            handleClick={() => onStartBulkUpload(app)}
                          >
                            <li style={{ padding: '2px 12px' }}>
                              <NavLink to={routes.JOB_CANDIDATE_HISTORY.to(orgId)}>
                                History
                              </NavLink>
                            </li>
                          </DropDownButton>
                          // <button
                          //   type='button'
                          //   className='process_fancy_btn fancy_btn active'
                          //   onClick={() => onStartBulkUpload(app)}
                          // >
                          //   {`${app.name} Bulk`}
                          // </button>

                        ) : null}
                        <button
                          type='button'
                          className='process_fancy_btn fancy_btn active'
                          onClick={() => {
                            window.sendEvent("Hire_Actions_hiring_request_details",{
                              HR_ID:jobId,
                              Job_Role:jobRole,
                              Job_Location_City:jobLocation,
                              Clicks_on_toggle:true,
                              Clicks_on_applicantstatusestab:false,
                              Clicks_on_source_candidate:true
                            })

                            window.sendEvent(`Hire_Click_${app.name} button`,{
                              HR_ID:jobId,
                              Job_Role:jobRole,
                              Job_Location_City:jobLocation,
                            })
                            onStartWorkflow(app)}}
                        >
                          {app.name}
                        </button>
                      </>
                    ))}
                    {allApps?.length && !isVendorFlag ? (
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
                {isChartView ? (
                  <button
                    type="button"
                    className="process_fancy_btn fancy_btn active"
                    disabled
                    onClick={() => setShowFilter(true)}
                  >
                    Filter
                  </button>
                ) : null}
              </div>
            </li>

          </ul>

          <div className="lists_pages ">
          {!isChartView ? (
            <ul className="nav nav-tabs process_tab_ongoing_comp_ul document_details_tabs candidate_tab_ul" role="tablist">
              <li
                role="presentation"
                className={tabs == "" ? "nav-item active left-border " : "nav-item left-border"}
              >
                <a
                  className="nav-link"
                  onClick={() => { fetchStateCandidate("") }}
                >
                  All({allcount})
                </a>
              </li>
              {stages?.map((item) => (
                <li
                  role="presentation"
                  className={tabs == item.label ? "nav-item left-border active" : "nav-item left-border"}
                >
                  <a
                      className="nav-link"
                      onClick={()=>{
                        window.sendEvent("Hire_Actions_hiring_request_details",{
                          HR_ID:jobId,
                          Job_Role:jobRole,
                          Job_Location_City:jobLocation,
                          Clicks_on_toggle:false,
                          Clicks_on_applicantstatusestab:true,
                          Clicks_on_source_candidate:false
                        })
                        fetchStateCandidate(item.label)
                      }}
                  >
                    {item.label}({item.count})

                  </a>

                </li>

              ))}

            </ul>
            ) : null}
          </div>

          {isChartView ? (
            <OverlayFilter
              showFilter={showFilter}
              filterData={dynamicChartFilters}
              filterDataHandler={setDynamicChartFilters}
              onCloseHandler={() => setShowFilter(false)}
            />
          ) : null}
          {isChartView ? (
            <Charts
              style={{
                height: 'calc(100vh - 160px)',
              }}
            >
              {ChartComponents
                && Array.isArray(ChartComponents)
                && ChartComponents.length > 0
                && ChartComponents?.map((item, index) => (
                  <Chart
                    key={`default-chart-${index + 1}`}
                    title={item.title}
                    type={item.chartType.id}
                    api={`${APP_URL}/${orgId}/jobs/chart`}
                    queryParams={{
                      chartName: item.chartContent.id,
                    }}
                    postData={{
                      job_id: jobId,
                      ...chartFilters,
                    }}
                  />
                ))}
              {dynamicCharts
                && Array.isArray(dynamicCharts)
                && dynamicCharts.length > 0
                && dynamicCharts.map((item, index) => (
                  <Chart
                    key={`dynamic-chart-${index + 1}`}
                    title={item.title}
                    type={item.chartType.id}
                    api={`${APP_URL}/${orgId}/jobs/chart`}
                    queryParams={{
                      chartName: item.chartContent.id,
                    }}
                    postData={{
                      job_id: jobId,
                      ...chartFilters,
                    }}
                  />
                ))}
            </Charts>
          ) : candidateList.length === 0 && isMobile() ? (
            <Empty />
          ) : (
            <AdvTable
              loading={loader}
              columns={columns}
              dataSource={candidateList}
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
          <BulkImport
            history={history}
            show={isOpenImportModal}
            commonVariables={commonVariables}
            // title={BULK_CANDIDATES_TITLE}
            // url={routes.JOB_CANDIDATE_HISTORY.api}
            // redirectUrl={routes.JOB_CANDIDATE_HISTORY.to(orgId)}
            title={`Bulk Initiate ${bulkProcess?.name} Process.`}
            url={`${APP_URL}/${orgId}/apps/${bulkProcess?.id}/bulk_initiate`}
            redirectUrl={routes.JOB_VIEW.to(orgId, urlParamJobId, currentPage)}
            handleShow={(value) => setIsOpenImportModal(value)}
          />
        </div>
      </div>
      <DrawerFilter showFilter={showSideFilter}
        onCloseHandler={() => setShowSideFilter(false)}
        filters={drawerFilters}
        mappedFields={mappedFields}
        type={'hiring-applicant'}
        setFilters={setDrawerFilters}
        locations={jobDetail.work_location?.length ? jobDetail.work_location?.map(i=>({name:i.work_location})) : null}
        applyFilter={(filterData) => setFilters(filterData)}
      />
    </Fragment>
  );
};

const mapStateToProps = ({ jobView, auth, task }) => ({
  jobDetail: jobView.job,
  candidateList: jobView.candidates,
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
  involved_groups: task.involved_groups,
  usergroupId: auth.id,
});

const mapDispatchToProps = {
  addToaster: addToast,
  getCandidateList: getCandidates,
  taskClaim: claimTask,
  taskAction: getTaskAction,
  getInvolvedUserGroupList: getInvolvedUserGroup
};

export default connect(mapStateToProps, mapDispatchToProps)(Applicants);
