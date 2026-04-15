import React, { useEffect, useState } from "react"
import { entity, dashboardDetailsData } from "./entity"
import { EntityFilter } from "./EntityFilter/entityFilter"
import { AdvTable } from "../../components/UI/AntDesignTable/AdvTable"
import { EntityDetails } from "./EntityDetails"
import { Drawer } from "antd"
import './entityDashboard.css'
import Cloud from "assets/images/no_records.png";
import { FetchComponentData } from "./action"
import { usePlatformDataStoreSelector } from "../../platformDataStoreContext"

export const NoData = () => {
    return (
        <div className="noData">
            <img src={Cloud} alt="no-data" />
            <div className="text">No data available</div>
        </div>
    )
}

const Entity = (props) => {
    const orgId = props.match?.params?.uuid
    const [filterName, setFilterName] = useState(null)
    const [searchKey, setSearchKey] = useState('')
    const { responseData, loading } = FetchComponentData(orgId, filterName, searchKey)
    const [filteredData, setFilteredData] = useState([])
    const [showDrawer, setShowDrawer] = useState(false)
    const [memberDetails, setMemberDetails] = useState({})
    const handleSearch = () => {
        const result = responseData.filter((_data) => {
            return _data.firstName.toLowerCase().includes(searchKey.toLowerCase())
        })
        setFilteredData(result)
    }
    useEffect(() => {
        setFilteredData(responseData)
    }, [responseData])
    const useOrgDataSelector = usePlatformDataStoreSelector(
        (state) => state?.orgMgmt?.orgProfile?.data,
    );
    const employeeAlias = useOrgDataSelector?.employeeAlias?.singular
    const modifiedTableFields = entity.structure.tableConfig.columns.map((columns) => {
        switch (columns.key) {
            case "firstName":
                return { ...columns, title: (`${employeeAlias} NAME`).toUpperCase() };
            case "status":
                return { ...columns, title: (`${employeeAlias} STATUS`).toUpperCase() };
            case "employeeId":
                return { ...columns, title: (`${employeeAlias} ID`).toUpperCase() };
            case 'defaultRole':
                if (useOrgDataSelector?.legalName.toUpperCase()=== 'CWMS-O') {
                    return { ...columns, title: 'TRADE' };
                } else {
                    return columns
                }
            case 'defaultLocation':
                if (useOrgDataSelector?.legalName.toUpperCase()=== 'CWMS-O') {
                    return { ...columns, title: ' AREA OF MOVEMENT' };
                } else {
                    return columns
                }
            default:
                return columns;
        }
    })
    const _columns = [...modifiedTableFields, {
        title: 'ACTION',
        dataIndex: 'action',
        key: 'action',
        width: '96px',
        render: (_, details) => <button type="button" style={{ cursor: 'pointer' }} onClick={() => { setShowDrawer(true); setMemberDetails(details) }}
            className="action">Details</button>
    }]

    return (
        <div>
            <EntityFilter
                handleSearch={handleSearch}
                setFilteredData={setFilteredData}
                data={responseData}
                setFilterName={setFilterName}
                filterName={filterName}
                setSearchKey={setSearchKey}
                searchKey={searchKey}
                employeeAlias={employeeAlias}
            />
            {searchKey ? <AdvTable
                loading={loading}
                columns={_columns}
                dataSource={filteredData}
                rowClassName='entity-dashboard'
                tableLayout="fixed"
            /> : <NoData />}
            {showDrawer && <Drawer className={'drawer-custom'}
                width={1000}
                title={<div className="dashboardHeading">
                    <div className="title">{memberDetails?.firstName}</div>
                    {memberDetails?.employeeId !== '-' && <div className="subtitle">{memberDetails?.employeeId}</div>}
                </div>}
                placement='right'
                visible={true}
                onClose={() => setShowDrawer(false)}
                headerStyle={{ fontSize: '20px' }}
                footer={<button className="dashboardAction" onClick={() => setShowDrawer(false)}>Close</button>}
            >
                <EntityDetails
                    dashboardDetailsData={dashboardDetailsData}
                    orgId={orgId}
                    uuid={memberDetails.uuid}
                    employeeAlias={employeeAlias}
                />
            </Drawer>}
        </div>
    )
}
export default Entity