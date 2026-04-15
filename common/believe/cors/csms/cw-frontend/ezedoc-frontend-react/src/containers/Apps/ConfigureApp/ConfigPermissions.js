import React, { Component, useEffect, useState } from 'react';
import { connect } from 'react-redux';

import axios from 'axios';
import ConfigureAdd from './ConfigAdd';
import ConfigureUser from './ConfigureUser';
import '../../Tasks/task.css';
import Spinner from '../../../components/UI/Spinner/Spinner';
import EzedoxPagination from '../../../components/UI/Pagination/Pagination';
import { addToast } from '../../../components/Toast/actions';

const PermittedUsers = (props) => {

    const [loader, setLoader] = useState(false);
    const [users, setUsers] = useState({
        pageNumber: 1,
        active: 1,
        total: 1,
        data: []
    });

    const handlePageChange = (pageNumber) => {
        setUsers({...users, pageNumber })
    }

    const { addToaster } = props;

    useEffect(() => {
        setLoader(true)
        let url = `/api/permissions/org_users?app=${props.id}&page=${users.pageNumber}`;
        if (props.query) {
            url = `/api/permissions/org_users?app=${props.id}&search=${props.query}&page=${users.pageNumber}`
        }
        axios.get(url)
            .then((res) => {
                setUsers({
                    data: res.data.data,
                    active: users.pageNumber,
                    pageNumber: users.pageNumber,
                    total: res.data.pagination_data.total_count
                })
            })
            .catch(() => {
                addToaster('error', 'Error', 'Something went wrong, please try after sometime.')
             })
            .finally(() => {
                setLoader(false)
            })
    }, [props.id, users.pageNumber, props.query, addToaster])

    return (
        <div>
            {loader && (<Spinner />)}
            {users.data.map((user) => (
                <ConfigureUser
                    identity="user"
                    key={user.id}
                    name={`${user.user.first_name} ${user.user.last_name}`}
                    email={user.user.email}
                    id={user.id}
                    data={user}
                    click={props.handleCheck}
                    permission={user.workflow_permissions}
                />
            ))}
            <EzedoxPagination
                active={users.active}
                taskCount={users.total}
                handlePageChange={handlePageChange}
                itemsCountPerPage={10}
            />
        </div>
    )

}

const PermittedGroups = (props) => {

    const [loader , setLoader] = useState(false)
    const [groups, setGroups] = useState({
        pageNumber: 1,
        active: 1,
        total: 1,
        data: []
    });

    const handlePageChange = (pageNumber) => {
        setGroups({...groups, pageNumber })
    }

    const { addToaster } = props;

    useEffect(() => {
      setLoader(true);
      let url = `/api/permissions/org_groups?app=${props.id}&page=${groups.pageNumber}`;
      if (props.query) {
        url = `/api/permissions/org_groups?app=${props.id}&page=${groups.pageNumber}&search=${props.query}`;
      }
      axios
        .get(url)
        .then(res => {
          setGroups({
            data: res.data.data,
            active: groups.pageNumber,
            pageNumber: groups.pageNumber,
            total: res.data.pagination_data.total_count
          });
        })
        .catch(() => {
            addToaster('error', 'Error', 'Something went wrong, please try after sometime.')
        }).finally(() => {
            setLoader(false)
        })
    }, [props.query, props.id, groups.pageNumber, addToaster]);


    return (
        <div>
            {loader && (<Spinner />)}
            {groups.data.map((group) => (
                <ConfigureUser
                    identity="group"
                    key={group.id}
                    name={group.group.name}
                    id={group.id}
                    data={group}
                    click={props.handleCheck}
                    permission={group.workflow_permissions}
                />
            ))}
            <EzedoxPagination
                active={groups.active}
                taskCount={groups.total}
                handlePageChange={handlePageChange}
                itemsCountPerPage={10}
            />
        </div>
    )
}

const SearchBar = (props) => {

    const [searchText, setText] = useState(props.query || "")

    const handleChange = (event) => {
        setText(event.target.value)
    }

    const handleSubmit = (event) => {
        event.preventDefault();
        props.handleSearch(searchText)
    }

    const handleReset = () => {
        props.handleSearch("")
        setText("");
    }

    useEffect(() => {
        return () => {
            setText("")
        }
    }, [props.type])

    return (
        <div>
            <div className="search_input" style={{ width: 500, marginLeft: 32 }}>
                <form
                    className="form-inline mt-2 mt-md-0 mr-auto input_search_form_cont"
                    onSubmit={handleSubmit}
                    style={{ border: '1px solid #cccccc', borderRadius: 4 }}
                >
                    <span className="input_search_cont">
                        <span className="icon-search" style={{ color: "#999999" }} />
                        <span className="input_search_span">
                            <input
                                style={{ height: 30 }}
                                className="form-control mr-sm-2"
                                type="text"
                                placeholder={`Search for ${props.type} `}
                                aria-label="Search"
                                value={searchText}
                                onChange={handleChange}
                            />
                        </span>
                        <span style={{ color: "#999999", fontSize: "10px" }} onClick={handleReset} role="presentation">
                            {(searchText.length > 3) && <i className="icon-close" />}
                        </span>
                    </span>
                </form>
            </div>
            {!!searchText.length && (
                <div style={{ textAlign: 'center' }}>
                    <span>Search results</span>
                    <button
                        type="button"
                        style={{
                            border: 'none',
                            backgroundColor: 'transparent'
                        }}
                        onClick={handleReset}
                    >
                        <span className="icon-close" style={{ fontSize: 9 }} />
                    </button>
                </div>
            )}
        </div>
    )
}


class ConfigPermissions extends Component {
    constructor(props) {
        super(props);
        this.state = {
            users: true,
            groups: false,
            searchText: ""
        }
    }

    handleTabNav = () => {
        this.setState(prevState => ({
            users: !prevState.users,
            groups: !prevState.groups,
            searchText: ""
        }))
    }

    handleUpdate = () => {
        this.setState({
            users: true,
            groups: false,
            searchText: ""
        })
    }

    handleSearch = (searchText) => {
        this.setState({
            searchText
        })
    }

    render() {
        const { users, groups, searchText } = this.state;
        const { id, groupPermission, userPermission } = this.props;
        return (
            <div>
                {(this.props.groupPermission.view || this.props.userPermission.view) && (
                    <div className="app_showing_cont">
                        <div className="app_showing_head admin_sser_group">
                            <p>Permissions</p>
                            <div className="task-navbar" style={{ marginLeft: 8 }}>
                                <ul className="nav nav-tabs process_tab_ongoing_comp_ul task-navItem" role="tablist">
                                    <li className={users ? "nav-item active" : "nav-item"}>
                                        <button
                                            onClick={this.handleTabNav}
                                            type="button"
                                            className="nav-button"
                                            style={{ cursor: "pointer" }}
                                        >
                                            Users
                                        </button>
                                    </li>
                                    <li className={groups ? "nav-item active" : "nav-item"} style={{ marginRight: 0 }}>
                                        <button
                                            onClick={this.handleTabNav}
                                            type="button"
                                            className="nav-button"
                                            style={{ cursor: "pointer" }}
                                        >
                                            Groups
                                        </button>
                                    </li>
                                </ul>
                            </div>
                            <SearchBar type={users ? "users" : "groups"} query={searchText} handleSearch={this.handleSearch} />
                            {(this.props.userPermission || this.props.groupPermission) && (
                                <ConfigureAdd id={id} update={this.handleUpdate} />
                            )}
                        </div>
                        <div className="edit_app_detils_form_cont">
                            <div className="checkbox_container">
                                <div className="row_box">
                                    <div className="col_box edit_checkbox_heding">
                                        {users ? "User " : "Group "}
                                    </div>
                                    <div className="col_box edit_checkbox_heding">View</div>
                                    <div className="col_box edit_checkbox_heding">Reassign</div>
                                    <div className="col_box edit_checkbox_heding">Withdraw</div>
                                    <div className="col_box edit_checkbox_heding">Bulk Email</div>
                                    <div className="col_box edit_checkbox_heding">Initiate</div>
                                    <div className="col_box edit_checkbox_heding">View Report</div>
                                    <div className="col_box edit_checkbox_heding">Upload</div>
                                    <div className="col_box edit_checkbox_heding" style={{textAlign: 'center'}}>
                                        Download Report
                                    </div>
                                    <div className="col_box edit_checkbox_heding">Action</div>
                                </div>
                                {(users && userPermission.view) && (<PermittedUsers id={id} query={searchText} addToaster={this.props.addToaster} />)}
                                {(groups && groupPermission.view) && (<PermittedGroups id={id} query={searchText} addToaster={this.props.addToaster} />)}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    }
}

const mapStateToProps = (state) => ({
    groupPermission: state.auth.uiPermissions.organisationgroupsapppermissions,
    userPermission: state.auth.uiPermissions.organisationusersapppermissions,
})

const mapDispatchToProps = dispatch => ({
    addToaster: (type, title, message, duration) => dispatch(addToast(type, title, message, duration))
})

export default connect(mapStateToProps, mapDispatchToProps)(ConfigPermissions);
