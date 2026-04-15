import ReactTooltip from 'react-tooltip';
import {isMobile} from '../utils'
import {email_test} from "./ProcessComponents"
import React from 'react';
import {CANDIDATE_USER} from "../../../src/Data/constants"

export const GroupUsers = (props) => {
    const { id } = props;
  
    const users = [ ...props.users]


    return (
        <>
            {users.length > 1 ? (
                <div style={{display: 'flex'}}>
                    <p data-tip data-for={props.showTooltip? id : null} className="email-text">
                        {email_test(users[0].email) ? CANDIDATE_USER : (users[0].email || '-') }
                    </p>
                    {props.showTooltip ? (
                        <div>
                            {!isMobile() ? (
                                <ReactTooltip id={id} place='bottom' delayShow={100} aria-haspopup='true' className="app_btn_bg_color tooltip-text">
                                {email_test(users[0].email) ? CANDIDATE_USER : (users[0].email || '-') }
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
                            +{users.length-1}
                        </p>
                        {!isMobile() ? (
                            <ReactTooltip id={`users_list${id}`} place='bottom' event='click' globalEventOff='click' aria-haspopup='true' className="app_btn_bg_color tooltip-text">
                                {users.shift() && users.map((user,index) => (<p key={index+user['id']}>
                                 {email_test(user.email) ? CANDIDATE_USER : (user.email || '-')} 
                                </p>))}
                            </ReactTooltip>
                        ) : null}
                    </div>
                </div>
                ) : (
                <div>
                    <p data-tip data-for={id} className="email-text">  {users && users.length && email_test(users[0].email) ? CANDIDATE_USER : (users[0].email || '-')}</p>
                    {props.showTooltip ? (
                        <div>
                            {!isMobile() ? (
                                <ReactTooltip id={id} place='bottom' delayShow={100} aria-haspopup='true' className="app_btn_bg_color tooltip-text">
                                {users && users.length && email_test(users[0].email) ? CANDIDATE_USER : (users[0].email || '-')}
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