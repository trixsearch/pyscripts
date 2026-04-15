import { useEffect, useState } from "react";
import Axios from "axios";
export const FetchComponentData = (orgId, filterName, searchKey) => {
    const [responseData, setResponseData] = useState([])
    const [loading, setLoading] = useState(true)
    const modifiedSearchKey =  searchKey.split(',').map((ele) => ele.toUpperCase().trim()).filter((_ele) => _ele !== '') 

    const fetchEmployeeData = async () => {
        if (modifiedSearchKey.length !== 0) {
            try {
                // Fetch all employees data
                setLoading(true)
                const response = await Axios.post(
                    `/api/employee-mgmt/org/${orgId}/employees`,
                    { sieve: { employeeId: modifiedSearchKey } }
                );
                const employees = response.data;

                // mapping employee data for extracting defaultRole and defaultHierarchy
                const dataWithDeaultRoleAndHierarchy = employees.map(async (employee) => {
                    const defaultLocation = new Set();
                    const defaultRole = new Set();
                    if (employee.defaultLocation) {
                        defaultLocation.add(employee.defaultLocation);
                    }
                    if (employee.defaultRole) {
                        defaultRole.add(employee.defaultRole);
                    }
                    const allData = [...defaultLocation, ...defaultRole];
                    let defaultLocationName = '-';
                    let defaultRoleName = '-';
                    if (allData.length > 0) {
                        const { data } = await Axios.post('/api/customer-mgmt/tag', allData);
                        defaultLocationName = data[0]?.name || '-';
                        defaultRoleName = data[1]?.name || '-';
                    }

                    // Extracting the usable data
                    return {
                        uuid: employee.uuid,
                        vendorName: employee?.source_org_name || '-',
                        firstName: employee.firstName || '-',
                        employeeId: employee.employeeId || '-',
                        defaultLocation: defaultLocationName,
                        defaultRole: defaultRoleName,
                        status: employee.status || '-',
                        cardStatus: employee?.approval?.accessCard?.[0]?.status || '-'
                    };
                });
                const modifiedResultData = await Promise.all(dataWithDeaultRoleAndHierarchy);
                setResponseData(modifiedSearchKey.length === 0 ? [] : modifiedResultData);
                setLoading(false);
            } catch (error) {
                console.error(error);
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchEmployeeData()
    }, [searchKey])
    return { responseData, loading }
};