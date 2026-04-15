
/* eslint-disable no-confusing-arrow */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, Fragment } from "react";
import { NavLink, useLocation, useParams } from "react-router-dom";
import { connect } from "react-redux";
import routes from 'urls'
import { parseQueryString, Item, isMobile } from "containers/utils";

import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import Empty from 'components/Empty'
import {
  AdvTable,
  clearFiltersHandler,
  getColumnSearchProps,
  tableOnChangeHandler,
} from '../../../components/UI/AntDesignTable/AdvTable'
import { getJobRole, deleteJobRole } from "../../../store/actions/Hiring/JobRole";
import Spinner from "../../../components/UI/Spinner/Spinner";
import DeleteModel from "../../../components/UI/DeleteModel/DeleteModal";

import './JobRole.css'

const JobRoleList = (props) => {
    const {
      history,
      getJobRoleList,
      feature,
      loader,
      addPermission,
      editPermission,
      deletePermission,
      totalCount,
      jobRole,
      renderPage,
      storedSorter,
      storedFilters,
      storedPageSize,
      storedActiveFilters,
      storedActiveSorter
    } = props;
  
    const location = useLocation();
    const { page = 1 } = parseQueryString(location.search);
    const { uuid: orgId } = useParams();
  
    const [filterData, setFilterData] = useState(storedFilters)
    const [activeFilters, setActiveFilters] = useState(storedActiveFilters)
    const [sorterData, setSorterData] = useState(storedSorter)
    const [activeSorter, setActiveSorter] = useState(storedActiveSorter)
    const [currentPage, setCurrentPage] = useState(Number(page) || 1)
    const [currentPageSize, setCurrentPageSize] = useState(storedPageSize)
    const [showWarning, setShowWarning] = useState(false);
    const [selectedJobRole, setSelectedJobRole] = useState({
      id: null,
      name: null,
    });

    const showWarningModal = (id, name) => {
        setSelectedJobRole({ id, name });
        setShowWarning(true);
      };
    
      const handleDelete = () => {
        props.deleteJobRole(orgId, selectedJobRole.id, totalCount, currentPageSize, currentPage, renderPage);
        setShowWarning(false);
        window.sendEvent("Hire_Delete_job_role ",{
          Job_role_deleted:selectedJobRole.name
          })
      };


      const columns = [
        {
          title: () => (
            <div className='adv-table-total-items-parent'>
              Name
              <div className='adv-table-total-items'>{totalCount > 99999 ? '99999+' : totalCount}</div>
            </div>
          ),
          dataIndex: 'name',
          key: 'jobRoleName',
          backendKey: 'name',
          sorter: true,
          ellipsis: true,
          defaultSortOrder: 'ascend',
          sortDirections: sorterData === 'name' ? ['descend'] : ['ascend', 'descend'],
          ...getColumnSearchProps(filterData, 'name', 'jobrole name'),
          render: (text, record) => <Item type='text' data={text} id={record.id} name='job-role-id' />,
          sortOrder: activeSorter.columnKey === 'jobRoleName' ? activeSorter.order : false,
        },
        {
          title: 'Actions',
          dataIndex: 'actions',
          key: 'actions',
          width: '7%',
          align: 'center',
          render: (text, record) => {
            let content1 = null;
            let content2 = null;

            if (editPermission) content1 = (
              <Item
                  type='icon'
                  data='Edit'
                  id={record.id}
                  name='job-edit-icon'
              >
                  <NavLink
                      to={routes.JOB_ROLE_EDIT.to(orgId, record.id, page)}
                  >
                      <EditOutlined
                          data-tip
                          data-for={`job-edit-icon-${record.id}`}
                          onClick={()=>window.sendEvent("Hire_Clicks_on_job_role_edit ")}
                      />
                  </NavLink>
              </Item>
          )

            if (deletePermission) content2 = (
              <Item
                type='icon'
                data='Delete'
                id={record.id}
                name='job-role-delete-icon'
              >
                <DeleteOutlined
                  data-tip
                  data-for={`job-role-delete-icon-${record.id}`}
                  onClick={() => showWarningModal(record.id, record.name)}
                />
              </Item>
            )
            return (
                    <Fragment>
                        {content1 || null}
                        {content1 && content2 ? <span>&nbsp;&nbsp;&nbsp;</span> : null}
                        {content2 || null}
                    </Fragment>
                )
          }
        },
      ]
      useEffect(() => {
        setCurrentPage(Number(page) || 1)
      }, [page])
    
      useEffect(() => {
        history.replace({
          pathname: '',
          search: `?page=${currentPage}`
        })
      }, [currentPage])
    
      useEffect(() => {
        if (feature) getJobRoleList(orgId, currentPage, currentPageSize, filterData, sorterData, activeFilters, activeSorter, history)
      }, [
        orgId,
        feature,
        filterData,
        sorterData,
        renderPage,
        getJobRoleList,
        currentPage,
        currentPageSize,
      ])
    
      const handleTableChange = (pagination, filters, sorter) => {
        const data = {
          columns,
          setFilterData,
          setSorterData,
          setCurrentPage,
          setActiveSorter,
          setActiveFilters,
          setCurrentPageSize,
          initialSortData: 'name',
          firstColumnKey: columns[0].key,
          firstColumnCustomTitle: 'JobRole Name',
        }
        tableOnChangeHandler(pagination, filters, sorter, 'jobrole', data)
      }
    
      const handleClearFilters = () => {
        clearFiltersHandler(setFilterData, setActiveFilters)
      }
      return (
        <>
          {loader && <Spinner />}
          <div className='main_changable_container' style={{ height: window.innerHeight - 59 }}>
            <div className="process_details_tab_cont config_user_view">
              <ul
                className="process_tab_ongoing_comp_ul"
                id="myTab"
                role="tablist"
              >
                <li className="process_tab_last_li">
                  <div className="process_details_btn_cont">
                    <div>
                      {addPermission ? (
                        <NavLink to={routes.JOB_ROLE_CREATE.to(orgId, page)}>
                          <button
                            type="button"
                            className="process_fancy_btn fancy_btn active"
                            onClick={()=>window.sendEvent("Hire_Click_on_add_role")}
                          >
                            <span>Add Role</span>
                          </button>
                        </NavLink>
                      ) : (
                        <div />
                      )}
                    </div>
                  </div>
                </li>
              </ul>
              <DeleteModel
                show={showWarning}
                itemName={selectedJobRole.name}
                handleDelete={handleDelete}
                hideWarning={() => {
                  setShowWarning(false);
                }}
              />
              {jobRole.length===0 && isMobile() ? <Empty/>
              :(
<AdvTable
                loading={loader}
                columns={columns}
                dataSource={jobRole}
                pagination={{
                  total: totalCount,
                  current: currentPage,
                  pageSize: currentPageSize,
                }}
                rowKey={record => record.id}
                onChange={handleTableChange}
                activeFilters={activeFilters}
                handleClearFilters={handleClearFilters}
/>
)
              }
            </div>
          </div>
        </>
      );
    };
    
    const mapStateToProps = (state) => ({
      jobRole: state.jobRole.data,
      loader: state.jobRole.loader,
      addPermission: state.auth.uiPermissions.jobrole.add,
      editPermission: state.auth.uiPermissions.jobrole.change,
      deletePermission: state.auth.uiPermissions.jobrole.delete,
      totalCount: state.jobRole.total,
      renderPage: state.jobRole.renderPage,
      feature: state.auth.uiFeatures.jobrole.view,
      storedPageSize: state.jobRole.size,
      storedFilters: state.jobRole.filters,
    
      storedSorter: state.jobRole.sorter,
      storedActiveSorter: state.jobRole.activeSorter,
      storedActiveFilters: state.jobRole.activeFilters,
    });
    
    const mapDispatchToProps = {
      getJobRoleList: getJobRole,
      deleteJobRole,
    };
    
    export default connect(mapStateToProps, mapDispatchToProps)(JobRoleList);
