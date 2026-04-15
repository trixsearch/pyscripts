import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { AdvTable, tableOnChangeHandler, getColumnSearchProps } from "../../components/UI/AntDesignTable/AdvTable";
import { useParams } from "react-router-dom";
import { CW_SERVICE_TASKS_ACTION, PROCESS_DATETIME_FORMAT } from "../../Data/constants";
import moment from "moment";
import Axios from "axios";
import { COMPLETED_TASKS, MY_TASKS, GROUP_TASKS } from "./TaskConstants";
import { Button } from "../../components/UI/AppButton/AppButton";
import { getTaskAction, claimTask } from "../../store/actions";
import Spinner from "../../components/UI/Spinner/Spinner";
import { HasAccess } from "../../platformDataStoreContext";
import { addToast } from "../../components/Toast/actions";

const APP_URL = process.env.REACT_APP_APP_URL;
const initiatorValues = {};

const TasksList = props => {
  const { 
    tasks, loader, taskType, claimFailTaskRefreshHandler, selectedTasks, setSelectedTasks,
    filterData, setFilterData, filterKeys, fetchFilterTasks
  } = props;
  const { uuid: orgId } = useParams();
  const [loaderCount, setLoaderCount] = useState(0)
  const [variables, setVariables] = useState({})
  const [checkboxColWidth, setCheckboxColWidth] = useState(0)

  const taskAction = (task) => {
    props.getTaskAction(orgId, task.id, props.history, task.assignee, props.current_task_owner.userId)
  }


  const taskClaim = (task) => {
    props.claimTask(orgId, task.id, props.history, task.assignee, props.current_task_owner, claimFailTaskRefreshHandler);
  };

  const handleCheckboxClick = (e, record) => {
    if (e.target.checked) {
      setSelectedTasks([
        ...selectedTasks,
        {
          "name": record?.name,
          "id": record?.id,
          "assignee": record?.assignee,
          "processInstanceId": record?.processInstanceId,
          "formKey": record?.formKey
        }
      ])
    } else {
      const tempSelectedCandidate = selectedTasks?.filter((value) => {
        return value?.id !== record.id;
      });
      setSelectedTasks([...tempSelectedCandidate])
    }
  }

  const isDisabledHeaderRowCheckbox = () => {
    return Array.isArray(tasks) && 
    !tasks?.filter((task) => task?.category && task.category === "bulk")?.length;
  }

  const isAllChecked = () => {
    if (Array.isArray(tasks) && !isDisabledHeaderRowCheckbox()) {
      if (!tasks?.length)
        return false

      const filtered = tasks?.filter(item => {
        return (item?.category && item?.category === "bulk") ?
        !selectedTasks?.some(data => data?.id === item?.id) : false
      })
      return !filtered?.length
    }
    return false
  }

  const checkAll = (checked) => {
    const tempArr = [];
    if (checked) {
      Array.isArray(tasks) && tasks?.map((val) => {
        const alreadyPresent = selectedTasks?.some(data => val.id === data?.id)
        if (!alreadyPresent && val?.category && val?.category === "bulk") {
          tempArr.push({
            "name": val?.name,
            "id": val?.id,
            "assignee": val?.assignee,
            "processInstanceId": val?.processInstanceId,
            "formKey": val?.formKey
          })
        }
      })
      setSelectedTasks([
        ...selectedTasks,
        ...tempArr
      ])
    } else {
      const filtered = selectedTasks?.filter(data => {
        return !tasks?.some(item => {
          return item.id === data?.id
        })
      })
      setSelectedTasks(filtered)
    }
  }

  const unClaimTask = (record) => {
    setLoaderCount(1);
    Axios.post(`${APP_URL}/${orgId}/proxy-bpm/tasks/${record?.id}`, { "action" : "unclaim" })
      .then((res) => {
        props.addToast('success', 'Success', res?.data?.message);
        setLoaderCount(0);
        fetchFilterTasks();
      })
      .catch(() => {
        props.addToast('error', 'Error', 'Task unclaim failed!');
        setLoaderCount(0);
      })
  } 

  const getColumns = () => {
    const startTimeHeader = {
      'completed_tasks': 'Start Date & Time',
      'tasks': 'Created Date & Time',
      'group_tasks': 'Created Date & Time'
    }
    const endTimeHeader = {
      'completed_tasks': 'End Date & Time',
      'tasks': 'Due Date & Time',
      'group_tasks': 'Due Date & Time'
    }
    const col = [
      ...(taskType !== COMPLETED_TASKS && checkboxColWidth !== 0 ? [{
        title: (record) => (
          <HasAccess
            permissions={[CW_SERVICE_TASKS_ACTION]}
            yes={() => (
              <input disabled={isDisabledHeaderRowCheckbox()} type="checkbox" className="checkBox" id="candidate" value={record} checked={isAllChecked()} onChange={e => checkAll(e.target.checked)} />
            )}
          />
        ),
        width: checkboxColWidth,
        fixed: "left",
        render: (record) => {
          return (
            <HasAccess
              permissions={[CW_SERVICE_TASKS_ACTION]}
              yes={() => (
                  <input 
                      disabled={!(record?.category && record?.category === "bulk")} 
                      type="checkbox" 
                      className="checkBox" 
                      id={record?.id} 
                      checked={selectedTasks?.some(data => data?.id === record.id)} 
                      value={record} 
                      onChange={e => handleCheckboxClick(e, record)} 
                  />
              )}
            />
          )
        }
      }] : []),
      {
        title: 'Task Title',
        dataIndex: 'name',
        key: 'task_name',
        sorter: false,
        ellipsis: true,
        width: 150,
        fixed: "left"
      },
      ...((Array.isArray(props?.task_view_columns) && props?.task_view_columns?.length) ? props?.task_view_columns?.map((item, colInd) => {
        return {
          title: item?.title,
          dataIndex: item?.dataIndex,
          key: item?.key,
          sorter: false,
          ellipsis: true,
          backendKey: item?.dataIndex,
          fixed: colInd < 2 && "left",
          width: item?.width || 150,
          ...(filterKeys?.find(filter => filter.key === item.key) ? {} : getColumnSearchProps(filterData, item.key, item?.title)),
          render: (_, record) => {
            return variables[record?.processInstanceId+(record?.formKey || "")]?.[item?.key] || '-'
          }
        }
      }) : []),
      {
        title: startTimeHeader[taskType],
        dataIndex: 'createTime',
        key: 'createTime',
        sorter: false,
        ellipsis: true,
        width: 150,
        render: (_, record) => {
          return taskType === COMPLETED_TASKS ? moment(record?.startTime).format(PROCESS_DATETIME_FORMAT) : record.createTime ? (
            moment(record.createTime).format(PROCESS_DATETIME_FORMAT)
          ) : (
            "-"
          )
        }
      },
      {
        title: endTimeHeader[taskType],
        dataIndex: 'dueDate',
        key: 'dueDate',
        sorter: false,
        ellipsis: true,
        width: 150,
        render: (_, record) => {
          return taskType === COMPLETED_TASKS ? moment(record?.endTime).format(PROCESS_DATETIME_FORMAT) : record.dueDate ? (
            moment(record.dueDate).format(PROCESS_DATETIME_FORMAT)
          ) : (
            "-"
          )
        }
      }
    ];
    if (taskType !== COMPLETED_TASKS) {
      col.push(
        {
          title: 'Action',
          dataIndex: 'action',
          key: 'address',
          sorter: false,
          ellipsis: true,
          width: (Array.isArray(props?.task_view_columns) && props?.task_view_columns?.length) ? 180 : 130,
          fixed: 'right',
          render: (text, record) => {
            return (
              <HasAccess
                permissions={[CW_SERVICE_TASKS_ACTION]}
                yes={() => {
                  if(checkboxColWidth === 0){
                    setCheckboxColWidth(35)
                  }
                  return (
                    taskType === MY_TASKS
                    ? (
                    <>
                      <Button customStyle={{ minWidth: "88px", padding: "0px" }} variant="primary" onClick={() => taskAction(record)}>
                        <span className="ezedox_text_task">Action</span>
                      </Button>
                      <Button 
                        disabled={!record?.claimTime} 
                        customStyle={{ 
                          minWidth: "88px", 
                          marginLeft: "10px", 
                          padding: "0px",
                          color: "#ffffff",
                          backgroundImage: `linear-gradient(100deg, #${record?.claimTime ? "FF706F" : "D9DBDE"}, #${record?.claimTime ? "FF706F" : "D9DBDE"})`
                        }} 
                        variant="primary" 
                        onClick={() => unClaimTask(record)}
                      >
                        <span className="ezedox_text_task">Unclaim</span>
                      </Button>
                    
                    </>
                    ) : (
                      <Button variant="primary" onClick={() => taskClaim(record)}>
                        <span className="ezedox_text_task">Start</span>
                      </Button>
                    )
                  )}
              }
            />
            )
          }
        },
      )
    }
    return col
  }
  useEffect(() => { 
    async function fetchData() {
      try {
        setLoaderCount(tasks?.length > 10 ? 10 : tasks.length);
        Array.isArray(tasks) && tasks?.map((task) => {
          if (task?.processInstanceId) {
            const callUrl = `${APP_URL}/${orgId}/proxy-bpm/process-instances/variables/${task?.processInstanceId}?formKey=${task?.formKey}${taskType === COMPLETED_TASKS ? "&type=history" : ""}`;
            const dataKey = "https"+task?.processInstanceId+(task?.formKey || "")+(taskType === COMPLETED_TASKS ? "history" : "")
            const fetchTaskData = (avoidLoaderUpdate) => {
              Axios.get(callUrl).then((response) => {
                const responseData = response?.data?.data;
                const updateVarData = () => {
                  try {
                    localStorage.setItem(dataKey, JSON.stringify({
                      data: responseData,
                      time: new Date()?.getTime()
                    }))
                  } catch {
                    // if localstorage does not work because of key have some unwanted symbols it should work as it is
                    // tha's why this try and catch is.
                  }
                  setVariables(prev => (
                    ({
                      ...prev,
                      [task?.processInstanceId+(task?.formKey || "")]: responseData
                    })
                  ));
                  if(!avoidLoaderUpdate)
                    setLoaderCount(prev => prev - 1)
                }
                // if(responseData["initiator"]){ commenting to avoid more api calls 
                //   if(initiatorValues[responseData["initiator"]]){
                //     responseData["initiator"] = initiatorValues[responseData["initiator"]];
                //     updateVarData();
                //   } else {
                //     Axios.post(`${APP_URL}/${orgId}/users/org_users/transform_userid`, [responseData["initiator"]])
                //       .then((res) => {
                //         const initiatorValue = res?.data?.data;
                //         initiatorValues[responseData["initiator"]] = initiatorValue[responseData["initiator"]];
                //         responseData["initiator"] = initiatorValue[responseData["initiator"]] || responseData["initiator"];
                //         updateVarData();
                //       })
                //       .catch(() => {
                //         updateVarData()
                //       })
                //   }
                // } else {
                  updateVarData()
                // }
              }).catch(error => {
                if(!avoidLoaderUpdate)
                  setLoaderCount(prev => prev - 1);
              })
            }
            try {
                const cachedDataStr = localStorage?.getItem(dataKey);
                const cachedData = cachedDataStr && JSON.parse(cachedDataStr);
                if(cachedData && cachedData?.time > new Date()?.getTime() - 10*60*1000) {
                  setVariables(prev => (
                    ({
                      ...prev,
                      [task?.processInstanceId+(task?.formKey || "")]: cachedData?.data
                    })
                  ));
                  setLoaderCount(prev => prev - 1)
                  fetchTaskData(true);
                } else {
                  localStorage.removeItem(callUrl);
                  fetchTaskData();
                }
            } catch {
              fetchTaskData();
            }
            
          }
        })
      } catch (error) {
        setLoaderCount(0)
        return error;
      }

      return null;
    }
    setSelectedTasks([])
    if (Array.isArray(tasks) && (taskType === MY_TASKS || taskType === GROUP_TASKS || taskType === COMPLETED_TASKS)) {
      fetchData();
    }
    else {
      setLoaderCount(0)
    }
  }, [taskType, tasks]);

  const handleTableChange = (pagination, filters, sorter) => {
    const data = {
      columns: getColumns(),
      setFilterData,
      setSorterData: () => {},
      setCurrentPage: () => {},
      setActiveSorter: () => {},
      setActiveFilters: () => {},
      setCurrentPageSize: () => {},
      initialSortData: taskType === COMPLETED_TASKS ? "startTime" : "createTime",
      firstColumnKey: getColumns()[0].key,
    };
    if(pagination?.current !== props.active || pagination?.pageSize){
      props?.handlePageChange(pagination?.current, pagination?.pageSize)
    }
    tableOnChangeHandler(pagination, filters, sorter, "tasks", data);
  };

  const isTableLoading = loader || (loaderCount > 0) || tasks === "Loader_true";

  return (
    <div 
      className="task_details_container"
    >
      {isTableLoading && <Spinner />}
      <AdvTable
        loading={isTableLoading}
        columns={getColumns()}
        dataSource={(Array.isArray(tasks) && !isTableLoading) ? tasks : []}
        pagination={{
          total: props?.totalTaskCount,
          current: props?.active || 1,
          pageSize: props.pageSize || 10,
        }}
        rowKey={(record) => record.id}
        onChange={handleTableChange}
        scroll={{
          x: "max-content",
          y: "max-content"
        }}
      />
    </div>
  );
};

const mapStateToProps = state => ({
  tasks: state.task.tasks,
  current_task_owner: state.auth.current_task_owner,
  active: state.task.active,
  pageSize: state.task.size,
});

const mapDispatchToProps = dispatch => ({
  claimTask: (orgId, id, history, assignee, current_task_owner, handler) => dispatch(claimTask(orgId, id, history, assignee, current_task_owner, handler)),
  getTaskAction: (orgId, id, history, assignee, current_task_owner) => dispatch(getTaskAction(orgId, id, history, assignee, current_task_owner)),
  addToast: (type, title, message) => dispatch(addToast(type, title, message))
});


export default connect(mapStateToProps, mapDispatchToProps)(TasksList);
