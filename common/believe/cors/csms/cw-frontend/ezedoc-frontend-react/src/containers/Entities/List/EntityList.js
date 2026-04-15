/* eslint-disable no-confusing-arrow */
/* eslint-disable react/no-unused-state */

// external components
import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import { PlayCircleOutlined } from '@ant-design/icons'
import axios from "axios";
import { FormCommonOnChange } from 'ezereactcomponents/utils/FormioFileDeletionUtils'

// internal components
import {
    getEntityList,
    getEntitySearchList,
    clearEntitySearch,
    toggleEntitySearchBar,
} from "store/actions/Entity/Entity";
import Spinner from "components/UI/Spinner/Spinner";
import FilterDropdown from "components/UI/FilterDropdown/FilterDropdown";
import { AdvTable, getColumnSearchProps } from 'components/UI/AntDesignTable/AdvTable'
import { ENTITY_LIST_FILTER, ITEMS_PER_PAGE } from "Data/constants";
import Modal from '../../../components/Modal';
import routes from "../../../urls";
import { EntityPhoto, email_test, display_var_check } from "../../Process/ProcessComponents";
import { Button } from "../../../components/UI/AppButton/AppButton";
import BulkImport from "../../../components/UI/DocumentUpload/BulkImport";
import FeatureDropdown from "../Dropdown";
import { parseQueryString, Item } from "../../utils";
import StatusModal from "../StatusModal";
import CommonStartForm from "../../StartForm/CommonStartForm";
import { addToast } from '../../../components/Toast/actions';
import {
    handleHover,
    handleStatus,
    handleClose,
    editForm,
    formSubmit,
    FireFiles,
} from '../utils';
import no_records from "../../../assets/images/no_records.png";
import { withPlatformData } from '../../../platformDataStoreContext';

// stylesheets
import "../Css/entity.css";

// assets
import userProfilePlaceholderImg from "../../../assets/images/svg/userplaceholder.svg";

const APP_URL = process.env.REACT_APP_APP_URL;

// Entity list filter options
const filterOptions = [
    {
        name: "Active",
        id: "active",
    },
    {
        name: "Inactive",
        id: "inactive",
    },
    {
        name: "All",
        id: "all",
    },
]

// EntityList Table Component
class EntityList extends Component {
    state = {
        bulk_intitiate_modal: false,
        bulk_process_name: "Entity Profile",
        open: false,
        entityModelId: '',
        selected_data: {},
        error_modal: false,
        loader: '',
        status: {
            openForm: false
        },
        configure: false,
        startForm: {},
        submissionData: {},
        hoveredApps: {},
        entity_id: '',
        entityDeletedStatus:false,
        keyTypePair: [],
        workflow_id: '',
        filter: JSON.parse(localStorage.getItem(ENTITY_LIST_FILTER)) || filterOptions[0],
        fileComponentKeys: [],
        filesUploaded: new Set(),
        isChangedByUser: false,

        filterData: {},
        activeFilters: [],
        sorterData: 'entity_name',
        activeSorter: {},
        currentPage: 1,
        currentPageSize: ITEMS_PER_PAGE,
    };

    componentDidMount() {
        let entityModelId = this.props.match.params.id;
        const orgId = this.props.match?.params?.uuid;

        const { page = 1 } = parseQueryString(this.props.location.search)

        this.setState({
            entityModelId,
            currentPage: page,
        }, () => {
            this.props.getEntityList(
                orgId,
                entityModelId,
                this.state.filter.id,
                this.state.currentPage,
                this.state.currentPageSize,
                this.state.filterData,
                this.state.sorterData,
                this.props.history,
            )
        })
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (nextProps.location.pathname !== this.props.location.pathname) {
            const orgId = this.props.match?.params?.uuid;
            this.setState({
                entityModelId: nextProps.match.params.id,
                currentPage: 1,
            }, () => {
                this.props.getEntityList(
                    orgId,
                    this.state.entityModelId,
                    this.state.filter.id,
                    this.state.currentPage,
                    this.state.currentPageSize,
                    this.state.filterData,
                    this.state.sorterData,
                    this.props.history,
                )
            })
            return true;
        }

        if (nextProps.location.search !== this.props.location.search) {
            const { page = 1 } = parseQueryString(nextProps.location.search);
            const id = this.props.match.params.id;
            const orgId = this.props.match?.params?.uuid;

            this.setState({
                entityModelId: id,
                currentPage: page,
            }, () => {
                this.props.getEntityList(
                    orgId,
                    this.state.entityModelId,
                    this.state.filter.id,
                    this.state.currentPage,
                    this.state.currentPageSize,
                    this.state.filterData,
                    this.state.sorterData,
                    this.props.history,
                )
            })
            return true;
        }

        if (
            JSON.stringify(nextState.entity_list)
            !== JSON.stringify(this.state.entity_list)
        )
            return true;
        return true;
    }

    componentWillUnmount() {
        this.props.toggleEntitySearchBar(true);
        if (this.state.isChangedByUser) {
            FireFiles(this)
        }
    }

    handleBulkModal = () => {
        this.setState((state) => ({
            bulk_intitiate_modal: !state.bulk_intitiate_modal,
        }));
    };

    closeMenu = () => {
        this.setState({ open: false })
    }

    showApps = () => {
        this.setState({ open: true })
    }

    handleViewModal = () => {
        this.setState((state) => ({
            error_modal: !state.error_modal,
        }));
    };

    editForm = (data) => {
        this.setState({
            bulk_process_name: data.name,
            selected_data: data,
            open: false,
            bulk_intitiate_modal: true,
        });
    };

    handleFilterChange = (value) => {
        const orgId = this.props.match?.params?.uuid;

        this.setState({
            filter: filterOptions.filter((option) => option.id === value)[0],
            currentPage: 1,
        }, () => {
            localStorage.setItem(
                ENTITY_LIST_FILTER,
                JSON.stringify(this.state.filter)
            )
            this.props.getEntityList(
                orgId,
                this.state.entityModelId,
                this.state.filter.id,
                this.state.currentPage,
                this.state.currentPageSize,
                this.state.filterData,
                this.state.sorterData,
                this.props.history,
            )
        })
    }

    handleConfigure = () => {
        this.setState({ configure: true })
    };

    closeConfigure = () => {
        this.setState({ configure: false });
    };

    handleUpdateModal = (entity_id, entityViewId, isDeleted) => {
        const orgId = this.props.match?.params?.uuid;
        this.setState({
            entity_id,
            startForm: {},
            hoveredApps: {},
            entityDeletedStatus: isDeleted,
        }, () => {
            if (entityViewId) {
                let url_entity = `${APP_URL}/${orgId}/entity/master/data/${entity_id}?entity_view_id=${entityViewId}`;
                this.setState({
                    loader: true
                })
                axios
                    .get(url_entity)
                    .then(res => {
                        this.setState({
                            submissionData: { data: res.data.data.entity_data }
                        }, () => this.handleConfigure())
                    })
                    .catch(e => {
                        // eslint-disable-next-line no-console
                        console.log(e);
                    })
                    .finally(() => {
                        this.setState({
                            loader: false
                        })
                    })
            }
        })
    }

    handleEntityWorkflowItemClick = (data) => {
        const orgId = this.props.match?.params?.uuid;
        this.closeConfigure()
        editForm(this, orgId, data)
    }

    onChange = e => {
        const isChanged = e.changed
        if (isChanged) {
            const isAutoModified = e.changed.flags.autoModified
            if (!isAutoModified) {
                this.setState({
                    isChangedByUser: true
                })
            }
        }

        FormCommonOnChange(e, this, null, null, null, null)
    }

    handleTableChange = (pagination, filters, sorter, columnDetails) => {
        let filtersObj = {}
        let activeFiltersData = []
        Object.keys(filters).map(item => {
            if (filters[item]) {
                let backendKey = null
                let record = {}
                // eslint-disable-next-line no-unused-expressions
                columnDetails
                    && Array.isArray(columnDetails)
                    && columnDetails.length > 0
                    && columnDetails.map(col => {
                        if (col.key === item) {
                            backendKey = col.backendKey
                            if (item === 'entityName') {
                                record = {
                                    ...col,
                                    title: 'Name'
                                }
                            } else record = col
                        }
                        return null
                    })

                if (backendKey) filtersObj[backendKey] = filters[item][0] || ''

                const value = filtersObj[backendKey]

                activeFiltersData.push({
                    value,
                    record,
                })
            }
            return null
        })

        let sorterData = null
        if (!sorter.column && !sorter.order) sorterData = ('entity_name')
        else sorterData = sorter.order === 'ascend' ? sorter.column.backendKey : `-${sorter.column.backendKey}`

        this.setState({
            filterData: filtersObj,
            activeFilters: [...activeFiltersData],
            sorterData,
            activeSorter: sorter,
            currentPage: pagination.current,
            currentPageSize: pagination.pageSize,
        }, () => {
            this.props.getEntityList(
                this.props.match?.params?.uuid,
                this.state.entityModelId,
                this.state.filter.id,
                this.state.currentPage,
                this.state.currentPageSize,
                this.state.filterData,
                this.state.sorterData,
                this.props.history,
            )
        })
    }

    handleClearFilters = () => {
        const orgId = this.props.match?.params?.uuid;

        this.setState({
            filterData: {},
            activeFilters: [],
        }, () => {
            this.props.getEntityList(
                orgId,
                this.state.entityModelId,
                this.state.filter.id,
                this.state.currentPage,
                this.state.currentPageSize,
                this.state.filterData,
                this.state.sorterData,
                this.props.history,
            )
        })
    }

    render() {
        let {
            bulk_intitiate_modal,
            bulk_process_name,
            open,
            selected_data,
            error_modal,
            entityModelId,
            status,
            configure,
            startForm,
            submissionData,
            hoveredApps,
            loader,

            filterData,
            activeFilters,
            sorterData,
            activeSorter,
            currentPage,
            currentPageSize,
            entityDeletedStatus,
        } = this.state;

        const {
            workflows, total, error
        } = this.props.entity;
        const orgId = this.props.match?.params?.uuid;


        let bulkEnabledWorkflows = []
        if(this.state.filter.id === 'active') {
            bulkEnabledWorkflows = workflows.filter(item => item.bulk_support && item.enabled_for_entities_by_status !== "Inactive")
        } else if (this.state.filter.id === 'inactive') {
            bulkEnabledWorkflows = workflows.filter(item => item.bulk_support && item.enabled_for_entities_by_status !== "Active")
        } else bulkEnabledWorkflows = workflows.filter(item => item.bulk_support)

        let filteredWorkflows = []
        if(entityDeletedStatus === true) {
            filteredWorkflows = workflows.filter(item => item.enabled_for_entities_by_status!=="Active")
        }else{
            filteredWorkflows = workflows.filter(item => item.enabled_for_entities_by_status!=="Inactive")
        }
        
        const entityListData = this.props.entity.data;

        let bulk_update_permission = false

        const entityModelData = this.props.entityList.find((element) => element.master_model_id === this.props.match.params.id);
        if (entityModelData) {
            bulk_update_permission = entityModelData.bulk_update_permission
        }

        let process_key = selected_data ? selected_data.process_key : "";
        let master_model_id = this.props.match.params.id;
        let url = `${APP_URL}/${orgId}/entity/master/data/entity_bulk_update?process_key=${process_key}&master_model_id=${master_model_id}`;

        let columns = [
            {
                title: '',
                dataIndex: 'entity_fields',
                key: 'profilePicture',
                width: '7%',
                render: (entity_fields, record) => {
                    const isActive = record.is_deleted
                    const entityPhoto = entity_fields.entity_photo
                    return entityPhoto && entityPhoto.length
                        ? (
                            <Fragment>
                                <span className={`status-dot ${!isActive ? 'green' : 'red'}`} />
                                <EntityPhoto url={entityPhoto[0].data.url} />
                            </Fragment>
                        ) : (
                            <div className='process_details_text user_img'>
                                <span className={`status-dot ${!isActive ? 'green' : 'red'}`} />
                                <img src={userProfilePlaceholderImg} alt='placeholder' className='image-cropper' />
                            </div>
                        )
                }
            },
            {
                title: () => (
                    <div className='adv-table-total-items-parent'>
                        Name
                        <div className='adv-table-total-items'>{total > 99999 ? '99999+' : total}</div>
                    </div>
                ),
                dataIndex: 'entity_fields',
                key: 'entityName',
                backendKey: 'entity_name',
                sorter: true,
                ellipsis: true,
                render: (entity_fields, record) => {
                    return entity_fields.entity_name
                        ? (
                            <Item
                                type='navlink'
                                id={record.id}
                                name='location-name-navlink'
                                data={entity_fields.entity_name}
                                path={routes.ENTITY_DETAILS.to(orgId, entityModelId, entityListData.entity_view_id, record.id)}
                            />
                        ) : ''
                },
                defaultSortOrder: 'ascend',
                sortDirections: sorterData === 'entity_name' ? ['descend'] : ['ascend', 'descend'],
                ...getColumnSearchProps(filterData, 'entity_name', 'entity_name'),
                sortOrder: activeSorter.columnKey === 'entityName' ? activeSorter.order : false,
            }
        ]
        if(!this.props.isVendor) {
            columns.push({
                title: 'Actions',
                dataIndex: 'actions',
                key: 'actions',
                width: '7%',
                align: 'center',
                render: (text, record) => {
                    let content = null
                    content = (
                        <Item
                            type='icon'
                            data='Start'
                            id={record.id}
                            name='entity-start-icon'
                        >
                            <PlayCircleOutlined
                                data-tip
                                data-for={`entity-start-icon-${record.id}`}
                                onClick={() => this.handleUpdateModal(record.id, entityListData.entity_view_id, record.is_deleted)}
                            />
                        </Item>
                    )
                    return content
                }
            });
        }

        let columnDetails = [...columns]
        if (entityListData) {
            if (entityListData.entities && entityListData.entities.length > 0) {
                const extraColumnDetails = []
                Object.keys(entityListData.entities[0].entity_fields).filter(item => {
                    if (item !== 'entity_name' && item !== 'entity_photo') {
                        const compKey = entityListData.entities[0].key_label.filter(i => i.label === item)[0].key
                        const compLabel = item
                        const columnData = {
                            title: compLabel,
                            dataIndex: 'entity_fields',
                            key: compKey,
                            backendKey: compKey,
                            sorter: true,
                            ellipsis: true,
                            render: (entity_fields, record) => entity_fields[compLabel] && email_test(entity_fields[compLabel] || '') ? '-' : <Item type='text' data={display_var_check(entity_fields[compLabel] || '-')} id={record.id} name={`entity-extra-field-${compKey}`} />,
                            ...getColumnSearchProps(filterData, compKey, compLabel),
                            sortOrder: activeSorter.columnKey === compKey ? activeSorter.order : false,
                        }
                        extraColumnDetails.push(columnData)
                    }
                    return null
                })

                const lastItem = columns.pop()
                columnDetails = [...columns, ...extraColumnDetails, lastItem]
            }
        }

        if (error) {
            return (
                <div className="no_records_cont">
                    <div className="no_records_img_text">
                        <img src={no_records} alt="" />
                        <p>Nothing to show</p>
                    </div>
                </div>
            );
        }

        if (status.openForm) {
            return (
                <div>
                    {loader && <Spinner />}
                    <CommonStartForm
                        onChange={this.onChange}
                        name={startForm.name}
                        form={startForm.content}
                        close={() => handleClose(this)}
                        submissionData={submissionData}
                        description={startForm.description}
                        handleSubmit={(data) => formSubmit(this, orgId, data)}
                    />
                </div>
            );
        }

        return (
            <div className="entityListPage">
                {/* {(this.props.entity.loader || loader) && <Spinner />} */}
                <StatusModal
                    open={error_modal}
                    close={this.handleViewModal}
                    info="View is not set for this profile"
                    title="Entity"
                />
                <Modal
                    show={configure}
                    onClose={this.closeConfigure}
                    title='Choose an entity workflow'
                    primaryBtn={{
                        text: 'Close',
                        onClick: this.closeConfigure,
                        className: "fancy_btn active"
                    }}
                    customClassName='entity_view_update_modal'
                >
                    <div className='entity_update_workflows_container'>
                        <FeatureDropdown
                            open
                            isHover
                            isIcon
                            data={filteredWorkflows}
                            hoveredApps={hoveredApps}
                            closeHandler={() => { }}
                            status={() => handleStatus(this)}
                            handleHover={data => handleHover(this, data)}
                            editForm={data => this.handleEntityWorkflowItemClick(data)}
                        />
                    </div>
                </Modal>
                <div
                    className="main_changable_container"
                    style={{ height: window.innerHeight - 59 }}
                >
                    <div className='process_details_tab_cont entity_list'>
                        <div className="other_buttons">
                            <FilterDropdown
                                list={filterOptions}
                                classes="entity-list-filter-dropdown"
                                selectedItem={this.state.filter.name}
                                onItemClickHandler={this.handleFilterChange}
                            />
                            {
                                bulk_update_permission && !this.props.isVendor ? (
                                    <Button variant="primary" onClick={this.showApps}>
                                        Start Bulk
                                    </Button>
                                ) : null
                            }
                        </div>
                        <FeatureDropdown
                            isIcon={false}
                            hoveredApps={{}}
                            open={open}
                            isHover={false}
                            editForm={this.editForm}
                            data={bulkEnabledWorkflows}
                            closeHandler={this.closeMenu}
                        />

                        <AdvTable
                            loading={this.props.entity.loader || loader}
                            columns={columnDetails}
                            dataSource={entityListData.entities}
                            pagination={{
                                total: total,
                                current: currentPage,
                                pageSize: currentPageSize,
                            }}
                            rowKey={record => record.id}
                            onChange={(pagination, filters, sorter) => this.handleTableChange(pagination, filters, sorter, columnDetails)}
                            activeFilters={activeFilters}
                            handleClearFilters={this.handleClearFilters}
                        />

                        <BulkImport
                            show={bulk_intitiate_modal}
                            handleShow={this.handleBulkModal}
                            url={url}
                            title={`Bulk Initiate ${bulk_process_name}`}
                            history={this.props.history}
                            redirectUrl={`/custom-workflow/org/${orgId}/process/import-history`}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

export default withPlatformData(connect(({ entity, auth }) => ({
    entity: { ...entity },
    entityList: auth.entityList
}), {
    addToast,
    getEntityList,
    clearEntitySearch,
    searchEntity: getEntitySearchList,
    toggleEntitySearchBar
})(EntityList));
