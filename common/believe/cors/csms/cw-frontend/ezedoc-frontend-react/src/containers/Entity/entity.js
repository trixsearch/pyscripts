export const entity = {
  "structure": {
    "headerConfig": {
      "searchBar": {
        "type": "text",
        "placeholder": "Search"
      },
      "filter": {
        "type": "button",
        "title": "Filter"
      }
    },
    "tableConfig": {
      "columns": [
        {
          "dataIndex": "firstName",
          "key": "firstName",
          "title": "EMPLOYEE NAME",
        },
        {
          "dataIndex": "employeeId",
          "key": "employeeId",
          "title": "EMPLOYEE ID",
        },
        {
          "dataIndex": "vendorName",
          "key": "vendorName",
          "title": "VENDOR NAME",
        },
        {
          "dataIndex": "status",
          "key": "status",
          "title": "EMPLOYEE STATUS",
        },
        {
          "dataIndex": "cardStatus",
          "key": "cardStatus",
          "title": "CARD STATUS",
        },
        {
          "dataIndex": "defaultRole",
          "key": "defaultRole",
          "title": "ROLE",
        },
        {
          "dataIndex": "defaultLocation",
          "key": "defaultLocation",
          "title": "LOCATION",
          "width": "160px",
        }
      ]
    }
  }
}
export const dashboardDetailsData = {
  "columns": [
    {
      "dataIndex": "name",
      "key": "name",
      "title": "TASK NAME",
      "width":"147px"
    },
    {
      "dataIndex": "group",
      "key": "group",
      "title": "GROUP NAME",
       "width":"147px"
    },
    {
      "dataIndex": "processKey",
      "key": "processKey",
      "title": "PROCESS NAME",
       "width":"147px"
    },
    {
      "dataIndex": "taskStatus",
      "key": "taskStatus",
      "title": "TASK STATUS",
      "width":"147px"
    },
    {
      "dataIndex": "taskOwnerName",
      "key": "taskOwnerName",
      "title": "TASK OWNER NAME",
      "width":"193px"
    },
    {
      "dataIndex": "taskOwnerEmpId",
      "key": "taskOwnerEmpId",
      "title": "TASK OWNER EMPLOYEE ID",
      "width":"193px"
    },
    {
      "dataIndex": "taskOwnerPhone",
      "key": "taskOwnerPhone",
      "title": "TASK OWNER PHONE",
      "width":"156px"
    },
    {
      "dataIndex": "createTime",
      "key": "createTime",
      "title": "START TIME",
      "width":"156px"
    },
    {
      "dataIndex": "endTime",
      "key": "endTime",
      "title": "END TIME",
      "width":"156px"
    }
  ]
}
export const filters = [
  {
    name: "Employee ID",
    id: "employeeId"
  }
]