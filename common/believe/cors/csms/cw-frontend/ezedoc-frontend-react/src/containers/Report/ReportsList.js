import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { NavLink, useLocation, useParams } from "react-router-dom";
import routes from "urls";

import { parseQueryString, Item } from "containers/utils";
import {
  AdvTable,
  clearFiltersHandler,
  getColumnSearchProps,
  tableOnChangeHandler,
} from "components/UI/AntDesignTable/AdvTable";
import { DeleteOutlined, PlayCircleOutlined, EditOutlined } from "@ant-design/icons";
import QueryModal from "./QueryModal/QueryModal";

import {
  deleteReport,
  downloadReports,
  RetrieveReportsPagination,
} from "../../store/actions/index";
import Spinner from "../../components/UI/Spinner/Spinner";
import no_records from "../../assets/images/no_records.png";
import DeleteModal from "../../components/UI/DeleteModel/DeleteModal";
import ReportDownload from "../../components/UI/ReportDownload";
import { CELERY_REPORT, CW_SERVICE_REPORTS_DOWNLOAD, CW_SERVICE_REPORTS_VIEW, ITEMS_PER_PAGE } from "../../Data/constants";
import { addToast } from "../../components/Toast/actions";
import { HasAccess } from "../../platformDataStoreContext";
import UnauthorizedPage from "../UnauthorizedPage";

import "./Report.css";

const initialMessage = "Report is getting prepared and will be available for download in sometime";
const downloadMessage = "Report is now available for download";

const Report = (props) => {
  const [reportId, setReportId] = useState("");
  const [reportName, setReportName] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [showWarning, setShowWarning] = useState(false);
  const [message, setMessage] = useState(initialMessage);
  const [transactionId, setTransactionId] = useState(null);
  const [queryModalData, setQueryModalData] = useState(null);
  const [disabledButton, setDisabledButton] = useState(true);
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [downloadReportId, setDownloadReportId] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const APP_URL = process.env.REACT_APP_APP_URL;

  const {
    totalCount,
    loader,
    active,
    history,
    reports,
    renderPage,
    updateType,
    updatesData,
    RetrieveReportsPagination: getReports,
    match,
    storedSorter,
    storedFilters,
    storedPageSize,
    storedActiveFilters,
    storedActiveSorter,
  } = props;

  const { time, type } = updateType;

  const location = useLocation();
  const { page = 1 } = parseQueryString(location.search);
  const { uuid: orgId } = useParams();

  const [filterData, setFilterData] = useState(storedFilters);
  const [activeFilters, setActiveFilters] = useState(storedActiveFilters);
  const [sorterData, setSorterData] = useState(storedSorter);
  const [activeSorter, setActiveSorter] = useState(storedActiveSorter);
  const [currentPage, setCurrentPage] = useState(Number(page) || 1);
  const [currentPageSize, setCurrentPageSize] = useState(storedPageSize);

  useEffect(() => {
    getReports(
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
    getReports,
    currentPage,
    currentPageSize,
    activeFilters,
    activeSorter,
    history,
  ]);

  const hideReportDownload = () => {
    setShowReportModal(false);
    setDownloadReportId("");
    setDownloadUrl("");
    setDisabledButton(true);
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (updatesData) {
      if (
        type === CELERY_REPORT
        && updatesData.id === downloadReportId
        && updatesData.transaction_id === transactionId
      ) {
        if (updatesData.success) {
          setDownloadUrl(updatesData.url);
          setMessage(downloadMessage);
          setDisabledButton(false);
        } else {
          hideReportDownload();
          props.addToast("error", "Error", updatesData.message);
        }
      }
    }
  }, [time]);

  const handleReportGeneration = (url) => {
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "report.xlsx");
    document.body.appendChild(link);
    link.click();
    hideReportDownload();
  };

  const showReportDownload = (id) => {
    setShowReportModal(true);
    setDownloadReportId(id);
    setMessage(initialMessage);
  };

  const handleTransectionId = (res) => {
    setTransactionId(res.transaction_id || null);
  };

  const handleReport = (data) => {
    const {
      selected_fields,
      id,
      query,
      report_type,
      send_via_email,
      report_on,
    } = data;
    const prompt = !!query.query.filter((entry) => entry.prompt).length;

    setDownloadReportId(id);

    if (!prompt) {
      props
        .downloadReports(
          orgId,
          id,
          {
            selected_fields,
            query,
            report_type,
          },
          send_via_email,
          report_on,
          showReportDownload,
          hideReportDownload
        )
        .then((res) => handleTransectionId(res));
    } else {
      setShowQueryModal(true);
      setQueryModalData(data);
    }
  };

  const showWarningHandler = (id, name) => {
    setReportId(id);
    setReportName(name);
    setShowWarning(true);
  };

  const handleDelete = () => {
    props.deleteReport(orgId, reportId, totalCount, ITEMS_PER_PAGE, page, renderPage);
    setShowWarning(false);
  };

  const handleClose = () => {
    setShowQueryModal(false);
    setQueryModalData(null);
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
      key: "report",
      backendKey: "name",
      sorter: true,
      ellipsis: true,
      defaultSortOrder: "ascend",
      sortDirections:
        sorterData === "name" ? ["descend"] : ["ascend", "descend"],
      ...getColumnSearchProps(filterData, "name", "report name"),
      render: (text, record) => {
        return <Item type="text" data={text} id={record.id} name="name" />

      },
      sortOrder:
        activeSorter.columnKey === "report" ? activeSorter.order : false,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "report_description",
      backendKey: "description",
      sorter: true,
      ellipsis: true,
      defaultSortOrder: "ascend",
      sortDirections:
        sorterData === "description" ? ["descend"] : ["ascend", "descend"],
      sortOrder:
        activeSorter.columnKey === "report_description" ? activeSorter.order : false,
      render: (text, record) => (
        <Item
          type="text"
          data={record.description}
          id={record.id}
          name="description"
        />
      ),
      ...getColumnSearchProps(filterData, "description", "description"),
    },
    {
      title: "Last Updated",
      dataIndex: "last_updated",
      key: "l_updated",
      backendKey: "last_updated",
      sorter: true,
      ellipsis: true,
      defaultSortOrder: "ascend",
      sortDirections:
        sorterData === "last_updated" ? ["descend"] : ["ascend", "descend"],
      sortOrder:
        activeSorter.columnKey === "l_updated" ? activeSorter.order : false,
      render: (text, record) => (
        <Item
          type="text"
          data={record.created_at.substring(0, 10)}
          id={record.id}
          name="last_updated"
        />
      )
    },
    {
      title: "Actions",
      dataIndex: "actions",
      key: "actions",
      align: "center",
      width: "10%",
      render: (text, record) => {
        let content1 = null;
        let content2 = null;
        let content3 = null;

        content1 = (
          <HasAccess
              permissions={[CW_SERVICE_REPORTS_DOWNLOAD]}
              yes={() => (
                  <div>
                      <Item
                        type="icon"
                        data="Run"
                        id={record.id}
                        name="report-run-icon"
                      >
                        <PlayCircleOutlined
                          data-tip
                          data-for={`report-run-icon-${record.id}`}
                          onClick={() => {
                            handleReport(record);
                          }}
                        />
                      </Item>
                  </div>
              )}
          />
        );

        // if (downloadPermission) {
          
          //Hiding Delete report button
          // if (permission.delete && record.report_on !== 'INVENTORY' && record.report_on !== 'BGV')
          //   content2 = (
          //     <Item
          //       type="icon"
          //       data="Delete"
          //       id={record.id}
          //       name="report-delete-icon"
          //     >
          //       <DeleteOutlined
          //         data-tip
          //         data-for={`report-delete-icon-${record.id}`}
          //         onClick={() => showWarningHandler(record.id, record.name)}
          //       />
          //     </Item>
          //   );
          // Hiding the Report Schedular for now  
          // if (downloadPermission && !(record.report_on === 'ENTITY'))
          //   content3 = (
          //     <Item
          //       type="icon"
          //       data="Schedule"
          //       id={record.id}
          //       name="report-schedule-icon"
          //     >
          //       {
          //         record.report_type !== 4 ? (
          //           <NavLink to={routes.REPORT_SCHEDULE.to(orgId, record.id)}>
          //             {/* <NavLink to={`${APP_URL}/${orgId}/reports/${record.id}/scheduler?report_type=${record.report_type}`}>  */}
          //             <EditOutlined
          //               data-tip
          //               data-for={`report-schedule-icon-${record.id}`}
          //             />
          //           </NavLink>
          //         ) : null
          //       }
          //     </Item>
          //   );
        // }
        return (
          <div style={{display:'flex',flexDirection:"row", gap:"5px", justifyContent:"center"}}>
            {content1 || null}
            {/* {content1 && content2 ? <span>&nbsp;&nbsp;&nbsp;</span> : null} */}
            {content2 || null}
            {/* {(content2 && content3) || (content1 && content3) ? <span>&nbsp;&nbsp;&nbsp;</span> : null} */}
            {content3 || null}
          </div>
        )
      },
    },
  ];

  useEffect(() => {
    setCurrentPage(Number(page) || 1)
  }, [page])

  useEffect(() => {
    history.replace({
      pathname: '',
      search: `?page=${currentPage}`
    })
  }, [currentPage])

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
      firstColumnCustomTitle: "Report Name",
    };
    tableOnChangeHandler(pagination, filters, sorter, "reports", data);
  };

  const handleClearFilters = () => {
    clearFiltersHandler(setFilterData, setActiveFilters);
  };

  return (
    <div>
      {loader && <Spinner />}
      <div
        className="main_changable_container"
        style={{ height: window.innerHeight - 56 - 3 }}
      >
        {/* Hiding Create report button */}
        {/* {permission.add ? (
          <div className="report-create-link">
            <NavLink
              to={routes.REPORT_CREATE.to(orgId, page)}
              className="report-create-btn"
            >
              <button type="button" className="fancy_btn active">
                Create New
              </button>
            </NavLink>
          </div>
        ) : (
          <div />
        )} */}

        <HasAccess
                permissions={[CW_SERVICE_REPORTS_VIEW]}
                yes={() => (
                    <div>
                        {(reports) || active > 1 ? (
                          <section className="report-view-table">
                            <AdvTable
                              loading={loader}
                              columns={columns}
                              dataSource={reports}
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
                          </section>
                        ) : (
                          <div className="no_records_cont">
                            <div className="no_records_img_text">
                              <img src={no_records} alt="" />
                              <p>No Reports</p>
                            </div>
                          </div>
                        )}
                    </div>
                )}
                no={() => (
                  <UnauthorizedPage />
                )}
            />

        {showQueryModal && (
          <QueryModal
            match={match}
            hideFilter={false}
            show={showQueryModal}
            data={queryModalData}
            onClose={handleClose}
            showReportDownload={showReportDownload}
            hideReportDownload={hideReportDownload}
            handleTransectionId={handleTransectionId}
          />
        )}
        <DeleteModal
          show={showWarning}
          itemName={reportName}
          handleDelete={handleDelete}
          hideWarning={() => setShowWarning(false)}
        />
        <ReportDownload
          message={message}
          show={showReportModal}
          downloadURl={downloadUrl}
          disabledButton={disabledButton}
          hideReportDownload={hideReportDownload}
          handleReportGeneration={handleReportGeneration}
        />
      </div>
    </div>
  );
};

const mapStateToProps = (state) => ({
  loader: state.report.loader,
  reports: state.report.reports,
  totalCount: state.report.total,
  active: state.report.active,
  renderPage: state.report.renderPage,
  updateType: state.websocket.updateType,
  updatesData: state.websocket.updatesData,
  storedPageSize: state.report.size,
  storedFilters: state.report.filters,
  storedSorter: state.report.sorter,
  storedActiveSorter: state.report.activeSorter,
  storedActiveFilters: state.report.activeFilters,
});

const mapDispatchToProps = {
  RetrieveReportsPagination,
  downloadReports,
  deleteReport,
  addToast,
};

export default connect(mapStateToProps, mapDispatchToProps)(Report);
