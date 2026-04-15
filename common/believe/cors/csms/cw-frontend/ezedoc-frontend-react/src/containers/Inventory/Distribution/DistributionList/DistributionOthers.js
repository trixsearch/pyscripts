/* eslint-disable no-confusing-arrow */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {
 lazy, Fragment, useState, useEffect 
} from "react";
import { connect } from "react-redux";
import { useLocation } from "react-router-dom";
import moment from "moment";
import axios from "axios";

// import routes from "urls";
import { DATETIME_FORMAT } from "Data/constants";
import Empty from "components/Empty";
import { parseQueryString, Item, isMobile } from "containers/utils";
import {
  AdvTable,
  clearFiltersHandler,
  getColumnSearchProps,
  tableOnChangeHandler,
} from "components/UI/AntDesignTable/AdvTable";

import { getDistributions } from "store/actions/index";

import "./DistributionOthers.css";

const ReturnedAssetDetails = lazy(() => import("./ReturnedAssetDetails"));

const Distributions = (props) => {
  const {
    loader,
    feature,
    history,
    totalCount,
    storedSorter,
    storedFilters,
    // addPermission,
    distributions,
    storedPageSize,
    storedActiveSorter,
    storedActiveFilters,
    getDistributionList,
  } = props;

  const locationInfo = useLocation();
  const { page = 1 } = parseQueryString(locationInfo.search);

  const [filterData, setFilterData] = useState(storedFilters);
  const [activeFilters, setActiveFilters] = useState(storedActiveFilters);
  const [sorterData, setSorterData] = useState(storedSorter);
  const [activeSorter, setActiveSorter] = useState(storedActiveSorter);
  const [currentPage, setCurrentPage] = useState(Number(page) || 1);
  const [currentPageSize, setCurrentPageSize] = useState(storedPageSize);
  const [stateLoader, setStateLoader] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [returnDetails, setReturnDetails] = useState([]);

  const handleModal = (isModalOpen, distributionId = null) => {
    if (isModalOpen) setReturnDetails([]);
    setShowModal(isModalOpen);
    setStateLoader(!!distributionId);
    if (distributionId) {
      const url = `/api/inventory/asset_distribution/${distributionId}/return_assets`;
      axios
        .get(url)
        .then((res) => setReturnDetails(res.data.data))
        // eslint-disable-next-line no-console
        .catch((err) => console.log("err >>", err))
        .finally(() => setStateLoader(false));
    }
  };

  const columns = [
    {
      title: () => (
        <div className="adv-table-total-items-parent">
          Alloted To
          <div className="adv-table-total-items">
            {totalCount > 99999 ? "99999+" : totalCount}
          </div>
        </div>
      ),
      width: 180,
      dataIndex: "comments",
      key: "allotedTo",
      backendKey: "comments",
      // sorter: true,
      ellipsis: true,
      defaultSortOrder: "ascend",
      sortDirections:
        sorterData === "comments" ? ["descend"] : ["ascend", "descend"],
      render: (comments, record) => comments ? (
          <Item
            type="text"
            data={comments}
            id={record.id}
            name="distribution-transfer-comments"
          />
        ) : (
          ""
        ),
      // ...getColumnSearchProps(filterData, "comments", "alloted To"),
      sortOrder:
        activeSorter.columnKey === "allotedTo" ? activeSorter.order : false,
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      backendKey: "quantity",
      sorter: true,
      ellipsis: true,
      render: (quantity, record) => quantity ? (
          <Item
            type="text"
            data={quantity}
            id={record.id}
            name="distribution-transfer-quantity"
          />
        ) : (
          ""
        ),
      ...getColumnSearchProps(filterData, "quantity", "quantity", "number"),
      sortOrder:
        activeSorter.columnKey === "quantity" ? activeSorter.order : false,
    },
    {
      title: "Time",
      dataIndex: "allotted_at",
      key: "time",
      ellipsis: true,
      render: (allotted_at, record) => allotted_at ? (
          <Item
            type="text"
            data={moment(allotted_at).local().format(DATETIME_FORMAT)}
            id={record.id}
            name="distribution-transfer-allotted-at"
          />
        ) : (
          ""
        ),
    },
    {
      title: "Asset Name",
      dataIndex: "asset_name",
      key: "assetName",
      backendKey: "asset__name",
      sorter: true,
      ellipsis: true,
      render: (asset_name, record) => asset_name ? (
          <Item
            type="text"
            data={asset_name}
            id={record.id}
            name="distribution-transfer-asset-name"
          />
        ) : (
          ""
        ),
      ...getColumnSearchProps(filterData, "asset__name", "asset"),
      sortOrder:
        activeSorter.columnKey === "assetName" ? activeSorter.order : false,
    },
    {
      title: "Location",
      dataIndex: "location_detailed",
      key: "location",
      backendKey: "location__name",
      sorter: true,
      ellipsis: true,
      render: (location_detailed, record) => location_detailed ? (
          <Item
            type="text"
            data={location_detailed.name}
            id={record.id}
            name="distribution-transfer-location-name"
          />
        ) : (
          ""
        ),
      ...getColumnSearchProps(filterData, "location__name", "location"),
      sortOrder:
        activeSorter.columnKey === "location" ? activeSorter.order : false,
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

  useEffect(() => {
    if (feature)
      getDistributionList(
        "OTHERS",
        currentPage,
        currentPageSize,
        filterData,
        sorterData,
        activeFilters,
        activeSorter,
        history
      );
  }, [
    feature,
    filterData,
    sorterData,
    currentPage,
    currentPageSize,
    getDistributionList,
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
      initialSortData: "quantity",
      firstColumnKey: columns[0].key,
      firstColumnCustomTitle: "Quantity",
    };
    tableOnChangeHandler(
      pagination,
      filters,
      sorter,
      "distributionOthers",
      data
    );
  };

  const handleClearFilters = () => {
    clearFiltersHandler(setFilterData, setActiveFilters);
  };

  return (
    <Fragment>
      <ReturnedAssetDetails
        showModal={showModal}
        stateLoader={stateLoader}
        handleModal={handleModal}
        returnDetails={returnDetails}
      />
      <div
        className="main_changable_container"
        style={{ height: window.innerHeight - 59 }}
      >
        <div className="process_details_tab_cont config_location_view">
          <ul className="process_tab_ongoing_comp_ul" id="myTab" role="tablist">
            <li className="process_tab_last_li">
              <div className="process_details_btn_cont" />
            </li>
          </ul>
          {distributions.length === 0 && isMobile() ? (
            <Empty />
          ) : (
            <AdvTable
              loading={loader}
              columns={columns}
              dataSource={distributions}
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
        </div>
      </div>
    </Fragment>
  );
};

const mapStateToProps = ({ distribution, auth }) => ({
  loader: distribution.loader,
  totalCount: distribution.total,
  distributions: distribution.data,
  storedPageSize: distribution.size2,
  storedFilters: distribution.filters2,
  storedSorter: distribution.sorter2,
  storedActiveSorter: distribution.activeSorter2,
  storedActiveFilters: distribution.activeFilters2,

  feature: auth.uiFeatures.organisationassetdistribution.view,
  addPermission: auth.uiPermissions.organisationassetdistribution.add,
});

const mapDispatchToProps = {
  getDistributionList: getDistributions,
};

export default connect(mapStateToProps, mapDispatchToProps)(Distributions);
