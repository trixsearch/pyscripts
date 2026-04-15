/* eslint-disable react/prefer-stateless-function */
/* eslint-disable react-hooks/exhaustive-deps */

import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import { NavLink, useParams } from "react-router-dom";

import { parseQueryString, Item } from "containers/utils";
import {
  AdvTable,
  clearFiltersHandler,
  getColumnSearchProps,
  tableOnChangeHandler,
} from "components/UI/AntDesignTable/AdvTable";
import { EditOutlined } from "@ant-design/icons";
import routes from "../../../urls";
import * as actions from "../../../store/actions/index";
import { HasAccess } from "../../../platformDataStoreContext";

import Spinner from "../../../components/UI/Spinner/Spinner";
import { CW_SERVICE_LIST_UPDATE, CW_SERVICE_LIST_VIEW } from "../../../Data/constants";
import UnauthorizedPage from "../../UnauthorizedPage";

const AdvancedList = (props) => {
  const {
    datas,
    loader,
    totalCount,
    user,
    getAdvListDatas,
    renderPage,
    storedSorter,
    storedFilters,
    storedPageSize,
    storedActiveFilters,
    storedActiveSorter,
    history,
  } = props;

  const { page } = parseQueryString(props.location.search);

  const [filterData, setFilterData] = useState(storedFilters);
  const [activeFilters, setActiveFilters] = useState(storedActiveFilters);
  const [sorterData, setSorterData] = useState(storedSorter);
  const [activeSorter, setActiveSorter] = useState(storedActiveSorter);
  const [currentPage, setCurrentPage] = useState(Number(page) || 1);
  const [currentPageSize, setCurrentPageSize] = useState(storedPageSize);
  const { uuid: orgId } = useParams();

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
      key: "name",
      backendKey: "name",
      sorter: true,
      ellipsis: true,
      defaultSortOrder: "ascend",
      sortDirections:
        sorterData === "name" ? ["descend"] : ["ascend", "descend"],
      ...getColumnSearchProps(filterData, "name", "name"),
      render: (text, records) => <Item type="text" data={text} id={records.id} name="advanced-list-name" />,
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      key: 'actions',
      width: '7%',
      align: 'center',
      render: (text, records) => {
          let content = null;

          content = (
            <HasAccess
              permissions={[CW_SERVICE_LIST_UPDATE]}
              yes={() => (
                <Item
                  type='icon'
                  data='Edit'
                  id={records.id}
                  name='advanced-list-edit-icon'
                >
                    <NavLink
                        to={routes.ADVANCED_LIST_DETAIL.to(orgId, records.id)}
                    >
                        <EditOutlined
                            data-tip
                            data-for={`advanced-list-edit-icon-${records.id}`}
                        />
                    </NavLink>
                </Item>
              )}
            />
          )
          
          return content
      }
  },
  ];

  useEffect(() => {
    setCurrentPage(Number(page) || 1);
  }, [page]);

  useEffect(() => {
    history.replace({
      pathname: '',
      search: `?page=${currentPage}`
    })
  }, [currentPage])

  useEffect(() => {
    getAdvListDatas(
      orgId,
      currentPage,
      currentPageSize,
      filterData,
      sorterData,
      activeFilters,
      activeSorter,
      history
    );
  }, [
    orgId,
    filterData,
    sorterData,
    renderPage,
    getAdvListDatas,
    currentPage,
    currentPageSize,
    activeSorter,
    activeFilters,
    history,
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
      initialSortData: "name",
      firstColumnKey: columns[0].key,
      firstColumnCustomTitle: "Name",
    };
    tableOnChangeHandler(pagination, filters, sorter, "advancedlist", data);
  };

  const handleClearFilters = () => {
    clearFiltersHandler(setFilterData, setActiveFilters);
  };

  return (
    <div className="config_advlist_listView">
      {loader && <Spinner />}
      <HasAccess
        permissions={[CW_SERVICE_LIST_VIEW]}
        yes={() => (
          <div className="config_table_list_box">
            <AdvTable
              loading={loader}
              columns={columns}
              dataSource={datas}
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
        )}
        no={() => {
          return (
            <UnauthorizedPage />
          )
        }}
      />
    </div>
  );
};

const mapStateToProps = (state) => ({
  datas: state.advancedList.datas,
  loader: state.advancedList.loader,
  activePage: state.advancedList.activePage,
  totalCount: state.advancedList.totalCount,
  user: state.auth,
  storedPageSize: state.advancedList.size,
  storedFilters: state.advancedList.filters,
  storedSorter: state.advancedList.sorter,
  storedActiveSorter: state.advancedList.activeSorter,
  storedActiveFilters: state.advancedList.activeFilters,
});

const mapDispatchToProps = (dispatch) => ({
  setLoader: (loader) => dispatch(actions.setAdvListLoader(loader)),

  getAdvListDatas: (
    orgId,
    currentPage,
    currentPageSize,
    filterData,
    sorterData,
    activeFilters,
    activeSorter,
    history
  ) => dispatch(
    actions.getAdvListDatas(
      orgId,
      currentPage,
      currentPageSize,
      filterData,
      sorterData,
      activeFilters,
      activeSorter,
      history
    )
  ),
  searchAdvList: (orgId, searchData, page) => dispatch(actions.searchAdvList(orgId, searchData, page)),
});

export default connect(mapStateToProps, mapDispatchToProps)(AdvancedList);
