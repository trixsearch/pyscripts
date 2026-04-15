import Axios from "axios";
import React, { useEffect, useState } from "react";
import { TASK_STATUS } from "../constants";
const taskStatusResolver = (_data) => {
    const { data } = _data
    if (data.length === 0) {
        return []
    }
    return data.map((member) => {
        const { endTime, claimTime, assignee, group } = member;
        let taskStatus = '';
        if (endTime) {
            taskStatus = TASK_STATUS.COMPLETED;
        } else if (claimTime) {
            taskStatus = TASK_STATUS.CLAIMED_BY_USER;
        } else if (!claimTime && !assignee && group) {
            taskStatus = TASK_STATUS.IN_GROUP;
        } else {
            taskStatus = TASK_STATUS.ONGOING;
        }
        return { ...member, taskStatus };
    });
};
const resolveDate = (value) => {
    const dateAndTime = new Date(value);
    const istOffset = 5.5 * 60 * 60 * 1000;
    const convertedValue = new Date(dateAndTime.getTime() + istOffset);
    const day = String(convertedValue.getDate()).padStart(2, "0");
    const month = String(convertedValue.getMonth() + 1).padStart(2, "0");
    const year = convertedValue.getFullYear();
    let hours = convertedValue.getHours();
    const minutes = String(convertedValue.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const formatted = `${day}/${month}/${year}, ${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
    return formatted
}
export const HandleDetailsClick = (orgId, uuid) => {
    const [memberDetails, setMemberDetails] = useState([])
    const [loading, setLoading] = useState(true)
    const fetchComponentData = async () => {
        const { data } = await Axios.post(`/api/cw/${orgId}/proxy-bpm/process-details/`, { name: uuid })
        const enrichedData = taskStatusResolver(data)
        let taskOwnerName = '-'
        let taskOwnerPhone = '-'
        let taskOwnerEmpId = '-'
        let processKey = '-'
        const allExtractedData = enrichedData.map(async (_employee) => {
            if (_employee.assignee !== null) {
                const { data } = await Axios.get(`/api/identity/org/${orgId}/user/${_employee.assignee}`)
                const response = await Axios.get(`/api/identity/org/${orgId}/user/${data._id}`)
                taskOwnerName = data.firstName || '-'
                taskOwnerPhone = data.mobileNumber || '-'
                taskOwnerEmpId = response.data.employeeId || '-'
            }
            return {
                name: _employee.name || '-',
                group: _employee.group || '-',
                taskStatus: _employee.taskStatus || '-',
                taskOwnerName: taskOwnerName,
                taskOwnerPhone: taskOwnerPhone,
                taskOwnerEmpId: taskOwnerEmpId,
                processKey: _employee.processKey || '-',
                createTime: _employee.createTime === null ? '-' : resolveDate(_employee.createTime),
                endTime: _employee.endTime === null ? '-' : resolveDate(_employee.endTime),
            }

        })
        const allMemberDetails = await Promise.all(allExtractedData)
        setMemberDetails(allMemberDetails)
        setLoading(false)
    }
    useEffect(() => {
        fetchComponentData()
    }, [])
    return { loading, memberDetails }
}