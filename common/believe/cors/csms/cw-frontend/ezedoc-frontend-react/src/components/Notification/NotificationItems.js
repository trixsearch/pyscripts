import React from 'react'

export const NotfnCard = ({
    navigate, message, time, workflowName, id, url, taskName, groupId, notificationText, taskId
  }) => {
    const navigateCard = () => {
      navigate(id, url, groupId, taskId);
    };
    return (
      <li
        role="presentation"
        key={id}
        className="notfn-unread"
        onClick={navigateCard}
      >
        <div className="notfn-card">
          <div className="notfn-container">
            <p className="notfn-text">{message}</p>
            <p className="notfn-desc">{taskName || workflowName || notificationText}</p>
          </div>
          <p className="notfn-time">{time}</p>
        </div>
      </li>
    );
  };
  
export const ZeroNotifications = () => (
    <li className="notfn-card">
      <div className="no-notfn-container">
        <p className="no-notfn-text">No Notifications</p>
      </div>
    </li>
  );
