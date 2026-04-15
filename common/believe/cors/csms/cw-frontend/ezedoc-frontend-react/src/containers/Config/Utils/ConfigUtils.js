import React from 'react';
import Axios from "axios";
import { components } from 'react-select';

import { email_test } from '../../Process/ProcessComponents';
import { CANDIDATE_USER } from '../../../Data/constants';

const APP_URL = process.env.REACT_APP_APP_URL;

export const handleLocnSearch = (orgId, inputText) => {
  return new Promise((resolve, reject) => {
    if (inputText.length > 2) {
      Axios.get(`${APP_URL}/${orgId}/locations/?search=${inputText}`)
        .then(response => {
          let options = response.data.data.map(location => ({
            value: location.id,
            label: location.name,
            name: "location"
          }));
          return resolve(options);
        })
        .catch(() => {
          return reject();
        });
    } else {
      reject();
    }
  });
};

export const handleDeptSearch = (orgId, inputText) => {
  return new Promise((resolve, reject) => {
    if (inputText.length > 2) {
      Axios.get(`${APP_URL}/${orgId}/departments/?search=${inputText}`)
        .then(response => {
          let options = response.data.data.map(department => ({
            value: department.id,
            label: department.name,
            name: "department"
          }));
          return resolve(options);
        })
        .catch(() => {
          return reject();
        });
    } else {
      reject();
    }
  });
}

export const handleUserSearch = (orgId, inputText) => {
  return new Promise((resolve, reject) => {
    if (inputText.length > 1) {
      Axios.get(`${APP_URL}/${orgId}/users/org_users?search=${inputText}`)
        .then(response => {
          let options = response.data.data.map(user => ({
            value: user.id,
            label: user.email
          }));
          return resolve(options);
        })
        .catch(() => {
          return reject();
        });
    } else {
      reject();
    }
  });
}

export const handleGroupSearch = (orgId, inputText) => {
  return new Promise((resolve, reject) => {
    if (inputText.length > 1) {
      Axios.get(`${APP_URL}/${orgId}/groups?search=${inputText}`)
        .then(response => {
          let options = response.data.data.map((group) => ({
            value: group.id,
            label: group.name,
            users: group.users
          }));
          return resolve(options);
        })
        .catch(() => {
          return reject();
        });
    } else {
      reject();
    }
  })
}

export const DropdownIndicator = (props) => (
  <components.DropdownIndicator {...props}>
    <span className="glyphicon glyphicon-search" />
  </components.DropdownIndicator>
);

export const handleTaskUsersSearch = (orgId, inputText) => {
  return new Promise((resolve, reject) => {
    if (inputText.length > 2) {
      Axios.get(`${APP_URL}/${orgId}/users/org_users/task_users?search=${inputText}`)
        .then(response => {
          let options = response.data.data.map((user) => ({
            value: user.userId,
            // Talk to vishal to know why below line was modified.
            // label : user.email
            label: email_test(user.email) ? CANDIDATE_USER : user.email,
          }));
          return resolve(options);
        })
        .catch(() => {
          return reject();
        });
    } else {
      reject();
    }
  })
};

export const getTaskUserByUserId = (orgId, userId) => {
  return new Promise((resolve, reject) => {
      Axios.get(`${APP_URL}/${orgId}/users/org_users/task_users?userId=${userId}`)
        .then(response => {
          let datas = response.data.data.map((user) => ({
            userId: user.userId,
            // Talk to vishal to know why below line was modified.
            // label : user.email
            email: email_test(user.email) ? CANDIDATE_USER : user.email,
          }));
          return resolve(datas[0]);
        })
        .catch(() => {
          return resolve({});
        });
  })
};

export const handleRoleSearch = (orgId, inputText) => {
  return new Promise((resolve, reject) => {
    if (inputText.length > 1) {
      Axios.get(`${APP_URL}/${orgId}/permissions/org_roles?search=${inputText}`)
        .then(response => {
          let options = response.data.data.map(role => ({
            value: role.id,
            label: role.name
          }));
          return resolve(options);
        })
        .catch(() => {
          return reject();
        });
    } else {
      reject();
    }
  });
}

export const handlePartnerSearch = (orgId, inputText) => {
  return new Promise((resolve, reject) => {
    if (inputText.length > 2) {
      Axios.get(`${APP_URL}/${orgId}/jobs/partner?search=${inputText}`)
        .then(response => {
          let options = response.data.data.map(partner => ({
            value: partner.id,
            label: partner.name,
            name: "partner"
          }));
          return resolve(options);
        })
        .catch(() => {
          return reject();
        });
    } else {
      reject();
    }
  });
};