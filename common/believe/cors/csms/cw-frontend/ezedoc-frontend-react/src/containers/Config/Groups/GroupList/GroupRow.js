import React from 'react';
import ReactTooltip from 'react-tooltip';
import {isMobile} from '../../../utils'

export const GroupUsers = (props) => {
    const { users, id } = props;

    return (
        <>
            {users.length > 1 ? (
                <div style={{display: 'flex'}}>
                    <p data-tip data-for={props.showTooltip? id : null} className="user-email-text">{users[0].email}</p>
                    {props.showTooltip ? (
                        <div>
                            {!isMobile() ? (
                                <ReactTooltip id={id} place='bottom' delayShow={100} aria-haspopup='true' className="app_btn_bg_color tooltip-text">
                                    {users[0].email}
                                </ReactTooltip>
                            ) : null}
                        </div>
                        ) : (<div/>)
                    }
                    <div data-tip data-for={`users_list${id}`} style={{ marginLeft: 4, cursor: 'pointer' }}>
                        <p 
                            style={{
                                backgroundColor: 'lightgray',
                                padding: '0px 4px', 
                                borderRadius: '4px',
                            }}
                        > 
                            +
                            {users.length-1}
                        </p>
                        {!isMobile() ? (
                            <ReactTooltip id={`users_list${id}`} place='bottom' event='click' globalEventOff='click' aria-haspopup='true' className="app_btn_bg_color tooltip-text">
                                {users.shift() && users.map((user) => (<p key={user.id}>{user.email}</p>))}
                            </ReactTooltip>
                        ) : null}
                    </div>
                </div>
                ) : (
                <div>
                    <p data-tip data-for={props.showTooltip? id : null} className="user-email-text">{users && users.length && users[0].email}</p>
                    {props.showTooltip ? (
                        <div>
                            {!isMobile() ? (
                                <ReactTooltip id={id} place='bottom' delayShow={100} aria-haspopup='true' className="app_btn_bg_color tooltip-text">
                                {users && users.length && users[0].email}
                                </ReactTooltip>
                            ) : null}
                        </div>
                        ) : (<div/>)
                    }
                </div>
                )
            }
        </>
    )
}

export default GroupUsers
