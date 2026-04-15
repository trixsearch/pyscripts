import React from 'react'
// import { useParams } from 'react-router-dom'
// import { connect } from 'react-redux'

// import { useQueryParams } from 'CustomHooks/usePagination'

import '../css/user.css'

const UserActivity = () => {
    // const { page = 1 } = useQueryParams()
    // const { uuid: orgId } = useParams();

    return (
        <ul className='process_tab_ongoing_comp_ul' id='myTab' role='tablist'>
            <li className='process_tab_last_li'>
                <div className='process_details_btn_cont'>
                    <div style={{ display: 'flex' }} className='user-buttons-container'>
                        {/* {props.show ? (
                            <FilterDropdown
                                show={false}
                                list={props.filterOptions}
                                selectedItem={props.filter.name}
                                classes='user-list-filter-dropdown'
                                onItemClickHandler={props.handleFilterChange}
                            />
                        ) : null
                        } */}
                        {/* {props.user_data.length > 0 ? (
                            <button
                                type='button'
                                onClick={props.sendActivationLink}
                                className='process_fancy_btn fancy_btn'
                            >
                                Send Activation Link
                            </button>
                        )
                            : null
                        } */}
                        {/* {props.addPermission
                            ? (
                                <Fragment>
                                    <DropDownButton
                                        handleClick={props.onImportUsers}
                                        defaultButtonName='Import'
                                        defaultButtonCondition
                                    >
                                        <li style={{ padding: '2px 0' }}>
                                            <NavLink to={`/custom-workflow/org/${orgId}/config/users/import-history`}>
                                                History
                                            </NavLink>
                                        </li>
                                    </DropDownButton>

                                    <NavLink to={routes.USER_CREATE.to(orgId, page)}>
                                        <button
                                            type='button'
                                            className='process_fancy_btn fancy_btn active'
                                        >
                                            Add User
                                        </button>
                                    </NavLink>
                                </Fragment>
                            )
                            : null
                        } */}
                    </div>
                </div>
            </li>
        </ul>
    )
}

// const mapStateToProps = ({ auth }) => ({
//     addPermission: auth.uiPermissions.organisationuser.add
// })

export default UserActivity
