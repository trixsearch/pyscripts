
/* eslint-disable no-confusing-arrow */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, Fragment } from "react";
import { NavLink, useLocation, useParams } from "react-router-dom";
import { connect } from "react-redux";
import routes from 'urls'
import axios from 'axios'
import { parseQueryString, Item } from "containers/utils";

import {
  AdvTable,
  clearFiltersHandler,
  getColumnSearchProps,
  tableOnChangeHandler,
} from 'components/UI/AntDesignTable/AdvTable'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { getDepartment, deleteDepartment } from "../../../../store/actions/index";
import Spinner from "../../../../components/UI/Spinner/Spinner";
import DeleteModel from "../../../../components/UI/DeleteModel/DeleteModal";

const APP_URL = process.env.REACT_APP_APP_URL;

const DepartmentList = (props) => {
  const {
    history,
    getDepartmentsList,
    feature,
    loader,
    addPermission,
    editPermission,
    deletePermission,
    totalCount,
    department,
    renderPage,
    storedSorter,
    storedFilters,
    storedPageSize,
    storedActiveFilters,
    storedActiveSorter,
    storedExtraColumns
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
  const [selectedDept, setSelectedDept] = useState({
    id: null,
    name: null,
  });
  const [extraColumns, setExtraColumns] = useState(storedExtraColumns)

  const showWarningModal = (id, name) => {
    setSelectedDept({ id, name });
    setShowWarning(true);
  };

  const handleDelete = () => {
    props.deleteDepartment(orgId, selectedDept.id, totalCount, currentPageSize, currentPage, renderPage);
    setShowWarning(false);
  };

  let columns = [
    {
      title: () => (
        <div className='adv-table-total-items-parent'>
          Department Name
          <div className='adv-table-total-items'>{totalCount > 99999 ? '99999+' : totalCount}</div>
        </div>
      ),
      dataIndex: 'name',
      key: 'departmentName',
      backendKey: 'department__name',
      fixed: 'left',
      width: 215,
      sorter: true,
      ellipsis: true,
      defaultSortOrder: 'ascend',
      sortDirections: sorterData === 'department__name' ? ['descend'] : ['ascend', 'descend'],
      ...getColumnSearchProps(filterData, 'department__name', 'department name'),
      render: (text, record) => <Item type='text' data={text} id={record.id} name='department-name' placement='right' />,
      sortOrder: activeSorter.columnKey === 'departmentName' ? activeSorter.order : false,
    },
    {
      title: 'Department Head',
      dataIndex: 'head',
      key: 'departmentHead',
      backendKey: 'head__email',
      width: 150,
      sorter: true,
      ellipsis: true,
      render: (head, record) => head ? <Item type='text' data={head.email} id={record.id} name='department-head-email' /> : '',
      ...getColumnSearchProps(filterData, 'head__email', 'department head'),
      sortOrder: activeSorter.columnKey === 'departmentHead' ? activeSorter.order : false,
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      key: 'actions',
      align: 'center',
      fixed: 'right',
      width: 70,
      render: (text, record) => {
        let content1 = null;
        let content2 = null;

        if (editPermission) content1 = (
          <Item
              type='icon'
              data='Edit'
              id={record.id}
              name='department-edit-icon'
          >
              <NavLink
                  to={routes.DEPARTMENT_EDIT.to(orgId, record.id, page)}
              >
                  <EditOutlined
                      data-tip
                      data-for={`department-edit-icon-${record.id}`}
                  />
              </NavLink>
          </Item>
      )

        if (deletePermission) content2 = (
          <Item
            type='icon'
            data='Delete'
            id={record.id}
            placement='left'
            name='department-delete-icon'
          >
            <DeleteOutlined
              data-tip
              data-for={`department-delete-icon-${record.id}`}
              onClick={() => showWarningModal(record.id, record.name)}
            />
          </Item>
        )
        return(
          <Fragment>
              {content1 || null}
              {content1 && content2 ? <span>&nbsp;&nbsp;&nbsp;</span> : null}
              {content2 || null}
          </Fragment>
      )
      }
    },
  ]

  const fetchExtraFields = () => {
    axios
      .get(`${APP_URL}/${orgId}/config/custom_attribute/get_attribute?type=departments`)
      .then(res => setExtraColumns(res.data.data.components))
  }
  useEffect(() => {
    // Fetch extra field details
    fetchExtraFields()
  }, [])

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
    if (feature) getDepartmentsList(orgId, currentPage, currentPageSize, filterData, sorterData, activeFilters, activeSorter, extraColumns, history)
  }, [
    orgId,
    feature,
    filterData,
    sorterData,
    renderPage,
    getDepartmentsList,
    currentPage,
    currentPageSize,
  ])

  let columnDetails = [...columns]
  if (department) {
    // Creating & Maintaining Extra (Dynamic) Column Details
    let extraColumnDetails = []
    extraColumns.forEach(column => {
      const compKey = column.key
      const compLabel = column.label
      const compType = column.type
      let columnData = {}
      if (column.type !== 'list') {
        columnData = {
          title: compLabel,
          dataIndex: 'extra_fields',
          key: compKey,
          backendKey: `department__extra_fields__${compKey}`,
          sorter: true,
          ellipsis: true,
          width: 110,
          render: (extra_fields, record) => extra_fields ? <Item type='text' data={extra_fields[compKey]} id={record.id} name={`department-extra-field-${compKey}`} /> : '',
          ...getColumnSearchProps(filterData, `department__extra_fields__${compKey}`, compLabel, compType),
          sortOrder: activeSorter.columnKey === compKey ? activeSorter.order : false,
        }

      } else {
        columnData = {
          title: compLabel,
          dataIndex: 'extra_fields',
          key: compKey,
          backendKey: `department__extra_fields__${compKey}`,
          ellipsis: true,
          width: 110,
          render: (extra_fields, record) => {
            if (extra_fields[compKey]) {
              if (typeof (extra_fields[compKey]) === 'object') {
                let multiData = []
                if (column.isMulti === true) {
                  extra_fields[compKey].forEach(data => multiData.push(data.value))
                } else {
                  multiData.push(extra_fields[compKey].value)
                }
                return (
                  <Item
                    type='list'
                    id={record.id}
                    multiData={multiData}
                    name={`department-extra-field-${compKey}`}
                  />
                )
              }
            } return ""
          }
        }
      }
      extraColumnDetails.push(columnData)

    })

    const lastItem = columns.pop()
    columnDetails = [...columns, ...extraColumnDetails, lastItem]
  }

  const handleTableChange = (pagination, filters, sorter) => {
    const data = {
      setFilterData,
      setSorterData,
      setCurrentPage,
      setActiveSorter,
      setActiveFilters,
      setCurrentPageSize,
      columns: columnDetails,
      initialSortData: 'department__name',
      firstColumnKey: columnDetails[0].key,
      firstColumnCustomTitle: 'Department Name',
    }
    tableOnChangeHandler(pagination, filters, sorter, 'departments', data)
  }

  const handleClearFilters = () => {
    clearFiltersHandler(setFilterData, setActiveFilters)
  }

  return (
    <>
      {loader && <Spinner />}
        <div
          className="main_changable_container"
          style={{ height: window.innerHeight - 56 - 3 }}
        >
          <div className="process_details_tab_cont config_dept_view">
            <ul
              className="process_tab_ongoing_comp_ul"
              id="myTab"
              role="tablist"
            >
              <li className="process_tab_last_li">
                <div className="process_details_btn_cont">
                  <div>
                    {addPermission ? (
                      <NavLink to={routes.DEPARTMENT_CREATE.to(orgId, page)}>
                        <button
                          type="button"
                          className="process_fancy_btn fancy_btn active"
                        >
                          <span>Add Department</span>
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
              itemName={selectedDept.name}
              handleDelete={handleDelete}
              hideWarning={() => {
                setShowWarning(false);
              }}
            />
            <AdvTable
              loading={loader}
              columns={columnDetails}
              dataSource={department}
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
    </>
  );
};

const mapStateToProps = (state) => ({
  department: state.department.data,
  loader: state.department.loader,
  message: state.department.message,
  addPermission: state.auth.uiPermissions.department.add,
  editPermission: state.auth.uiPermissions.department.change,
  deletePermission: state.auth.uiPermissions.department.delete,
  totalCount: state.department.total,
  renderPage: state.department.renderPage,
  feature: state.auth.uiFeatures.department.view,
  storedPageSize: state.department.size,
  storedFilters: state.department.filters,

  storedSorter: state.department.sorter,
  storedActiveSorter: state.department.activeSorter,
  storedActiveFilters: state.department.activeFilters,
  storedExtraColumns: state.department.extraColumns,
});

const mapDispatchToProps = {
  getDepartmentsList: getDepartment,
  deleteDepartment,
};

export default connect(mapStateToProps, mapDispatchToProps)(DepartmentList);
