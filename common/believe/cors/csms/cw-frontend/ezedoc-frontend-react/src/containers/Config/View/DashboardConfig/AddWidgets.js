import React, { Component } from 'react';
import { connect } from "react-redux";
import axios from "axios";
import { Responsive, WidthProvider } from 'react-grid-layout';
import { NavLink } from 'react-router-dom';

import { getRegexErrorMessage, validator } from 'containers/utils';
import Spinner from "../../../../components/UI/Spinner/Spinner";
import Modal from '../../../../components/Modal';
import Query from "../../../Report/Chart/Chart";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import ProcessCount from "../../../Dashboard/Process/ProcessApp";
import Charts from "../../../Dashboard/Chart/chart";
import FilterDropdown from "../../../../components/UI/FilterDropdown/FilterDropdown";
import DashboardconfigWidgets from "./DashboardConfigWidgets"
import {
  processCount, getApps, dashboardQuickActions, filterChart, Chart, configDashboard, unmountWidgetData
} from "../../../../store/actions/index";
import "../../../Dashboard/Dashboard.css";
import "./Widget.css"
import "../../../Report/Report.css"

const APP_URL = process.env.REACT_APP_APP_URL;


const ResponsiveGridLayout = WidthProvider(Responsive);

class AddWidget extends Component {
  constructor(props) {
    super(props)
    this.state = {
      allApps: [],
      widgets: [],
      selectedApp: "All Workflows",
      selectedAppId: null,
      showModel: false,
      selectedWidgetType: "barChart",
      query: [
        {
          type: "processSpecific",
          comparision: "EQUALS",
          attribute: "",
          value: "",
          prompt: false,
          field_type: ''
        }],
      config: [],
      report_type: "common",
      windowWidth: window.innerWidth,
      windowHeight: window.outerHeight,
      widgetFormData: {},
      name: "",
      description: "",
      updated: false,
      apps: []
    }
  }

  updateDimensions = () => {
    this.setState({ windowWidth: window.innerWidth, windowHeight: window.outerHeight });
  };

  componentDidMount = () => {
    this.getAllApps()
    this.getProcessCount()
    this.props.quickAction()
    window.addEventListener('resize', this.updateDimensions);
  }

  componentDidUpdate = (prevProps) => {

    if ((this.props.grid_data !== prevProps.grid_data)) {
      this.getAllApps()
      this.getProcessCount()
      this.props.quickAction()
      if (!this.state.updated) {
        // TODO this needs to be refector  
        /* eslint-disable*/
        this.setState({
          widgets: this.props.grid_data,
          updated: true
        })
        /* eslint-enable */
      }
    }
  }

  getProcessCount = () => {
    const orgId = this.props.match?.params?.uuid;
    this.props.processCount(orgId, this.state.selectedAppId)
  }

  getAllApps = () => {
    this.props.getApps().then(data => {
      if (data.length) {
        let allWorkflowData = {
          id: null,
          name: "All Workflows"
        }
        this.setState({
          allApps: [allWorkflowData, ...data],
          apps: data
        })
      }
    })
  }

  handleAppChange = (id) => {
    const allApps = this.state.allApps;
    let activeAppName = allApps.filter(
      (item) => item.id === id
    )[0].name;
    this.setState({
      selectedApp: activeAppName,
      selectedAppId: id,
    }, () => {
      this.getProcessCount()
    })

  }

  selectedWidgetType = (e) => {
    this.setState({
      selectedWidgetType: e.target.value
    })
  }

  showModel = () => {
    this.setState({
      showModel: true
    })
  }

  hideModel = () => {
    this.setState({
      showModel: false,
      selectedWidgetType: "barChart",
      query: [
        {
          type: "processSpecific",
          comparision: "EQUALS",
          attribute: "",
          value: "",
          prompt: false,
          field_type: ''
        }],
      config: [],
      widgetFormData: {},
      name: "",
      description: ""
    })
  }

  saveModel = () => {
    let save = true
    let elements = Array.from(document.getElementsByClassName("query-decision"));
    elements.map(element => {
      let newElement = element
      if ((!element.value||element.value==="Select Attribute") && element.required) {
        newElement.style.border = "2px solid #dc3545";
        save = false
      } else {
        newElement.style.border = "1px solid #ccc";
    }
      return newElement
    })
    if (save) {
    this.setState({
      showModel: false,
    })
    this.addWidget()
  }
  }

  addWidget = () => {
    const { selectedWidgetType, query, widgetFormData } = this.state

    this.setState(
      prevState => {
        let newWidget = prevState.widgets;

        if (selectedWidgetType) {
          newWidget.push({
            grid: {
              x: 6, y: 0, w: 4, h: 3, minH: 3, minW: 2, maxH: 3
            },
            type: selectedWidgetType,
            chartQuery: query,
            formData: widgetFormData
          });
        }
        return {
          widgets: newWidget,
          selectedWidgetType: "barChart",
          query: [
            {
              type: "processSpecific",
              comparision: "EQUALS",
              attribute: "",
              value: "",
              prompt: false,
              field_type: ''
            }],
          config: [],
          widgetFormData: {},
          name: "",
          description: ""
        }
      }
    );
  }

  selectedWorkflow = (e) => {
    let id = e.target.value
    let url = `${APP_URL}/${this.props.match?.params?.uuid}/apps/${id}/report_view`
    axios.get(url)
      .then(response => {
        this.setState({ config: response.data.data })
      }).catch(() => {
        this.setState({ config: [] })
      })
  }

  handleAttribute = (data, i, formFields = []) => {
    let elements = Array.from(document.getElementsByClassName("query-decision"));
    elements.map(element => {
      let newElement = element
      if ((!element.value||element.value==="Select Attribute") && element.required) {
        newElement.style.border = "2px solid #dc3545";
      } else newElement.style.border = "1px solid #ccc";
      return newElement
    })
    let value = data.target.value;
    let checkboxValue = data.target.checked;
    let inputType = data.target.type;
    if (inputType === 'checkbox') {
      value = checkboxValue;
    }
    if (data.target.type === "number") {
      value = Number(data.target.value);
    }

    let name = data.target.name;
    let newQuery = this.state.query;
    if (name === "type") {
      newQuery[i].attribute = ""
      newQuery[i].comparision = "EQUALS"
      newQuery[i].value = ""
    }
    let queryTemp = newQuery;
    if (name === 'attribute' && formFields.length > 0) {
      let fieldTypeData = formFields.filter(field => field.key === value);
      let field_type = ''
      if (fieldTypeData.length !== 0) {
        field_type = fieldTypeData[0].type
      }
      queryTemp[i] = {
        ...queryTemp[i],
        [name]: value,
        'field_type': field_type
      };
    } else {
      queryTemp[i] = {
        ...queryTemp[i],
        [name]: value,
      };
    }
    this.setState(() => ({
      query: queryTemp
    }));
  };

  removeWidget = (id) => {
    const { widgets } = this.state
    let newWidget = widgets
    newWidget.splice(id, 1)
    this.setState(
      {
        widgets: newWidget
      }
    );
  }

  onLayoutChange = (layout) => {
    const { widgets } = this.state
    let newWidgets = widgets
    if (newWidgets.length) {
      layout.map((item, index) => {
        newWidgets[index].grid = item
        return newWidgets
      })
    }

    this.setState({
      widgets: newWidgets
    })
  }

  showChartData = (startMonth, startYear, endMonth, endYear, id) => {
    const orgId = this.props.match?.params?.uuid;
    if (id) {
      this.props.onChartFilter(orgId, startMonth, startYear, endMonth, endYear, id);
    } else {
      this.props.onChart(orgId, startMonth, startYear, endMonth, endYear);
    }
  }

  delete = (data) => {
    let query = this.state.query.filter((e, key) => key !== data);
    this.setState(() => ({
      query
    }));
  };

  count = () => {
    let len = this.state.query.length;
    let query = this.state.query;
    query[len] = {
      type: "processSpecific",
      comparision: "EQUALS",
      attribute: "",
      value: "",
      prompt: false,
      field_type: ''
    };
    this.setState(() => ({
      query
    }));
  };

  handleChange = (data) => {

    let name = data.target.name
    let value = data.target.value
    this.setState((state) => {
      let widgetFormData = state.widgetFormData
      return {
        [name]: value,
        widgetFormData: {
          ...widgetFormData,
          [name]: value
        }
      }
    })
  }


  componentWillUnmount = () => {
    this.props.unmountWidgetData()
    window.removeEventListener("resize", this.updateDimensions);
  }

  render() {
    const orgId = this.props.match?.params?.uuid;

    const {
      allApps, selectedApp, widgets, config, query, windowHeight, windowWidth, name, description, apps
    } = this.state

    const {
      formData, activeRoleId, id, processCountData, nameValidator
    } = this.props

    const nameValidator1 = validator(name)

    let unClickable = true
    
    const processCounts = (

      <>
        <FilterDropdown
          list={allApps}
          classes='config_view_role_dropdown'
          selectedItem={selectedApp}
          onItemClickHandler={this.handleAppChange}
        />
        {processCountData
          ? (
            <ProcessCount
              key={`${processCount.ongoing}-${processCount.completed}-${processCount.withdrawn}`}
              data={processCountData}
              processKey={this.state.selectedAppId}
              unClickable={unClickable}
            />
          )
          : <ProcessCount processCountLoader={this.props.processCountLoader} />}
        <Charts
          updateType=""
          id={this.state.selectedAppId}
          showChartData={this.showChartData}
          chartContentLoader={this.props.chartContentLoader}
          data={this.props.chart ? this.props.chart : null}
        />
      </>
    )

    return (
      <div>
        {!widgets.length?<Spinner/>:null}
        <button type="button" className="fancy_btn active add-widget-btn" onClick={() => this.showModel()}>Add Widgets</button>
        {this.state.showModel ? (
          <Modal
          title='Add Widgets'
          show={this.state.showModel}
          customClassName='config-dash-modal-cont'
          onClose={() => this.hideModel()}
          secondaryBtn={{
            text: 'Cancel', className: 'fancy_btn', onClick: () => this.hideModel()
          }}
          primaryBtn={{
            text: 'Save', disabled: !(name && description && config.length) || nameValidator1, className: 'fancy_btn active', onClick: this.saveModel
          }}
          >
          <div className="config-dashboard-model">
            <select onChange={this.selectedWorkflow} style={{ width: 300 }} className="form-control" >
              {apps.length && <option selected disabled value=''>Select Workflow</option>}
              {apps.length
                ?apps.map((item, index) => (
                <option key={`${index + 1}__`} value={item.id}>{item.name}</option>
              ))
              :(<option selected disabled>No Workflows</option>)}
            </select>

            <form action="" className="form_up_box" style={{ marginTop: '30px' }}>
              <div className="config-dashboard-model-form-1 col-md-6" style={{ display: 'block' }} >
                <input
                  name='name'
                  type='text'
                  min='1'
                  value={name}
                  onChange={this.handleChange}
                  className='floating-input'
                  style={nameValidator ? {borderColor: '#d0021b', color: '#d0021b'} : {}}
                />
                <label>Name</label>
              </div>
              <div className="config-dashboard-model-form-2 col-md-6" style={{ display: 'block' }} >
                <input
                  name='description'
                  type='text'
                  min='1'
                  maxLength='250'
                  value={description}
                  onChange={this.handleChange}
                  className='floating-input'
                />
                <label>Description</label>
              </div>
            </form>
            {
              nameValidator1
              ? (<div className='error-message-element' style={{color: 'red', fontSize: '14px'}}>{getRegexErrorMessage('name')}</div>)
              : null
            }

            <Query
              hideFilter={false}
              show={false}
              report_type={this.state.report_type}
              query={query}
              handleAttribute={this.handleAttribute}
              count={this.count}
              config={config}
              delete={this.delete}
              runReport={false}
              checkType={this.checkType}
            />
            <p className="chart-type-text" >Chart Type:</p>
            <select onChange={this.selectedWidgetType} style={{ width: 300 }} className="form-control" >
              <option key="a" value="barChart">Bar Chart</option>
              <option key="b" value="lineChart">Line Chart</option>
              <option key="c" value="pieChart">Pie Chart</option>
              <option key="d" value="funnelChart">Funnel Chart</option>
            </select>
          </div>
          </Modal>
        )
        :null}
        
        <div className="config-dash-layout-cont">
          <ResponsiveGridLayout
            className="layout"
            style={{ marginTop: '10px' }}
            rowHeight={100}
            breakpoints={{
              lg: 1200, md: 996, sm: 768, xs: 480, xxs: 200
            }}
            cols={{
              lg: 12, md: 12, sm: 6, xs: 6, xxs: 4
            }}
            onLayoutChange={this.onLayoutChange}
            margin={[0,0]}
          >
            {widgets.map((item, index) => {
              return (
                <div
                  className="wigdet_cont_body"
                  key={`${index + 1}__`}
                  data-grid={item.grid}
                >
                  <>
                    {(widgets.length - 1) === index && !(item.type === "processCount" || item.type === "groupTaskCount" || item.type === "myTaskCount")
                      ? <span style={{ float: "right" }} role="button" tabIndex="0" onClick={() => this.removeWidget(index)} onKeyPress={() => { }}>✖</span>

                      : null}
                    {item.type === "processCount"
                      ? processCounts
                      : (
                        <DashboardconfigWidgets
                          item={item}
                          index={index}
                          navlink={false}
                        />
                      )
                    }

                  </>
                </div>
              )
            })}

          </ResponsiveGridLayout>
        </div>
        <div className="config-dash-footer">
          <NavLink to={`/view?page=${this.props.nextPage}`}>
            <button type='button' className="fancy_btn">Cancel</button>
          </NavLink>
          {(windowHeight === window.screen.availHeight && windowWidth === window.screen.availWidth)
            ? (
                <button
                  type="submit"
                  className="fancy_btn active"
                  disabled={!(widgets.length && formData.name && formData.description && activeRoleId) || nameValidator}
                  onClick={() => this.props.configDashboard(
                    orgId,formData.name, formData.description, activeRoleId, widgets, id, this.props.history, this.props.nextPage
                  )}
                >
                  Save Layout
                </button>
            )
            : <p className="full_screen_error">Maximize your browser and refresh before saving</p>
          }
        </div>
      </div>
    )
  }

}
const mapStateToProps = state => ({

  chart: state.chart.data,
  chartContentLoader: state.chart.chartContentLoader,
  widgetData: state.view.widgetData,
  processCountData: state.view.processCountData,
  processCountLoader: state.view.processCountLoader

})

const mapDispatchToProps = {
  processCount,
  getApps,
  quickAction: dashboardQuickActions,
  onChart: Chart,
  onChartFilter: filterChart,
  configDashboard,
  unmountWidgetData
};

export default connect(mapStateToProps, mapDispatchToProps)(AddWidget);