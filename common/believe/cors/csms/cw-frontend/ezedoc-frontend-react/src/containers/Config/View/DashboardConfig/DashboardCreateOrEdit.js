import React,{Component} from 'react'
import axios from "axios";
import { connect } from 'react-redux';
import { getRoles } from 'store/actions';
import { getRegexErrorMessage, parseQueryString, validator } from 'containers/utils';
import FilterDropdown from "../../../../components/UI/FilterDropdown/FilterDropdown";
import AddWidgets from "./AddWidgets"
import ErrorPage from "../../../ErrorPage";

const APP_URL = process.env.REACT_APP_APP_URL;

const defaultGrid = [{
    grid: {
      x: 0, y: 0, w: 6, h: 5, minH: 5, minW: 6, maxH:5
    },
    type: "processCount"
  },
  {
    grid: {
      x: 0, y: 5, w: 2, h: 1, minH: 1, minW: 2, maxH:1
    },
    type: "myTaskCount"
  },
  {
    grid: {
      x: 2, y: 5, w: 2, h: 1, minH: 1, minW: 2, maxH:1
    },
    type: "groupTaskCount"
  }]

class DashboardCreateOrEdit extends Component {
    constructor(props) {
        
        super(props)
        this.state={
            name:"",
            description:"",
            activeRole:"Select a role",
            activeRoleId:"",
            formData:{},
            error:false,
            grid_data:[]
        }
    }

    componentDidMount() {
        let id = this.props.match.params.id
        const orgId = this.props.match?.params?.uuid;
        if(id) {
            axios.get(`${APP_URL}/${orgId}/config/dashboard/${id}`)
                    .then(res => {                 
                        this.setState({               
                            name : res.data.name,
                            description :res.data.description,
                            formData:{'name':res.data.name,'description':res.data.description},
                            activeRole: res.data.role_name,
                            activeRoleId: res.data.role,
                            grid_data: res.data.grid_data
                        })
                    })
                    .catch(() => this.setState({ error: true }))
            
        }else{
            this.setState({
                grid_data: JSON.parse(JSON.stringify(defaultGrid))
            })
        }

        this.props.getRoles(orgId, "Owner")
    }

    handleRoleChange =(id)=>{
        const roleData = this.props.allRoles;
                let activedRoleName = roleData.filter(
                    (item) => item.id === id
                )[0].name;
                this.setState({
                    activeRole: activedRoleName,
                    activeRoleId: id,
         })
    }

    handleChange=(data)=>{
        
        let name = data.target.name
        let value = data.target.value
        this.setState((state)=>{
            let formData = state.formData
            return{
                [name]:value,
                formData:{
                    ...formData,
                    [name]:value
                }
            }
        })
    }

    render() {

        const { next = 1 } = parseQueryString(this.props.location.search);

        const{allRoles}=this.props
        const{
            activeRole, error, formData, activeRoleId, grid_data, name
        } = this.state
        const nameValidator = validator(name)
        
        if(error) { return (<ErrorPage />) }
        return(
            <div>
            <div className="main_changable_container" style={{marginTop:'10px'}}>
            <form action="" className="form_up_box config-dash-form-main-cont">
            <div className="config-dash-form-fields col-md-6">
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
            <div className="config-dash-form-fields col-md-6">
                <input
                    name='description'
                    type='text'
                    min='1'
                    value={this.state.description}
                    onChange={this.handleChange}
                    className='floating-input'
                />
                <label>Description</label>
            </div>
            
            <div className="config_view_dropdown_container" >
                  <div style={{marginTop:"4px"}}>
                  <FilterDropdown
                    list={allRoles}
                    classes='config_view_role_dropdown'
                    selectedItem={activeRole}
                    onItemClickHandler={this.handleRoleChange}
                  />
                  </div>
            </div>
            </form>
            {
                nameValidator
                ? (<div className='error-message-element' style={{color: 'red', fontSize: '14px'}}>{getRegexErrorMessage('name')}</div>)
                : null
            }
            
            <AddWidgets
            formData={formData}
            nameValidator={nameValidator}
            activeRoleId={activeRoleId}
            grid_data={grid_data}
            id={this.props.match.params.id || ""}
            nextPage={next}
            history={this.props.history}
            />
            </div>
            </div>
        )
    }

}
const mapStateToProps = (state) => ({
    allRoles:state.users.roles,
})

const mapDispatchToProps = dispatch => ({
getRoles:(orgId, owner)=> dispatch(getRoles(orgId, owner))
})

export default connect(mapStateToProps, mapDispatchToProps)(DashboardCreateOrEdit);