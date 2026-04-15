
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
  getFilteredValueProp,
  getColumnSearchProps,
  tableOnChangeHandler,
} from '../../../components/UI/AntDesignTable/AdvTable'
import { getPartner, deletePartner } from "../../../store/actions/Hiring/HiringPartner";
import Spinner from "../../../components/UI/Spinner/Spinner";
import DeleteModel from "../../../components/UI/DeleteModel/DeleteModal";
import DrawerFilter from '../DrawerFilter/DrawerFilter';
import { Button } from 'components/UI/AppButton/AppButton'

import './HiringPartner.css'

const HiringPartnerList = (props) => {
  const {
    history,
    getPartnerList,
    feature,
    loader,
    addPermission,
    editPermission,
    deletePermission,
    totalCount,
    partner,
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
  const [showSideFilter, setShowSideFilter] = useState(false);
  const [filters, setFilters] = useState({});
  const [activeSorter, setActiveSorter] = useState(storedActiveSorter)
  const [currentPage, setCurrentPage] = useState(Number(page) || 1)
  const [currentPageSize, setCurrentPageSize] = useState(storedPageSize)
  const [showWarning, setShowWarning] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState({
    id: null,
    name: null,
  });
  const [drawerFilters, setDrawerFilters] = useState({});


  const showWarningModal = (id, name) => {
    setSelectedPartner({ id, name });
    setShowWarning(true);
  };

  const handleDelete = () => {
    props.deletePartner(orgId, selectedPartner.id, totalCount, currentPageSize, currentPage, renderPage);
    setShowWarning(false);
    window.sendEvent("Hire_Vendor_delete",{
      Deleted_vendor_name:selectedPartner.name
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
      key: 'partnerName',
      backendKey: 'name',
      sorter: true,
      ellipsis: true,
      defaultSortOrder: 'ascend',
      sortDirections: sorterData === 'name' ? ['descend'] : ['ascend', 'descend'],
      ...getColumnSearchProps(filterData, "name", "vendor name"),
      render: (text, record) => <Item type='navlink' data={text} id={record.id} name='partner-id-navlink' onClick={()=>{ window.sendEvent("Hire_Clicks_on_vendor_profile_page",{Visited_Vendor_name:record.name}) }} path={routes.JOB_LIST.to(orgId, null, `&vendorId=${record.id}`)} />,
      // <Item type='text' data={text} id={record.id} name='partner-id' />,
      sortOrder: activeSorter.columnKey === 'partnerName' ? activeSorter.order : false,
    },
    {
      title: 'Type',
      dataIndex: 'partner_subtype',
      key: 'subType',
      backendKey: 'partner_subtype',
      filters: [
        { text: 'Sourcing', value: 'Sourcing' },
        { text: 'Staffing', value: 'Staffing' },
        { text: 'Sourcing and Staffing', value: 'Sourcing and Staffing' },
      ],
      filterMultiple: false,
      render: (partner_subtype, record) => <Item type='text' data={partner_subtype} id={record.id} name='partner-subtype' />,
      ...getFilteredValueProp(filterData, 'partner_subtype'),
    },
    {
      title: 'Status',
      dataIndex: 'active',
      key: 'active',
      backendKey: 'active',
      filters: null,
      filterMultiple: false,
      render: (active, record) => <Item type='text' data={active ? 'Active' : 'Inactive'} id={record.id} name='active' />,
      ...getFilteredValueProp(filterData, 'active'),
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
            <NavLink to={routes.HIRING_PARTNER_EDIT.to(orgId, record.id, page)} >
            <EditOutlined
              data-tip
              data-for={`partner-edit-icon-${record.id}`}
              onClick={()=>window.sendEvent("Hire_Click_vendor_edit")}
            />
            </NavLink>
        )

        if (deletePermission) content2 = (
          <Item
            type='icon'
            data='Delete'
            id={record.id}
            name='partner-delete-icon'
          >
            <DeleteOutlined
              data-tip
              data-for={`partner-delete-icon-${record.id}`}
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
    if (feature) getPartnerList(orgId, currentPage, currentPageSize, filterData, sorterData, activeFilters, activeSorter, history)
  }, [
    orgId,
    feature,
    filterData,
    sorterData,
    renderPage,
    getPartnerList,
    currentPage,
    currentPageSize,
  ])

  let filterColumns = [
    { title: 'Status', key: 'status', backendKey: 'active',
    multiple: false,
    filters: [
      { text: 'Active', value: 'active' },
      { text: 'Inactive', value: 'inactive' }
  ]} ];

  let mappedFields = {};
  filterColumns?.forEach(item => {
    mappedFields[item['key']] = { label: item['title'], options: item['filters'], multiple: item['multiple'] }
  });

  useEffect(()=>{    
    const data = {
        columns: filterColumns,
        setFilterData,
        setSorterData,
        setCurrentPage,
        setDrawerFilters,
        setActiveSorter,
        setActiveFilters,
        setCurrentPageSize,
        initialSortData: '-job_id',
        firstColumnKey: columns[0].key,
        firstColumnCustomTitle: 'Job ID',
    }
    tableOnChangeHandler({
        total: totalCount,
        current: currentPage,
        pageSize: currentPageSize,
    }, filters, {}, 'jobs', data)
},[filters]);

  const handleTableChange = (pagination, filters, sorter) => {
    if(filters?.subType && filters?.subType[0]!==null) {
      window.sendEvent("Hire_Vendor_filter",{
        Filtered_Fields:filters?.subType[0]
      })
    }

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
      firstColumnCustomTitle: 'Vendor Name',
    }
    tableOnChangeHandler(pagination, filters, sorter, 'partner', data)
  }

  const handleClearFilters = () => {
    setDrawerFilters({});
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
                    <NavLink to={routes.HIRING_PARTNER_CREATE.to(orgId, page)}>
                      <button
                        type="button"
                        className="process_fancy_btn fancy_btn active"
                        onClick={()=>{
                          window.sendEvent("Hire_Clicks_on_add_vendor")
                        }}
                      >
                        <span>Add Vendor</span>
                      </button>
                    </NavLink>
                  ) : (
                    <div />
                  )}
                  <Button
                      variant='fancy_btn active'
                      customStyle={{marginLeft:'10px'}}
                      onClick={() => setShowSideFilter(true)}
                    >
                      Filter
                    </Button>
                </div>
              </div>
            </li>
          </ul>
          <DeleteModel
            show={showWarning}
            itemName={selectedPartner.name}
            handleDelete={handleDelete}
            hideWarning={() => {
              setShowWarning(false);
            }}
          />
          {partner.length===0 && isMobile() ? <Empty/>
          :(
<AdvTable
            loading={loader}
            columns={columns}
            dataSource={partner}
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
      <DrawerFilter showFilter={showSideFilter}
        onCloseHandler={() => setShowSideFilter(false)}
        filters={drawerFilters}
        type={'hiring-partner'}
        mappedFields={mappedFields}
        setFilters={setDrawerFilters}
        applyFilter={(filterData)=>setFilters(filterData)}
      />
    </>
  );
};

const mapStateToProps = (state) => ({
  partner: state.hiringPartner.data,
  loader: state.hiringPartner.loader,
  addPermission: state.auth.uiPermissions.hiringpartner.add,
  editPermission: state.auth.uiPermissions.hiringpartner.change,
  deletePermission: state.auth.uiPermissions.hiringpartner.delete,
  totalCount: state.hiringPartner.total,
  renderPage: state.hiringPartner.renderPage,
  feature: state.auth.uiFeatures.hiringpartner.view,
  storedPageSize: state.hiringPartner.size,
  storedFilters: state.hiringPartner.filters,

  storedSorter: state.hiringPartner.sorter,
  storedActiveSorter: state.hiringPartner.activeSorter,
  storedActiveFilters: state.hiringPartner.activeFilters,
});

const mapDispatchToProps = {
  getPartnerList: getPartner,
  deletePartner,
};

export default connect(mapStateToProps, mapDispatchToProps)(HiringPartnerList);
