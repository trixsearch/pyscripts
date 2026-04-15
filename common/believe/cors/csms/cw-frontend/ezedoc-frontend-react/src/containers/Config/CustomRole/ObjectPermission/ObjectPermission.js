import React, { Component } from 'react';
import {connect} from 'react-redux';
import Axios from 'axios';
import { withRouter } from 'react-router-dom';

import Spinner from '../../../../components/UI/Spinner/Spinner'
import * as constants from '../../../../Data/constants';
import { Button } from '../../../../components/UI/AppButton/AppButton';
import DynamicTable from '../../../../components/UI/DynamicTable/DynamicTable';
import { addToast } from '../../../../components/Toast/actions';

import '../CustomRole.css';

const APP_URL = process.env.REACT_APP_APP_URL;
const FULL_SELECTION = '#74f1adc7';
const PARTIAL_SELECTION = '#f3a668c7';
const NO_SELECTION = '#f35e4ec7';

const PermissionsHeaderDatas = [
    {
        label: 'Name & Description',
        classes: 'col-xs-7'
    },
    {
        label: 'Permissions',
        classes: 'col-xs-5'
    }
]

const RolesPermissionRow = ({ 
    name,
    rowData,
    description,
    handleCheckbox,
    permDescription,
    checkboxDisabled,
    permissionPercentage,
}) => {
    let color = NO_SELECTION;
    if(permissionPercentage === 100) {
        color = FULL_SELECTION;
    } else if(permissionPercentage < 100 && permissionPercentage > 0) {
        color = PARTIAL_SELECTION;
    } else if(permissionPercentage === 0) {
        color = NO_SELECTION;
    }

    return (
        <tr className="rolesPermissionRows">
            <td className="col-xs-7 permissionDetailsCol">
                <span className="rolePermissionLevel" style={{background: color}} />
                <div className="permissionDetails">
                    <div className="permission_name"><strong>{name && permDescription[name] ? permDescription[name][0] : ''}</strong></div>
                    <div className="permission_description">{description || ''}</div>
                </div>
            </td>
            <td className="col-xs-5 permissions_checkboxes">
                {
                    Object.keys(rowData).map(data => (
                        <PermissionSubList 
                            key={data}
                            value={data}
                            name={rowData[data]}
                            activePermName={name}
                            changed={handleCheckbox}
                            disabled={checkboxDisabled}
                            permDescription={permDescription}
                        />
                    ))
                }
            </td>
        </tr>
    )
}

const PermissionSubList = ({
    value, name, changed, disabled, activePermName, permDescription 
}) => {
    return(
        <div>
            <li>
                <input 
                    type='checkbox' 
                    id={value} 
                    disabled={disabled}
                    checked={name[1]} 
                    onChange={(e)=>changed(e,value)} 
                />
                {permDescription[activePermName]?(name[0].split(' ')).slice(1,2).join(' '): name[0]}
            </li>
        </div>
    )
}

class ObjectPermission extends Component {

    state = {
        loader: true,
        permissionList: {},
        modifiedList: null,
        permissionKeys:[],
        submitDisabled: true,
        permissionKeysDuplicate: [],
    }

    componentDidMount() {
        const isSystemRole = constants.SYSTEM_ROLES.includes(this.props.activeRole.name);
        let permList = {};
        // we are initially setting all permission to false  
        this.props.allPermissions.map(item=>{
            const name = item.codename.split('_')[1];
            let newPerm = {...permList[name]}
            newPerm[item.id] = [item.name, false]
            permList[name] = newPerm;
            return null;
        });
        const permkeys = [];
        // we iterate through the selected role permission and make them true
        this.props.activeRole.permissions.map((item)=>{         
            const name = item.codename.split('_')[1];
            if(Object.keys(permList).includes(name)) {
                permList[name][item.id][1] = true;
                permkeys.push(String(item.id))
            }            
            return null;
        });

        
        this.setState({
            permissionList: permList,
            permissionKeys: [...permkeys],
            permissionKeysDuplicate: [...permkeys],
            loader: false,
            id: this.props.activeRole.id,
            isSystemRole: isSystemRole,
        }, () => {
            this.creatingModifiedList(true);
        })
    }

    creatingModifiedList = (doSort) => {
        const { permissionList } = this.state;
        if(permissionList !== {}) {
            let modifiedList = Object.values(permissionList)
                            && Array.isArray(Object.values(permissionList))
                            && Object.values(permissionList).map((data, index) => ([
                                Object.keys(permissionList)[index],
                                (Object.values(data).filter(i => i[1] === true).length / Object.values(data).length) * 100
                            ]))
            
            
            this.setState({
                modifiedList
            }, () => {
                this.modifyPermissionList();
                if(doSort) {
                    this.getSortableList();
                }
            })
        }
    }

    getSortableList = () => {
        let {modifiedList} = this.state;

        if(
            modifiedList
            && Array.isArray(modifiedList)
        ) {
            modifiedList.sort((a, b) => b[1] - a[1]) // It sorts decendingly the complete object according to percentage value
            
            this.setState({
                modifiedList
            }, () => {
                this.modifyPermissionList();
            })
        }
    }

    modifyPermissionList = () => {
        const {
            modifiedList, 
            permissionList
        } = this.state;

        let modifiedPermissionList = {};

        // eslint-disable-next-line no-unused-expressions
        Object.keys(permissionList)
            && Array.isArray(Object.keys(permissionList))
            && modifiedList
            && Array.isArray(modifiedList)
            && modifiedList.map(data => {
                for(let i = 0; i < Object.keys(permissionList).length; i+=1) {
                    if(Object.keys(permissionList)[i] === data[0]) {
                        modifiedPermissionList[Object.keys(permissionList)[i]] = Object.values(permissionList)[i];
                    }
                }
                return null;
            })

        this.setState({
            permissionList: modifiedPermissionList
        })
    }

    handleSubmit = (id) => {
        let {permissionKeys} = this.state;
        this.setState({
            loader: true,
            permissionKeysDuplicate: [...permissionKeys]
        });
        permissionKeys = permissionKeys.map(item=>Number(item))
        Axios.put(`${APP_URL}/${this.props.match?.params?.uuid}/permissions/org_roles/${id}`, { permissions: permissionKeys }).then(res => {
            this.props.addToast('success', 'Success', res.data.message)
            this.getSortableList();
        }).catch(error=>{
            this.props.addToast('error', 'Error', error.response.data.message)
        }).finally(()=>{
            this.setState({loader: false, submitDisabled: true});
        })
    }

    handleCheckbox = (e, id) => {
        let {permissionList, permissionKeys, permissionKeysDuplicate} = this.state;
        if (e.target.checked) {
            permissionKeys.push(id);
        }else{
            permissionKeys = permissionKeys.filter(item=>item!==id)
        }
        
        Object.keys(permissionList).map((item)=>{
            if (permissionList[item][id]) {
                permissionList[item][id][1] = !permissionList[item][id][1]
            }
            return item;
        });
        this.setState({
            permissionList: permissionList,
            permissionKeys: permissionKeys,
            submitDisabled: JSON.stringify(permissionKeys) === JSON.stringify(permissionKeysDuplicate)
        }, () => {
            this.creatingModifiedList(false);
        });
    }

    render() {
        const {
            id, 
            loader, 
            isSystemRole,
            modifiedList,
            permissionList, 
            submitDisabled,
        } = this.state
        const { permDescription, rolePermission } = this.props;

        let checkboxDisabled = false;
        if (!rolePermission.change || isSystemRole) { checkboxDisabled = true; }

        return (
            <div className="objectPermissionPage">
                {loader && <Spinner />}

                <DynamicTable
                    isLoading={loader}
                    paginationCount={11}
                    table_header_datas={PermissionsHeaderDatas}
                    table_body_classes='permissions_list_container'
                    table_extra_classes='table_container table_cont_edit_delete_list roles_permissions_table'
                >
                    {
                        Object.values(permissionList)
                        && Array.isArray(Object.values(permissionList))
                        && Object.values(permissionList).map((data, index) => {
                            let description = '';
                            if(
                                permDescription[Object.keys(permissionList)[index]] 
                                && permDescription[Object.keys(permissionList)[index]].length > 1
                            ) {
                                description = `User with these permissions ${permDescription[Object.keys(permissionList)[index]][1]}.`
                            }
                            return (
                                <RolesPermissionRow
                                    rowData={data}
                                    description={description}
                                    permDescription={permDescription}
                                    key={`PermissionRow_${index + 1}`}
                                    checkboxDisabled={checkboxDisabled}
                                    handleCheckbox={this.handleCheckbox}
                                    name={Object.keys(permissionList)[index]}
                                    permissionPercentage={modifiedList ? modifiedList[index][1] : 0}
                                />
                            )
                        })
                    }
                </DynamicTable>

                <div className="role_permission_save_button_container">
                    {rolePermission.change && !isSystemRole && (
                        <Button
                            variant="primary"
                            onClick={()=>this.handleSubmit(id)}
                            disabled={submitDisabled}
                        >
                            Save
                        </Button>
                        )}
                </div>
            </div>
            )
    }
}

const mapStateToProps = (state) => ({
    rolePermission: state.auth.uiPermissions.group,
});

const mapDispatchToProps = dispatch => ({
    addToast: (type, title, message, duration) => dispatch(addToast(type, title, message, duration))
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(ObjectPermission));