/* eslint-disable no-console */
import React, { Component } from "react";
import { Link, withRouter } from "react-router-dom";
import axios from "axios";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import Spinner from '../../components/UI/Spinner/Spinner';
import PortalSection from "./PortalSection"
import WorkflowAddAssociate from "./AddWorkflow"
import WorkflowSection from "./WorkFlowSection"
import { HasAccess } from "../../platformDataStoreContext";

import "./portal.css";
import { CW_SERVICE_CONTENT_DELETE, CW_SERVICE_CONTENT_UPDATE, CW_SERVICE_PORTAL_UPDATE } from "../../Data/constants";

const APP_URL = process.env.REACT_APP_APP_URL;

// a little function to help us with reordering the result
const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

const getItemStyle = (draggableStyle) => ({
  margin: "7px 0 0 7px",
  userSelect: "none",
  ...draggableStyle
});

const getListStyle = () => ({
  margin: "0px 10px 10px 2px",
  display: "flex",
  overflowX: "auto"
});

class Portals extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      portalId: 0,
      contents: false,
      contentsData: [],
      contentToadd: [],
      isLoading: false,
      workflows: false,
      workflowToadd: [],
      workflowsData: [],
      messageContent: "",
      addWorkflow: false,
    };
    this.portalId = this.portalId.bind(this);
    this.addWorkflow = this.addWorkflow.bind(this);
    this.addContent = this.addContent.bind(this);
    this.Open = this.Open.bind(this);
    this.handleContent = this.handleContent.bind(this);
    this.handleApps = this.handleApps.bind(this);
    this.create = this.create.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
    this.save = this.save.bind(this);
    this.deleteContent = this.deleteContent.bind(this);
  }

  componentDidMount() {
    let [firstPortal] = this.props.data
    if(firstPortal) {
      this.portalId(firstPortal.id);
    }
  }

  onDragEnd(result) {
    // dropped outside the list
    if (!result.destination) {
      return;
    }

    const contentsData = reorder(
      this.state.contentsData,
      result.source.index,
      result.destination.index
    );

    this.setState(() => ({
      contentsData,
      open: true
    }));
  }

  save() {
    let order = [];

    if(this.state.contentsData) {
      this.state.contentsData.map((e, index) => {
        order.push({ id: e.order_obj_id, order: index+1 })
        return e
      })
  }

    this.setState({
      isLoading: true
    })

    axios.put(`${APP_URL}/${this.props.match?.params?.uuid}/portal/content/order/${this.state.portalId}`, order)
      .then(() => {
        this.setState({
          open: false,
          isLoading: false
        })
      })
      .catch(err => {
        console.log(err)
      })
  }

  deleteContent(flag, order_obj_id) {
    // delete associated workflows 
    let url = '';
    if (flag === "assoc_workflows") {
      url = `${APP_URL}/${this.props.match?.params?.uuid}/apps/${order_obj_id}`;
      let reqObj = {
        "portal": null
      }

      this.setState({
        isLoading: true
      })

      axios.put(url, reqObj)
        .then((res) => {
          if (res.data.success === true) {
            this.setState(prevState => ({
              isLoading: false,
              workflowsData: prevState.workflowsData.filter(cont => cont.id !== order_obj_id)
            }));
          }
        })
        .catch(err => {
          console.log(err)
        })
    }

    // delete associated contents
    if (flag === "content_flows") {
      url = `${APP_URL}/${this.props.match?.params?.uuid}/portal/content/order/${order_obj_id}`;
      
      this.setState({
        isLoading: true
      })

      axios.delete(url)
        .then((res) => {
          if (res.data.success === true) {
            this.setState(prevState => ({
              isLoading: false,
              contentsData: prevState.contentsData.filter(cont => cont.order_obj_id !== order_obj_id)
            }));
          }
        })
        .catch(err => {
          console.log(err)
        })
    }
  }

  create(decisionVar) {
    if (decisionVar === true) {
      let id = this.state.portalId
      let data = [];

      if(this.state.workflowToadd) {
        this.state.workflowToadd.map((e) => {
          data.push({ "id": e.value, "portal": id })
          return e
        })
    }

      this.setState({
        isLoading: true
      })

      axios.put(`${APP_URL}/${this.props.match?.params?.uuid}/apps/set_portal`, data)
        .then((res) => {
          this.setState(prevState => ({
            workflowsData: prevState.workflowsData.concat(res.data.data),
            addWorkflow: false,
            isLoading: false
          }))
        })
        .catch(err => {
          this.setState({
            message: err.response.data.message
          })
        })
    } else {
      let id = this.state.portalId
      let content = [];

      if(this.state.contentToadd) {
          this.state.contentToadd.map((e) => {
          content.push({ "order": 0, "content": e.value, "portal": id })
          return e
        })
      }

      this.setState({
        isLoading: true
      })

      axios.post(`${APP_URL}/${this.props.match?.params?.uuid}/portal/content/order`, content)
        .then((res) => {
          this.setState(prevState => ({
            contentsData: prevState.contentsData.concat(res.data.data),
            addWorkflow: false,
            isLoading: false
          }))
        })
        .catch(err => {
          this.setState({
            message: err.response.data.message
          })
        })
    }
  }

  portalId(id) {
    let url = `${APP_URL}/${this.props.match?.params?.uuid}/portal/${id}`;

    this.setState({
      portalId: id,
      isLoading: true,
    })
    
    axios.get(url)
      .then((res) => {
        let data = res.data.data
        this.setState({
          isLoading: false,
          workflowsData: data.workflows,
          contentsData: data.published_content
        })
      })
      .catch(err => {
        console.log(err)
      })
  }

  handleContent(event) {
    this.setState({
      contentToadd: event,
    })
  }

  handleApps(event) {
    this.setState({
      workflowToadd: event,
    })
  }

  addWorkflow() {
    this.setState({
      workflows: true,
      addWorkflow: true,
      messageContent: "Associate a new workflow with this portal"
    });
  }

  addContent() {
    this.setState({
      workflows: false,
      addWorkflow: true,
      messageContent: "Associate a new content with this portal"
    });
  }

  Open() {
    this.setState({
      addWorkflow: false
    });
  }

  render() {
    let data = this.props.data;
    let workflowSection = null;
    let portals = null;

    portals = data && data.map(d => {
      return (
        <PortalSection
          key={d.id}
          clicked={this.state.portalId}
          id={d.id}
          name={d.name}
          desc={d.description}
          click={() => this.portalId(d.id)}
        />
      );
    });

    workflowSection = this.state.workflowsData.map((d) => {
      return (
        <WorkflowSection
          key={d.id}
          id={d.id}
          description={d.description}
          name={d.name}
          icon={d.icon_class}
          deleteContent={this.deleteContent}
          click={() => this.portalId(d.id)}
        />
      )

    })

    if (this.state.addWorkflow === false) {
      return (
        <>
        {this.state.isLoading && (<Spinner />)}
        <div className="portals_container">
          <div className="app_category_cont">
            <div className="app_category_head">
              <p className="app_category_portal_title">Portals</p>
            </div>
            <div className="app_category_card_cont">
              <div className="app_showing_card_cont">
                {portals}
              </div>
            </div>
          </div>
          <div className="app_showing_cont">
            <div className="app_showing_head">
              <div>
                <p>Associated Workflows</p>
              </div>
            </div>
            <div className="app_showing_card_cont">
              {workflowSection}
              <HasAccess
                  permissions={[CW_SERVICE_PORTAL_UPDATE]}
                  yes={() => (
                    <button type="button" onClick={this.addWorkflow} className="fancy_btn add-workflow-btn">
                      <span className="glyphicon glyphicon-plus" style={{ alignSelf: 'center' }}/>
                      <span className="category_card_text">Associate Workflow</span>
                    </button>
                  )}
              />
            </div>
            <div className="app_showing_card_cont" />
          </div>
          <div className="app_showing_cont">
            <div className="app_showing_head">
              <div>
                <p>
                  Contents
                  <small className="app_showing_changeord_txt">(Move the content side-ways to change the order)</small>
                </p>
              </div>
            </div>
            <div>
              <DragDropContext onDragEnd={this.onDragEnd}>
                <Droppable droppableId="droppable" direction="horizontal">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      style={getListStyle()}
                      {...provided.droppableProps}
                    >
                      {this.state.contentsData.map((item, index) => (
                        <Draggable 
                          index={index}
                          key={item.content.id} 
                          draggableId={item.content.id} 
                        >
                          {(dragProvided) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              style={getItemStyle(
                                dragProvided.draggableProps.style
                              )}
                            >
                              <div className="app_showing_card portal_view_card">
                                <div className="message_heading">
                                  <p>
                                    <span>{item.content.name}</span>
                                    <HasAccess
                                      permissions={[CW_SERVICE_CONTENT_UPDATE]}
                                      yes={() => (
                                        <Link to={`/custom-workflow/org/${this.props.match.params.uuid}/content/edit/${item.content.id}`}>
                                          <span className="icon-edit"/>
                                        </Link>
                                      )}
                                    />
                                  </p>
                                </div>
                                <div className="descrip_view_card">
                                  <p className="category_card_text">{item.content.description}</p>
                                </div>
                                <HasAccess
                                  permissions={[CW_SERVICE_PORTAL_UPDATE]}
                                  yes={() => (
                                    <div className="view_card_btn published_contents_view_card category_card_btn">
                                      <button type="button" onClick={() => this.deleteContent('content_flows', item.order_obj_id)} className="install_app_btn">Disassociate</button>
                                    </div>
                                  )}
                                />
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
              <div className="add_workflow_content_btn">
                <HasAccess
                  permissions={[CW_SERVICE_PORTAL_UPDATE]}
                  yes={() => (
                    <button type="button" onClick={this.addContent} className="fancy_btn add-workflow-btn portal_content_btns">
                      <span className="glyphicon glyphicon-plus" style={{ alignSelf: 'center' }}/>
                      <span className="category_card_text">Associate Content</span>
                    </button>
                  )}
                />
                {
                  this.state.open
                  ? (
                    <HasAccess
                      permissions={[CW_SERVICE_PORTAL_UPDATE]}
                      yes={() => (
                        <button type="button" onClick={this.save} className="fancy_btn add-workflow-btn portal_content_btns">
                          <span className="glyphicon glyphicon-floppy-disk" style={{ alignSelf: 'center' }}/>
                          <span className="category_card_text">Save Order</span>
                        </button>
                      )}
                    />
                  ) : (" ")
                }
              </div>
            </div>
          </div>
        </div>
        </>
      );
    }

    return (
      <div>
        {this.state.isLoading && (<Spinner />)}
        <WorkflowAddAssociate
          message={this.state.message}
          handleContent={this.handleContent}
          handleApps={this.handleApps}
          workflows={this.state.workflows}
          workflowsData={this.state.workflowsData}
          contentsData={this.state.contentsData}
          contents={this.state.contents}
          close={this.Open}
          open={this.state.addWorkflow}
          create={this.create}
          messageContent={this.state.messageContent}
        />
      </div>
    )
  }
}

export default withRouter(Portals);
