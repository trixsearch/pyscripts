/* eslint-disable no-console */
/* eslint-disable react/no-unused-state */
// external components
import React, { Component } from "react";
import { connect } from "react-redux";
import axios from "axios";
import { FormCommonOnChange } from 'ezereactcomponents/utils/FormioFileDeletionUtils'

// import EntityHistory from "../History";
import { Link } from "react-router-dom";
import { ArrowLeftOutlined } from '@ant-design/icons'
import { Button } from "../../../components/UI/AppButton/AppButton";
import {
  showScrollArrows,
  FormHandler,
  DocumentFetchHandler,
  parseQueryString,
} from "../../utils";
import EntityDropdown from "../Dropdown";
import CommonStartForm from "../../StartForm/CommonStartForm";
// import StatusModal from "../StatusModal";
import { addToast } from '../../../components/Toast/actions';
import {ENTITY} from '../../../Data/constants'
import Card from "../Card";
import CommonView from "../CommonView";
import Spinner from "../../../components/UI/Spinner/Spinner";
import {
  handleHover,
  handleStatus,
  handleClose,
  editForm,
  formSubmit,
  FireFiles,
} from '../utils';

// stylesheets
import "../Css/entity.css";
import "../../../components/UI/Breadcrumb/breadcrumb.css"
import { withPlatformData } from "../../../platformDataStoreContext";

const APP_URL = process.env.REACT_APP_APP_URL;

// EntityDetail Component
class EntityDetail extends Component {
  constructor(props) {
    super(props);
    this.tabRef = React.createRef();
    this.state = {
      id: null,
      entity_id: this.props.match.params.entityId,
      loader: false,
      apiCalls: [],
      message: null,
      showArrow: false,
      showHistory: false,
      submissionData: {},
      workflows: [],
      entity_data: {},
      workflow_id: "",
      hoveredApps: {},
      startForm: {},
      configure: false,
      status: {
        statusCheck: false,
        openForm: false
      },
      currentTab : "entityStats",
      docData : [],
      entity_fields: {},
      keyTypePair: [],
      entity_statistics_data:{},
      allFormData: [],
      formNames: [],
      currentFormId: 0,
      currentFormData: '',
      fileComponentKeys: [],
      filesUploaded: new Set(),
      isChangedByUser: false,
      bgvInfo: [],
      profileInfo: null,
      partner_profile_id: "",
      is_deleted: true,
    };
  }

  componentDidMount() {
    let { uuid, entityViewId, entityId } = this.props.match.params;
    this.getSingleRecord(uuid, entityViewId, entityId);
  }

  componentWillUnmount() {
    if (this.state.isChangedByUser) {
      FireFiles(this)
    }
  }

  setLoaderState = (setFlag) => {
    this.setState(prevState => {
        let apiCalls = prevState.apiCalls;
        if (setFlag)
            apiCalls.push('true');
        else
            apiCalls.pop();
        return { apiCalls }
    }, () => {
        const { apiCalls } = this.state;
        if (
            apiCalls
            && Array.isArray(apiCalls)
        ) {
            if (apiCalls.length > 0) this.setState({ loader: true });
            if (apiCalls.length === 0) this.setState({ loader: false });
        }
    })
}

  // show carousel arrows
  showArrows = (delay = null) => {
    setTimeout(() => {
      let showArrow = showScrollArrows(this.tabRef.current);
      this.setState({
        showArrow
      });
    }, delay || 50);
  };

  // get details of single record
  getSingleRecord = (orgId, id, entityId) => {
    if (id) {
      let url = `${APP_URL}/${orgId}/entity/master/entity_views/${id}`;
      this.setLoaderState(true);
      axios
        .get(url)
        .then(response => {
          let api_data = response.data.data;
          const formNames = api_data.entity_forms
          const allFormData = new Array(formNames.length).fill(null) || []

          let url_entity = `${APP_URL}/${orgId}/entity/master/data/${entityId}?entity_view_id=${id}`;
          this.setLoaderState(true);
          axios
            .get(url_entity)
            .then(res => {
              this.setState({
                formNames,
                allFormData,
                workflows: api_data.entity_workflows,
                submissionData: { data: res.data.data.entity_data },
                entity_data: res.data.data.entity_data,
                entity_statistics_data : res.data.data,
                entity_fields: res.data.data.entity_fields,
                is_deleted: res.data.data.is_deleted,
                partner_profile_id: res.data.data.partner_profile_id
              }, () => {
                if (formNames.length > 0) {
                  this.handleForms(formNames[0], 0, this.props.match.params.entityModelId)
                }
              });
            })
            .catch(e => {
              console.log(e);
            })
            .finally(() => this.setLoaderState(false))
        })
        .catch(() => {
          this.setState({
            message: "No forms are available to show at this moment"
          });
        })
        .finally(() => {
          this.setLoaderState(false);
          this.showArrows();
        });
    } else {
      this.setState({
        message: "No forms are available to show at this moment"
      });
      this.showArrows();
    }
  };

  handleForms = (formName, id, entityId) => FormHandler(this, this.props.match?.params?.uuid, this.setLoaderState, formName, id, this.props.current_task_owner, 'entity', entityId)

  handleAttachments = () => DocumentFetchHandler(this, this.props.match?.params?.uuid, this.setLoaderState, true, this.props.match.params.entityViewId, this.props.match.params.entityId)

  handleProfileDetails = () => {
    if (this.state.currentTab === 'profileDetails') return;
    const orgId = this.props.match.params.uuid;

    this.setState({
      currentTab: 'profileDetails'
    }, () => {
        this.setLoaderState(true);
      axios.get(`${APP_URL}/${orgId}/entity/master/data/${this.props.match.params.entityId}/get_complete_entity_data`)
          .then(res => {
            this.setState({profileInfo: res.data.data})
          })
          .catch(err => {
            console.log(err);
          })
          .finally(() => {
            this.setLoaderState(false);
          })
    })
  }

  handleBgvInfo = () => {
    if (this.state.currentTab === 'bgv') return;
    // const orgId = this.props.match.params.uuid;

    this.setState({
      currentTab: 'bgv'
    }, () => {
      // if (!this.state.bgvInfo.length) {
      //   this.setLoaderState(true);
      //   axios.get(`${APP_URL}/${orgId}/entity/master/bgv/${this.props.match.params.entityId}`)
      //     .then(res => {
      //       this.setState({bgvInfo: res.data.data})
      //     })
      //     .catch(err => {
      //       console.log(err);
      //     })
      //     .finally(() => {
      //       this.setLoaderState(false);
      //     })
      // }
    })
  }

  historyHandler = showHistory => {
    this.setState({
      showHistory
    });
  };

  handleConfigure = () => {
    this.setState({ configure: true });
  };

  closeMenu = () => {
    this.setState({ configure: false });
  };

  statusModalClose = () => {
    this.setState(prevState => ({
      status: {
        ...prevState.status,
        statusCheck: false
      }
    }));
  };

  closeHistory = () => {
    this.historyHandler(false);
  };

  handleProcessStats = () => {
    this.setState({
      currentFormId: null,
      currentTab: 'entityStats',
    })
    this.showArrows();
  }

  onChange = e => {
    const isChanged = e.changed
    if(isChanged) {
      const isAutoModified = e.changed.flags.autoModified
      if (!isAutoModified) {
        this.setState({
          isChangedByUser: true
        })
      }
    }

    FormCommonOnChange(e, this, null, null, null, null)
  }

  render() {
    const {
      id,
      loader,
      startForm,
      submissionData,
      workflows,
      showArrow,
      status,
      hoveredApps,
      showHistory,
      configure,
      currentTab,
      docData,
      entity_fields,
      entity_statistics_data,
      formNames,
      currentFormId,
      currentFormData,
      bgvInfo,
      profileInfo,
      is_deleted,
    } = this.state;

    const orgId = this.props.match?.params?.uuid;

    // after user clicks hide-details he/she will be redirected to previous list page he was on
    // if pageNumber was falsy or details are opened in new tab, pageNumber will be undefined so as fallback '1' is set. 

    let prevPage = "?page=1";

    if(this.props.location.state) {
      const { page = 1 } = parseQueryString(this.props.location.state.redirectPage || "");
      prevPage = `?page=${page}`;
    }
    const {
      jobId = null,
      eventId = null,
      profileButton = 'show'
  } = parseQueryString(this.props.history.location.search)
    const redirect = `/custom-workflow/org/${orgId}/entity/${this.props.match.params?.entityModelId}${prevPage}`;

    if (status.openForm) {
      return (
        <div>
          <CommonStartForm
            onChange={this.onChange}
            close={() => handleClose(this)}
            name={startForm.name}
            description={startForm.description}
            handleSubmit={data => formSubmit(this, orgId, data)}
            form={startForm.content}
            submissionData={submissionData}
          />
        </div>
      );
    }
  
    return (
      <div
        role="presentation"
        className="entityDetailPage"
      >
        <div
          className="historyContainer"
          style={showHistory ? { width: "100%" } : {}}
        >
          {/* <EntityHistory
            showHistory={showHistory}
            handler={this.closeHistory}
            id={this.props.match.params.entityId}
          /> */}
          {/* <StatusModal
            open={this.state.statusCheck}
            close={this.statusModalClose}
          /> */}
        </div>

        <div
          className="main_changable_container"
          style={{ height: window.innerHeight - 59 }}
        >
          {loader && <Spinner />}
          <div className="other_buttons applicant_details_buttons">
            {/* <Button
              variant="secondary"
              onClick={() => this.historyHandler(true)}
            >
              History
            </Button> */}
            <div className="back_btn">
            <Link to={`/custom-workflow/org/${orgId}/entity/72cddf54-fefc-49e1-bbb1-eada754c0200?page=1`} >
            <Button variant="secondary">
            <ArrowLeftOutlined />
            &nbsp;&nbsp;Back
            </Button> 
            </Link>
            </div>
            {
              !is_deleted && !this.props.isVendor
              && (
                <Button variant="primary" onClick={this.handleConfigure}>
                  Action
                </Button>
              )
            }
            <EntityDropdown
              open={configure}
              isHover
              closeHandler={this.closeMenu}
              handleHover={data => handleHover(this, data)}
              hoveredApps={hoveredApps}
              status={() => handleStatus(this)}
              isIcon
              editForm={data => editForm(this, orgId, data)}
              data={workflows}
            />
          </div>

          <div className="entityDetail">
            <Card open={status.openForm} entity_fields={entity_fields} redirect={redirect} jobId={jobId} eventId={eventId} profileButton={profileButton}/>
            <div className="card2">
              <CommonView
                id={id}
                type={ENTITY}
                doc_data={docData}
                tabRef={this.tabRef}
                showArrow={showArrow}
                formNames={formNames}
                tabStatus={currentTab}
                currentFormId={currentFormId}
                current={this.tabRef.current}
                handleForms={this.handleForms}
                submissionData={submissionData}
                currentFormData={currentFormData}
                handleAttachments={this.handleAttachments}
                handleProcessStats={this.handleProcessStats}
                entity_statistics_data={entity_statistics_data}
                currentId={this.props.match.params.entityModelId}
                bgvInfo={bgvInfo}
                handleBgvInfo={this.handleBgvInfo}
                profileInfo={profileInfo}
                handleProfileDetails={this.handleProfileDetails}
                partner_profile_id={this.state.partner_profile_id}
                bgv_enabled={this.props.bgv_enabled}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  current_task_owner : state.auth.current_task_owner,
  bgv_enabled: state.auth.uiPermissions.bgv?.manage
})

const mapDispatchToProps = { addToast };

export default withPlatformData(connect(mapStateToProps, mapDispatchToProps)(EntityDetail));
