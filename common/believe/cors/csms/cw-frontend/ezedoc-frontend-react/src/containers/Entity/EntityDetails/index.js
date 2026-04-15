import React from "react";
import { AdvTable } from "../../../components/UI/AntDesignTable/AdvTable";
import './entityDetails.css'
import { HandleDetailsClick } from "./action";
import { NoData } from "..";
export const EntityDetails = ({ dashboardDetailsData, orgId, uuid,employeeAlias }) => {
    const { columns } = dashboardDetailsData
    const { memberDetails, loading } = HandleDetailsClick(orgId, uuid)
    const modifiedTableFields = columns.map((columns) => {
            switch (columns.key) {
                case "taskOwnerName":
                    return { ...columns, title: (`task owner ${employeeAlias} NAME`).toUpperCase() };
                case "taskOwnerEmpId":
                    return { ...columns, title: (`task owner ${employeeAlias} id`).toUpperCase() };
                default:
                    return columns;
            }
        })
    return(
        loading?<NoData/>:<div className="entityDetails">
            <AdvTable
                loading={false}
                columns={modifiedTableFields}
                dataSource={memberDetails}
                hideOnSinglePage={true}
                tableLayout="fixed"
            />
        </div>
    )
}