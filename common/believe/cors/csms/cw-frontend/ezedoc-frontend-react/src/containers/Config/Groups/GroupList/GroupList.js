/* eslint-disable no-confusing-arrow */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, Fragment } from "react";
import { NavLink, useLocation, useParams } from "react-router-dom";
import { connect } from "react-redux";
import routes from 'urls'

import { parseQueryString, Item } from "containers/utils";
import {
  AdvTable,
  clearFiltersHandler,
  getColumnSearchProps,
  tableOnChangeHandler,
} from 'components/UI/AntDesignTable/AdvTable'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'

import ErrorPage from "containers/ErrorPage";
import { GroupUsers } from "./GroupRow";
import {
  getGroups,
  deleteGroup,
} from "../../../../store/actions/index";
import { HasAccess } from "../../../../platformDataStoreContext";
import UnauthorizedPage from "../../../UnauthorizedPage";
import Spinner from "../../../../components/UI/Spinner/Spinner";
import BulkImport from "../../../../components/UI/DocumentUpload/BulkImport";
import DeleteModel from "../../../../components/UI/DeleteModel/DeleteModal";
import { CW_SERVICE_GROUP_CREATE, CW_SERVICE_GROUP_DELETE, CW_SERVICE_GROUP_UPDATE, CW_SERVICE_GROUP_VIEW } from "../../../../Data/constants";

const APP_URL = process.env.REACT_APP_APP_URL;

const GroupList = (props) => {
  const [show, setShow] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const { uuid: orgId } = useParams();

  const [selectedGroup, setSelectedGroup] = useState({
    id: null,
    name: null,
  });

  const {
    totalCount,
    groups,
    loader,
    history,
    getGroups: getGroupsList,
    renderPage,
    storedSorter,
    storedFilters,
    storedPageSize,
    storedActiveFilters,
    storedActiveSorter
  } = props;
  const location = useLocation();
  const { page } = parseQueryString(location.search);

  const [filterData, setFilterData] = useState(storedFilters)
  const [activeFilters, setActiveFilters] = useState(storedActiveFilters)
  const [sorterData, setSorterData] = useState(storedSorter)
  const [activeSorter, setActiveSorter] = useState(storedActiveSorter)
  const [currentPage, setCurrentPage] = useState(Number(page) || 1)
  const [currentPageSize, setCurrentPageSize] = useState(storedPageSize)

  const showWarningModal = (id, name) => {
    setShowWarning(true);
    setSelectedGroup({
      id,
      name,
    });
  };

  const handleDelete = () => {
    props.groupDelete(orgId, selectedGroup.id, totalCount, currentPageSize, currentPage, renderPage);
    setShowWarning(false);
  };

  const columns = [
    {
      title: () => (
        <div className='adv-table-total-items-parent'>
          Group Name
          <div className='adv-table-total-items'>{totalCount > 99999 ? '99999+' : totalCount}</div>
        </div>
      ),
      dataIndex: 'name',
      key: 'group',
      backendKey: 'name',
      sorter: true,
      ellipsis: true,
      defaultSortOrder: 'ascend',
      sortDirections: sorterData === 'name' ? ['descend'] : ['ascend', 'descend'],
      ...getColumnSearchProps(filterData, 'name', 'group name'),
      render: (text, record) => <Item type='text' data={text} id={record.id} name='group-name' />,
      sortOrder: activeSorter.columnKey === 'group' ? activeSorter.order : false,
    },
    {
      title: 'Users',
      dataIndex: 'users',
      key: 'users',
      backendKey: 'users__email',
      ellipsis: true,
      render: (text, record) => <GroupUsers users={[...record.users]} id={record.id} />,
      ...getColumnSearchProps(filterData, 'users__email', 'users'),
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      key: 'actions',
      align: 'center',
      width: '10%',
      render: (text, record) => {
        let content1 = null
        // let content2 = null

        content1 = (
          <HasAccess
            permissions={[CW_SERVICE_GROUP_UPDATE]}
              yes={() => (
                <Item
                  type='icon'
                  data='Edit'
                  id={record.id}
                  name='group-edit-icon'
              >
                  <NavLink
                      to={routes.GROUP_EDIT.to(orgId, record.id, page)}
                  >
                      <EditOutlined
                          data-tip
                          data-for={`group-edit-icon-${record.id}`}
                      />
                  </NavLink>
              </Item>
              )}
          />
      )

        // content2 = (
        //   <HasAccess
        //     permissions={[CW_SERVICE_GROUP_DELETE]}
        //       yes={() => (
        //         <Item
        //           type='icon'
        //           data='Delete'
        //           id={record.id}
        //           name='group-delete-icon'
        //         >
        //           <DeleteOutlined
        //             data-tip
        //             data-for={`group-delete-icon-${record.id}`}
        //             onClick={() => showWarningModal(record.id, record.name)}
        //           />
        //         </Item>
        //       )}
        //   />
        // )

        return(
          <Fragment>
              {content1 || null}
              {/* {content1 && content2 ? <span>&nbsp;&nbsp;&nbsp;</span> : null} */}
              {/* {content2 || null} */}
          </Fragment>
      )
      }
    }
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
    getGroupsList(orgId, currentPage, currentPageSize, filterData, sorterData, activeFilters, activeSorter, history)
  }, [
    orgId,
    filterData,
    sorterData,
    renderPage,
    getGroupsList,
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
      firstColumnCustomTitle: 'Group Name',
    }
    tableOnChangeHandler(pagination, filters, sorter, 'groups', data)
  }

  const handleClearFilters = () => {
    clearFiltersHandler(setFilterData, setActiveFilters)
  }

  return (
    <HasAccess
      permissions={[CW_SERVICE_GROUP_VIEW]}
      yes={() => (
        <div>
          {loader && <Spinner />}
          {props.error 
          ? ( 
            <ErrorPage />
          ) : (
            <div
            className="main_changable_container"
            style={{ height: window.innerHeight - 56 - 3 }}
            >
            <div className="process_details_tab_cont config_groups_view">
              <ul className="process_tab_ongoing_comp_ul" id="myTab" role="tablist">
                <li className="process_tab_last_li">
                  <div className="process_details_btn_cont">
                    {(
                      <HasAccess
                        permissions={[CW_SERVICE_GROUP_CREATE]}
                          yes={() => (
                            <div style={{ display: "flex" }}>
                              {/* <DropDownButton
                                handleClick={() => setShow(true)}
                                defaultButtonName="Import"
                                defaultButtonCondition
                              >
                                <li style={{ padding: "2px 0" }}>
                                  <NavLink to={`/custom-workflow/org/${orgId}/config/groups/import-history`}>History</NavLink>
                                </li>
                              </DropDownButton> */}
                              {/* <NavLink to={routes.GROUP_CREATE.to(orgId, page)}>
                                <button
                                  type="button"
                                  className="process_fancy_btn fancy_btn active"
                                >
                                  <span>Add Group</span>
                                </button>
                              </NavLink> */}
                            </div>
                          )}
                      />
                    )}
                  </div>
                </li>
              </ul>
              {/* <DeleteModel
                show={showWarning}
                itemName={selectedGroup.name}
                handleDelete={handleDelete}
                hideWarning={() => {
                    setShowWarning(false);
                }}
              /> */}
              <BulkImport
                show={show}
                handleShow={setShow}
                    url={`${APP_URL}/${orgId}/config/groups/import_bulk_groups`}
                title="Import Groups"
                history={history}
                redirectUrl={`/custom-workflow/org/${orgId}/config/groups/import-history`}
              />
              <AdvTable
                  loading={loader}
                  columns={columns}
                  dataSource={groups}
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
            </div>
            </div>
          )}
        </div>
      )}
      no={() => (
        <UnauthorizedPage />
      )}
    />
  );
};

const mapStateToProps = (state) => ({
  groups: state.groups.data,
  error: state.groups.error,
  loader: state.groups.loader,
  active: state.groups.active,
  totalCount: state.groups.total,
  renderPage: state.groups.renderPage,
  storedPageSize: state.groups.size,
  storedFilters: state.groups.filters,

  storedSorter: state.groups.sorter,
  storedActiveSorter: state.groups.activeSorter,
  storedActiveFilters: state.groups.activeFilters,
});

const mapDispatchToProps = {
  getGroups,
  groupDelete: deleteGroup,
};

export default connect(mapStateToProps, mapDispatchToProps)(GroupList);
