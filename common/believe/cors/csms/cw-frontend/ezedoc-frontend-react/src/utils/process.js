import Axios from "axios";

const APP_URL = process.env.REACT_APP_APP_URL;

export const getTenantClientVendorTenantId = (allPermission, permission, orgId) => {
    let promiseArr = [];
    if(allPermission?.[permission]?.[orgId]?.associatedOrgs?.length){
        const callApi = (id) => Axios.get(`${APP_URL}/organisations/${id}`);
        allPermission?.[permission]?.[orgId]?.associatedOrgs?.forEach(data => {
            promiseArr.push(callApi(data?.sourceOrg))
        });
    }

    return Promise.all(promiseArr).then((resArr) => {
        return resArr?.map((res) => {
            return {
                id: res?.data?.data?.id,
                name: res?.data?.data?.name,
            }
        });
    })
}