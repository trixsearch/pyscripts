import React, { useState, useEffect, useRef} from "react";
import Axios from "axios";
import { useLocation, useHistory } from "react-router-dom";
import { connect } from "react-redux";
import EzedoxPagination from "components/UI/Pagination/Pagination";
import Spinner from "components/UI/Spinner/Spinner";
import { BgvCard } from "containers/Process/ProcessView/PersonalDetail/BgvDetails";
import FilterDropdown from "components/UI/FilterDropdown/FilterDropdown";
import { addToast } from "components/Toast/actions";
import { parseQueryString } from "containers/utils";
import { clearBgvSearch } from "store/actions";
import Empty from "components/Empty";
import './bgvv.css'

const SortByOptionsMap = {
  "Created At": "created_at",
  "Updated At": "updated_at",
  // "Expiring On": "expiring_on"
}

const sortOptions = [
  {
    name: "Created At",
    id: "created_at",
  },
  {
    name: "Updated At",
    id: "updated_at",
  },
  // Not implemented for now
  // {
  //   name: "Expiring On",
  //   id: "expiring_on",
  // },
];

const statusOptions = [
  {
    id: "all",
    name: "All",
  },
  {
    id: "new",
    name: "New",
  },
  {
    id: "green",
    name: "Green",
  },
  {
    id: "red",
    name: "Red",
  },
  {
    id: "inProgress",
    name: "InProgress",
  },
  {
    id: "reverification",
    name: "Reverification",
  },
  {
    id: "more_data_needed",
    name: "MoreDataNeeded",
  },
];

const checkOptions = [
  {
    id: "all",
    name: "All",
  },
  { id: "IDV", name: "IDV" },
  { id: "PAV", name: "PAV" },
  { id: "LAV", name: "LAV" },
  { id: "LAPV", name: "LAPV" },
  { id: "PAPV", name: "PAPV" },
  { id: "CCRV", name: "CCRV" },
  { id: "PANV", name: "PANV" },
  { id: "VIDV", name: "VIDV" },
  { id: "DLV", name: "DLV" },
  { id: "EDUV", name: "EDUV" },
  { id: "EMPV", name: "EMPV" },
  { id: "PRC", name: "PRC" },
  { id: "PCC", name: "PCC" },
  { id: "PCCVLF", name: "PCCVLF" },
];

const FlexCol = ({ children, label }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", padding: "0 6px" }}>
      <div>{label}</div>
      {children}
    </div>
  );
};

const BgvList = (props) => {
  const container = useRef(null);
  const [pageData, setPageData] = useState({
    active: 1,
    total: 0,
  });
  const [data, setData] = useState([]);
  const [loader, setLoader] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const [sortBy, setSortBy] = useState(sortOptions[0].name);
  const [status, setStatus] = useState(statusOptions[0].name);
  const [checkType, setCheckType] = useState(checkOptions[0].name);
  const [sortOrder, setSortOrder] = useState(false); // true indicates 'asc' and false => 'desc'

  const location = useLocation();
  const history = useHistory();
  const { page = 1 } = parseQueryString(location.search);

  const { 
    addToast: addToastMessage, 
    query: searchQuery, 
    clearBgvSearch: clearSearchResults
  } = props;


  useEffect(() => {
    setLoader(true);

    let queryStatus = (status && status !== 'All') ? `&status=${status}` : '';
    let queryCheckType = (checkType && checkType !== 'All') ? `&check_type=${checkType}` : '';
    let querySortBy = (sortBy) ? `&ordering=${sortOrder ? '' : '-'}${SortByOptionsMap[sortBy]}` : '';

    Axios(`/api/entity/master/bgv?page=${page}${queryStatus}${queryCheckType}${querySortBy}${searchQuery ? `&search=${searchQuery}` : ''}`)
      .then((res) => {
        const {
          data: bgvData,
          pagination_data: { total_count },
        } = res.data;
        setData(bgvData);
        setPageData({
          active: page,
          total: total_count,
        });
      })
      .catch((err) => {
        if(err && err.isAxiosError && err.response?.data?.error === 'Invalid page.') {
          history.replace("?page=1");
          return;
        }
        addToastMessage('error', 'Error', "Failed to get BGV data.")
      })
      .finally(() => {
        setLoader(false);
      })
      
      if(container) container.current.scrollTo(0,0);

  }, [page, status, checkType, sortBy, sortOrder, searchQuery, addToastMessage, history]);

  useEffect(() => (clearSearchResults), [clearSearchResults]);

  const handleSortBy = (value) => {
    let [filteredItem] = sortOptions.filter((item) => item.id === value);
    if (filteredItem) {
      setSortBy(filteredItem.name);
    }
  };

  const handleStatusChange = (value) => {
    let [filteredItem] = statusOptions.filter((item) => item.id === value);
    if (filteredItem) {
      setStatus(filteredItem.name);
    }
  };
  const handleChecksChange = (value) => {
    let [filteredItem] = checkOptions.filter((item) => item.id === value);
    if (filteredItem) {
      setCheckType(filteredItem.name);
    }
  };

  useEffect(() => {
    let currentId = props.location?.hash?.substring(1);
    setActiveId(currentId);

    if (currentId) {
      const element = document.getElementById(currentId);
      if (element) element.scrollIntoView();
    }
  }, [props.location.hash]);

  return (
    <>
      {loader && <Spinner />}
      <div
        className="main_changable_container"
      >
        <div className="process_details_tab_cont config_location_view">
          <ul className="process_tab_ongoing_comp_ul" id="myTab" role="tablist">
            <li className="process_tab_last_li b_container">
              <div
                className="process_details_btn_cont"
                ref={container}
                style={{ bottom: 0 }}
              >
                <FlexCol label="Checks">
                  <FilterDropdown
                    list={checkOptions}
                    selectedItem={checkType}
                    onItemClickHandler={handleChecksChange}
                  />
                </FlexCol>
                <FlexCol label="Status">
                  <FilterDropdown
                    list={statusOptions}
                    selectedItem={status}
                    onItemClickHandler={handleStatusChange}
                  />
                </FlexCol>
                <FlexCol label="Sort by">
                  <div style={{display: 'flex'}}>
                    <FilterDropdown
                      list={sortOptions}
                      selectedItem={sortBy}
                      onItemClickHandler={handleSortBy}
                    />
                  <button type="button" className="btn filter_dropdown_split_button" onClick={() => { setSortOrder(order => !order) }}>
                    <span role="presentation" className={sortOrder ? 'icon-asc' : 'icon-desc'} style={{fontSize: 20}} />
                  </button>
                  </div>
                </FlexCol>
              </div>
            </li>
          </ul>
          <div className="config_table_list_box">
          <div className="bgv-list-container" ref={container} style={{overflow: 'auto', height: window.innerHeight - 200}}>
            {!!data && !data.length && (
              <Empty isLoading={loader} style={{paddingBottom: window.innerHeight - 466}} />
            )}
            
            {data.map((item) => (
              <BgvCard
                key={item.check_id}
                item={item}
                showEntityPhoto
                active={item.id === activeId}
                addToast={props.addToast}
              />
            ))}
          </div>
            <EzedoxPagination
              active={pageData.active}
              taskCount={pageData.total}
              itemsCountPerPage={10}
            />
          </div>
        </div>
      </div>
    </>
  );
};

const mapStateToProps = (state) => ({
  query: state.bgv.query
})

export default connect(mapStateToProps, { addToast, clearBgvSearch })(BgvList);
