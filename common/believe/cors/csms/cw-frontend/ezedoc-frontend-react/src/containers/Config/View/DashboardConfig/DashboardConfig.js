/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { NavLink, useLocation, useParams } from "react-router-dom";
import { connect } from "react-redux";
import moment from "moment";
import routes from "urls";

import { parseQueryString, Item } from "containers/utils";
import {
  AdvTable,
  clearFiltersHandler,
  getColumnSearchProps,
  tableOnChangeHandler,
} from "components/UI/AntDesignTable/AdvTable";
import { DeleteOutlined } from "@ant-design/icons";
import Spinner from "components/UI/Spinner/Spinner";
import DeleteModel from "components/UI/DeleteModel/DeleteModal";
import {
  PROCESS_DATETIME_FORMAT,
  ITEMS_PER_PAGE,
} from "Data/constants";
import {
  getConfigDashboard,
  deleteConfigDashboard,
} from "store/actions/index";

const DashboardConfig = (props) => {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [showWarning, setShowWarning] = useState(false);

  const {
    totalCount,
    setLoader,
    renderPage,
    dashboardLoader,
    configDashboardList,
    getConfigDashboard: getConfigDashboardList,
    history,
    storedSorter3,
    storedFilters3,
    storedPageSize3,
    storedActiveFilters3,
    storedActiveSorter3,
  } = props;
  
  const location = useLocation();
  const { page = 1 } = parseQueryString(location.search);
  const { uuid: orgId } = useParams();

  const [filterData, setFilterData] = useState(storedFilters3);
  const [activeFilters, setActiveFilters] = useState(storedActiveFilters3);
  const [sorterData, setSorterData] = useState(storedSorter3);
  const [activeSorter, setActiveSorter] = useState(storedActiveSorter3);
  const [currentPage, setCurrentPage] = useState(Number(page) || 1);
  const [currentPageSize, setCurrentPageSize] = useState(storedPageSize3);

  // This will be called only when this component get mounted
  
  useEffect(() => {
    setLoader(false);
  }, []);

  const showWarningModal = (configId, configName) => {
    setShowWarning(true);
    setId(configId);
    setName(configName);
  };

  const handleDelete = () => {
    props.deleteConfigDashboard(
      orgId,
      id,
      totalCount,
      ITEMS_PER_PAGE,
      page,
      renderPage
    );
    setShowWarning(false);
  };

  const columns = [
    {
      title: () => (
        <div className="adv-table-total-items-parent">
          Name
          <div className="adv-table-total-items">
            {totalCount > 99999 ? "99999+" : totalCount}
          </div>
        </div>
      ),
      dataIndex: "name",
      key: "dashboard",
      backendKey: "name",
      sorter: true,
      ellipsis: true,
      defaultSortOrder: "ascend",
      sortDirections:
        sorterData === "name" ? ["descend"] : ["ascend", "descend"],
      ...getColumnSearchProps(filterData, "name", "dashboard"),
      render: (text, record) => (
        <Item
          type="navlink"
          data={text}
          path={routes.EDIT_DASHBOARD.to(orgId, record.id, page)}
          id={record.id}
          name="dashboard-name-navlink"
        />
      ),
      sortOrder:
        activeSorter.columnKey === "dashboard" ? activeSorter.order : false,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      backendKey: "description",
      ellipsis: true,
      render: (text, record) => (
        <Item type="text" data={record.description} id={record.id} name="description" />
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      backendKey: "role",
      ellipsis: true,
      render: (text, record) => (
        <Item type="text" data={record.role_name} id={record.id} name="role" />
      ),
      
    },
    {
      title: "Last Updated On",
      dataIndex: "last_updated",
      key: "last_updated",
      backendKey: "last_updated",
      ellipsis: true,
      render: (text, record) => (
        <Item
          type="text"
          data={moment(record.updated_at).format(PROCESS_DATETIME_FORMAT)}
          id={record.id}
          name="last_updated"
        />
      ),
    },
    {
      title: "Actions",
      dataIndex: "actions",
      key: "actions",
      align: "center",
      width: "10%",
      render: (text, record) => {
        return (
          <Item
            type="icon"
            data="Delete"
            id={record.id}
            name="dashboard-delete-icon"
          >
            <DeleteOutlined
              data-tip
              data-for={`dashboard-delete-icon-${record.id}`}
              onClick={() => showWarningModal(record.id, record.name)}
            />
          </Item>
        );
      },
    },
  ];

  useEffect(() => {
    setCurrentPage(Number(page) || 1);
  }, [page]);

  useEffect(() => {
    history.replace({
      pathname: "",
      search: `?page=${currentPage}`,
    });
  }, [currentPage]);

  useEffect(
    () => getConfigDashboardList(
        orgId,
        currentPage,
        currentPageSize,
        filterData,
        sorterData,
        activeFilters,
        activeSorter,
        history
      ),
    [
      orgId,
      filterData,
      sorterData,
      renderPage,
      getConfigDashboardList,
      currentPage,
      currentPageSize,
    ]
  );

  const handleTableChange = (pagination, filters, sorter) => {
    const data = {
      columns,
      setFilterData,
      setSorterData,
      setCurrentPage,
      setActiveSorter,
      setActiveFilters,
      setCurrentPageSize,
      initialSortData: "name",
      firstColumnKey: columns[0].key,
      firstColumnCustomTitle: "Dashboard Name",
    };
    tableOnChangeHandler(
      pagination,
      filters,
      sorter,
      "configDashboardList",
      data
    );
  };

  const handleClearFilters = () => {
    clearFiltersHandler(setFilterData, setActiveFilters);
  };

  return (
    <div className="config_dept_view">
      {dashboardLoader && <Spinner />}
      <ul
        className="process_tab_ongoing_comp_ul"
        id="myTab"
        role="tablist"
        style={{ marginBottom: 0 }}
      >
        <li className="process_tab_last_li">
          <div
            className="process_details_btn_cont"
            style={{ bottom: 12, right: -9 }}
          >
            <NavLink to={routes.CREATE_DASHBOARD.to(orgId, page)}>
              <button type="button" className="fancy_btn active">
                Add Dashboard
              </button>
            </NavLink>
          </div>
        </li>
      </ul>
      <DeleteModel
        itemName={name}
        show={showWarning}
        handleDelete={handleDelete}
        hideWarning={() => setShowWarning(false)}
      />
      <div className="config_table_list_box">
        <AdvTable
          loading={dashboardLoader}
          columns={columns}
          dataSource={configDashboardList}
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
      </div>
    </div>
  );
};

const mapStateToProps = ({ view }) => ({
  totalCount: view.total,
  active: view.active,
  renderPage: view.renderPage,
  dashboardLoader: view.loader,
  configDashboardList: view.configDashboardList,

  storedPageSize3: view.size3,
  storedFilters3: view.filters3,
  storedSorter3: view.sorter3,
  storedActiveSorter3: view.activeSorter3,
  storedActiveFilters3: view.activeFilters3,
});

const mapDispatchToProps = {
  getConfigDashboard,
  deleteConfigDashboard,
};

export default connect(mapStateToProps, mapDispatchToProps)(DashboardConfig);
