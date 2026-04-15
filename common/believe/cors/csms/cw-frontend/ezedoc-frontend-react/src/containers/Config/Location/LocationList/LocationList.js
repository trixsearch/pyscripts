/* eslint-disable no-confusing-arrow */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, Fragment } from "react";
import { connect } from "react-redux";
import { NavLink, useLocation, useParams } from "react-router-dom";
import routes from "urls";
import { parseQueryString, Item } from "containers/utils";
import {
  AdvTable,
  clearFiltersHandler,
  getFilteredValueProp,
  getColumnSearchProps,
  tableOnChangeHandler,
} from "components/UI/AntDesignTable/AdvTable";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import axios from "axios";

import { getLocation, deleteLocation } from "../../../../store/actions/index";
import BulkImport from "../../../../components/UI/DocumentUpload/BulkImport";
import Spinner from "../../../../components/UI/Spinner/Spinner";
import DropDownButton from "../../../../components/UI/AppButton/DropDownButton";
import DeleteModel from "../../../../components/UI/DeleteModel/DeleteModal";

const APP_URL = process.env.REACT_APP_APP_URL;

const LocationList = (props) => {
  const {
    history,
    feature,
    loader,
    addPermission,
    totalCount,
    renderPage,
    locationData,
    getLocation: getLocations,
    storedSorter,
    storedFilters,
    editPermission,
    storedPageSize,
    deletePermission,
    storedActiveFilters,
    storedActiveSorter,
    storedExtraColumns,
  } = props;

  const location = useLocation();
  const { page = 1 } = parseQueryString(location.search);
  const { uuid: orgId } = useParams();

  const [filterData, setFilterData] = useState(storedFilters);
  const [activeFilters, setActiveFilters] = useState(storedActiveFilters);
  const [sorterData, setSorterData] = useState(storedSorter);
  const [activeSorter, setActiveSorter] = useState(storedActiveSorter);
  const [currentPage, setCurrentPage] = useState(Number(page) || 1);
  const [currentPageSize, setCurrentPageSize] = useState(storedPageSize);
  const [show, setShow] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [selectedLocn, setSelectedLocn] = useState({
    id: null,
    name: null,
  });
  const [extraColumns, setExtraColumns] = useState(storedExtraColumns);

  const showWarningModal = (id, name) => {
    setShowWarning(true);
    setSelectedLocn({
      id,
      name,
    });
  };

  const handleDelete = () => {
    props.deleteLocation(
      orgId,
      selectedLocn.id,
      totalCount,
      currentPageSize,
      currentPage,
      renderPage
    );
    setShowWarning(false);
  };

  let columns = [
    {
      title: () => (
        <div className="adv-table-total-items-parent">
          Location Name
          <div className="adv-table-total-items">
            {totalCount > 99999 ? "99999+" : totalCount}
          </div>
        </div>
      ),
      dataIndex: "name",
      key: "locationName",
      backendKey: "name",
      sorter: true,
      ellipsis: true,
      defaultSortOrder: "ascend",
      ...getColumnSearchProps(filterData, "name", "location name"),
      render: (text, record) => <Item type="text" data={text} id={record.id} name="location-name" />,
      sortOrder: activeSorter.columnKey === "locationName" ? activeSorter.order : false,
    },

    // {
    //   title: 'Location Head',
    //   dataIndex: 'head',
    //   key: 'locationHead',
    //   backendKey: 'head__email',
    //   width: 150,
    //   sorter: true,
    //   ellipsis: true,
    //   render: (head, record) => head ? <Item type='text' data={head.email} id={record.id} name='location-head-email' /> : '',
    //   ...getColumnSearchProps(filterData, 'head__email', 'location head'),
    //   sortOrder: activeSorter.columnKey === 'locationHead' ? activeSorter.order : false,
    // },

    {
      title: () => <div className="adv-table-total-items-parent">Address</div>,
      dataIndex: "address",
      key: "locationAddress",
      backendKey: "address",
      sorter: true,
      ellipsis: true,
      defaultSortOrder: "ascend",
      ...getColumnSearchProps(filterData, "address", "location address"),
      render: (text, record) => <Item type="text" data={text} id={record.id} name="location-address" />,
      sortOrder: activeSorter.columnKey === "locationAddress" ? activeSorter.order : false,
    },

    {
      title: () => <div className="adv-table-total-items-parent">City</div>,
      dataIndex: "city",
      key: "locationCity",
      backendKey: "city",
      width:"15%",
      sorter: true,
      ellipsis: true,
      defaultSortOrder: "ascend",
      ...getColumnSearchProps(filterData, "city", "location city"),
      render: (text, record) => <Item type="text" data={text} id={record.id} name="location-city" />,
      sortOrder:
        activeSorter.columnKey === "locationCity" ? activeSorter.order : false,
    },

    {
      title: () => <div className="adv-table-total-items-parent">State</div>,
      dataIndex: "state",
      key: "locationState",
      backendKey: "state",
      width:"10%",
      sorter: true,
      ellipsis: true,
      defaultSortOrder: "ascend",
      ...getColumnSearchProps(filterData, "state", "location state"),
      render: (text, record) => <Item type="text" data={text} id={record.id} name="location-state" />,
      sortOrder:
        activeSorter.columnKey === "locationState" ? activeSorter.order : false,
    },

    {
      title: () => (
        <div className="adv-table-total-items-parent">Location Type</div>
      ),
      dataIndex: "type",
      key: "type",
      backendKey: "location_type",
      sorter: true,
      ellipsis: true,
      defaultSortOrder: "ascend",
      filters: [
        { text: "Interview Location", value: "Interview Location" },
        { text: "Work Location", value: "Work Location" },
      ],
      filterMultiple: true,
      render: (text, record) => (
        <Item type="text" data={text} id={record.id} name="location-type" />
      ),
      ...getFilteredValueProp(filterData,"location_type"),
      sortOrder:
        activeSorter.columnKey === "locationType" ? activeSorter.order : false,
    },

    {
      title: "Actions",
      dataIndex: "actions",
      key: "actions",
      align: "center",
      width: 70,
      render: (text, record) => {
        let content1 = null;
        let content2 = null;

        if (editPermission) content1 = (
          <Item
              type='icon'
              data='Edit'
              id={record.id}
              name='location-edit-icon'
          >
              <NavLink
                  to={routes.LOCATION_EDIT.to(orgId, record.id, page)}
              >
                  <EditOutlined
                      data-tip
                      data-for={`location-edit-icon-${record.id}`}
                      onClick={()=>{
                        window.sendEvent("Hire_Edit_location ")
                      }
                    }
                  />
              </NavLink>
          </Item>
      )

        if (deletePermission)
          content2 = (
            <Item
              type="icon"
              data="Delete"
              id={record.id}
              placement="left"
              name="location-delete-icon"
            >
              <DeleteOutlined
                data-tip
                data-for={`location-delete-icon-${record.id}`}
                onClick={() => showWarningModal(record.id, record.name)}
              />
            </Item>
          );
          return(
            <Fragment>
                {content1 || null}
                {content1 && content2 ? <span>&nbsp;&nbsp;&nbsp;</span> : null}
                {/* {content2 || null} */}
            </Fragment>
        )
      },
    },
  ];

  const fetchExtraFields = () => {
    axios
      .get(
        `${APP_URL}/${orgId}/config/custom_attribute/get_attribute?type=locations`
      )
      .then((res) => setExtraColumns(res.data.data.components));
  };
  useEffect(() => {
    // Fetch extra field details
    fetchExtraFields();
  }, []);

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
      getLocations(
        orgId,
        currentPage,
        currentPageSize,
        filterData,
        sorterData,
        activeFilters,
        activeSorter,
        extraColumns,
        history
      );
  }, [
    orgId,
    feature,
    filterData,
    sorterData,
    renderPage,
    getLocations,
    currentPage,
    currentPageSize,
  ]);

  let columnDetails = [...columns];
  if (locationData) {
    // Creating & Maintaining Extra (Dynamic) Column Details
    let extraColumnDetails = [];
    extraColumns.forEach((column) => {
      const compKey = column.key;
      const compLabel = column.label;
      const compType = column.type;
      let columnData = {};
      if (column.type !== "list") {
        columnData = {
          title: compLabel,
          dataIndex: "extra_fields",
          key: compKey,
          backendKey: `extra_fields__${compKey}`,
          sorter: true,
          ellipsis: true,
          width: 110,
          render: (extra_fields, record) => extra_fields ? (
              <Item
                type="text"
                data={extra_fields[compKey]}
                id={record.id}
                name={`location-extra-field-${compKey}`}
              />
            ) : (
              ""
            ),
          ...getColumnSearchProps(
            filterData,
            `extra_fields__${compKey}`,
            compLabel,
            compType
          ),
          sortOrder:
            activeSorter.columnKey === compKey ? activeSorter.order : false,
        };
      } else {
        columnData = {
          title: compLabel,
          dataIndex: "extra_fields",
          key: compKey,
          backendKey: `extra_fields__${compKey}`,
          ellipsis: true,
          width: 110,
          render: (extra_fields, record) => {
            if (extra_fields[compKey]) {
              if (typeof extra_fields[compKey] === "object") {
                let multiData = [];
                if (column.isMulti === true) {
                  extra_fields[compKey].forEach((data) => multiData.push(data.value));
                } else {
                  multiData.push(extra_fields[compKey].value);
                }
                return (
                  <Item
                    type="list"
                    id={record.id}
                    multiData={multiData}
                    name={`location-extra-field-${compKey}`}
                  />
                );
              }
            }
            return "";
          },
        };
      }
      extraColumnDetails.push(columnData);
    });

    const lastItem = columns.pop();
    columnDetails = [...columns, ...extraColumnDetails, lastItem];
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
      initialSortData: "name",
      firstColumnKey: columnDetails[0].key,
      firstColumnCustomTitle: "Location Name",
    };
    tableOnChangeHandler(pagination, filters, sorter, "locations", data);
  };

  const handleClearFilters = () => {
    clearFiltersHandler(setFilterData, setActiveFilters);
  };

  const url = `${APP_URL}/${orgId}/locations/import_bulk_locations`;
  const title = "Import Locations";

  return (
    <>
      {loader && <Spinner />}
      <div
        className="main_changable_container"
        style={{
          height: window.innerHeight - 56 - 3,
        }}
      >
        <div className="process_details_tab_cont config_location_view">
          <ul className="process_tab_ongoing_comp_ul" id="myTab" role="tablist">
            <li className="process_tab_last_li">
              <div className="process_details_btn_cont">
                {!!addPermission && (
                  <div
                    style={{
                      display: "flex",
                    }}
                  >
                    <DropDownButton
                      handleClick={() => setShow(true)}
                      defaultButtonName="Import"
                      defaultButtonCondition
                    >
                      <li
                        style={{
                          padding: "2px 0",
                        }}
                      >
                        <NavLink to={`/custom-workflow/org/${orgId}/config/location/import-history`}>History</NavLink>
                      </li>
                    </DropDownButton>
                    <NavLink to={routes.LOCATION_CREATE.to(orgId, page)}>
                      <button
                        type="button"
                        className="process_fancy_btn fancy_btn active"
                        onClick={()=>{
                          window.sendEvent("Hire_Click_add_location ",{
                            })
                          }}
                      >
                        <span> Add Location </span>
                      </button>
                    </NavLink>
                  </div>
                )}
              </div>
            </li>
          </ul>
          <DeleteModel
            show={showWarning}
            itemName={selectedLocn.name}
            handleDelete={handleDelete}
            hideWarning={() => {
              setShowWarning(false);
            }}
          />
          <BulkImport
            show={show}
            handleShow={setShow}
            url={url}
            title={title}
            history={props.history}
            redirectUrl={`/custom-workflow/org/${orgId}/config/location/import-history`}
          />
          <AdvTable
            loading={loader}
            columns={columnDetails}
            dataSource={locationData}
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
    </>
  );
};

const mapStateToProps = (state) => ({
  loader: state.location.loader,
  message: state.location.message,
  locationData: state.location.data,
  addPermission: state.auth.uiPermissions.location.add,
  editPermission: state.auth.uiPermissions.location.change,
  deletePermission: state.auth.uiPermissions.location.delete,
  totalCount: state.location.total,
  renderPage: state.location.renderPage,
  feature: state.auth.uiFeatures.location.view,
  storedPageSize: state.location.size,
  storedFilters: state.location.filters,

  storedSorter: state.location.sorter,
  storedActiveSorter: state.location.activeSorter,
  storedActiveFilters: state.location.activeFilters,
  storedExtraColumns: state.location.extraColumns,
});

const mapDispatchToProps = {
  getLocation,
  deleteLocation,
};

export default connect(mapStateToProps, mapDispatchToProps)(LocationList);
