/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useParams } from "react-router-dom";
import { connect } from "react-redux";
import { HasAccess } from "../../../../platformDataStoreContext";
import routes from "urls";

import {
  AdvTable,
  clearFiltersHandler,
  getColumnSearchProps,
  tableOnChangeHandler,
} from "components/UI/AntDesignTable/AdvTable";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";

import { ITEMS_PER_PAGE } from "Data/constants";
import { parseQueryString, Item } from "containers/utils";
import {
  getCustomData,
  deleteCustomDataList,
  searchLists,
  clearListSearch,
} from "../../../../store/actions";
import Spinner from "../../../../components/UI/Spinner/Spinner";
import DeleteModel from "../../../../components/UI/DeleteModel/DeleteModal";
import { CW_SERVICE_LIST_CREATE, CW_SERVICE_LIST_DELETE, CW_SERVICE_LIST_UPDATE, CW_SERVICE_LIST_VIEW } from "../../../../Data/constants";
import UnauthorizedPage from "../../../UnauthorizedPage";

const CustomDataList = (props) => {
  const [showWarning, setShowWarning] = useState(false);

  const [selectedList, setSelectedList] = useState({
    id: null,
    name: null,
  });

  const {
    loader,
    data,
    renderPage,
    getCustomListData,
    totalCount,
    storedSorter,
    storedFilters,
    storedActiveFilters,
    storedActiveSorter,
    storedPageSize,
    history
  } = props;

  const location = useLocation();
  const { page } = parseQueryString(location.search);
  const { uuid: orgId } = useParams();

  const [filterData, setFilterData] = useState(storedFilters);
  const [activeFilters, setActiveFilters] = useState(storedActiveFilters);
  const [sorterData, setSorterData] = useState(storedSorter);
  const [activeSorter, setActiveSorter] = useState(storedActiveSorter);
  const [currentPage, setCurrentPage] = useState(Number(page) || 1);
  const [currentPageSize, setCurrentPageSize] = useState(storedPageSize);


  const showWarningModal = (id, name) => {
    setShowWarning(true);
    setSelectedList({
      id,
      name,
    });
  };

  const handleDelete = () => {
    props.deleteCustomListData(
      orgId,
      selectedList.id,
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
          List Name
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
      ...getColumnSearchProps(filterData, "name", " name"),
      render: (text, records) => <Item type="text" data={text} id={records.id} name="list-name" />
    },
    {
      title: "Actions",
      dataIndex: "actions",
      key: "actions",
      align: "center",
      width: "10%",
      render: (text, records) => {
        let content = null;
        content = (
          <div>
            <HasAccess
              permissions={[CW_SERVICE_LIST_UPDATE]}
              yes={() => (
                <div>
                  <Item
                    type='icon'
                    data='Edit'
                    id={records.id}
                    name='list-edit-icon'
                >
                    <NavLink
                        to={routes.CUSTOM_DATA_EDIT.to(orgId, records.id, page)}
                    >
                        <EditOutlined
                            data-tip
                            data-for={`list-edit-icon-${records.id}`}
                        />
                    </NavLink>
                  </Item>
                </div>
              )}
            />
            &nbsp;&nbsp;&nbsp;
            <HasAccess
              permissions={[CW_SERVICE_LIST_DELETE]}
              yes={() => (
                <div>
                  <Item
                    type="icon"
                    data="Delete"
                    id={records.id}
                    name="list-delete-icon"
                  >
                    <DeleteOutlined
                      data-tip
                      data-for={`list-delete-icon-${records.id}`}
                      onClick={() => showWarningModal(records.id, records.name)}
                    />
                  </Item>
                </div>
              )}
            />
          </div>
        );
          
        return content;
      },
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
    getCustomListData(orgId, currentPage, currentPageSize, filterData, sorterData, activeFilters, activeSorter, history);
  }, [
    orgId,
    filterData,
    sorterData,
    renderPage,
    getCustomListData,
    currentPage,
    currentPageSize,
    activeSorter,
  ]);

  const handleTableChange = (pagination, filters, sorter) => {
    const dta = {
      columns,
      setFilterData,
      setSorterData,
      setCurrentPage,
      setActiveSorter,
      setActiveFilters,
      setCurrentPageSize,
      initialSortData: "name",
      firstColumnKey: columns[0].key,
      firstColumnCustomTitle: "List Name",
    };
    tableOnChangeHandler(pagination, filters, sorter, "lists", dta);
  };

  const handleClearFilters = () => {
    clearFiltersHandler(setFilterData, setActiveFilters);
  };

  let addListBtn = null;

  addListBtn = (
    <HasAccess
      permissions={[CW_SERVICE_LIST_CREATE]}
      yes={() => (
        <ul
          className="process_tab_ongoing_comp_ul"
          id="myTab"
          role="tablist"
          style={{ marginBottom: 0 }}
        >
          <li className="process_tab_last_li">
            <div className="process_details_btn_cont" style={{ bottom: 12 }}>
              <NavLink to={routes.CUSTOM_DATA_CREATE.to(orgId, page)}>
                <button type="button" className="fancy_btn active">
                  Add List
                </button>
              </NavLink>
            </div>
          </li>
        </ul>                  
      )}
    />
  );

  return (
    <div className="config_dept_view">
      {loader && <Spinner />}
      {addListBtn}
      <DeleteModel
        show={showWarning}
        itemName={selectedList.name}
        handleDelete={handleDelete}
        hideWarning={() => {
          setShowWarning(false);
        }}
      />
      <HasAccess
        permissions={[CW_SERVICE_LIST_VIEW]}
        yes={() => (
          <div className="config_table_list_box">
            <AdvTable
              loading={loader}
              columns={columns}
              dataSource={data}
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
          return <UnauthorizedPage />
        }}
      />
    </div>
  );
};

const mapStateToProps = (state) => {
  return {
    loader: state.customData.loader,
    data: state.customData.data,
    active: state.customData.active,
    renderPage: state.customData.renderPage,
    totalCount: state.customData.total,
    storedPageSize: state.customData.size,
    storedSorter: state.customData.sorter,
    storedActiveSorter: state.customData.activeSorter,
    storedFilters: state.customData.filters,
    storedActiveFilters: state.customData.activeFilters,
  };
};

const mapDispatchToProps = {
  searchLists,
  clearListSearch,
  getCustomListData: getCustomData,
  deleteCustomListData: deleteCustomDataList,
};

export default connect(mapStateToProps, mapDispatchToProps)(CustomDataList);
