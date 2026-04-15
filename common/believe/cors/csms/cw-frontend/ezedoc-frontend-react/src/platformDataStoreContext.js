import React, {
  createContext, useContext, useState, useEffect, useMemo
} from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from "react-redux";
import { forEach, get, isEmpty } from 'lodash';
import { getClientVendorRelationLoading, getClientVendorRelation } from '../src/store/actions/AccessMgmt/accessMgmt'

const PlatformDataStoreContext = createContext(null);

export default PlatformDataStoreContext;

// hooks
export const usePlatformDataStoreContext = () => useContext(PlatformDataStoreContext);

export const usePlatformDataStoreSelector = (selectorFn) => {
  const [state, setState] = useState(null);
  const platformDataStore = useContext(PlatformDataStoreContext);
  useEffect(() => {
    if (!platformDataStore) return;
    const handleChange = () => {
      const currentState = selectorFn(platformDataStore.getState());
      if (state !== currentState) setState(currentState);
    };
    handleChange();
    return platformDataStore.subscribe(handleChange); // eslint-disable-line consistent-return
  }, [platformDataStore]);
  return state;
};

export const isVendor = () => {
  const { uuid } = useParams();
  let user = usePlatformDataStoreSelector(
    (state) => state?.auth?.user,
  )
  return user?.orgId!==uuid;
}

export const usePlatformUserSelector = () => usePlatformDataStoreSelector(
  (state) => state?.auth?.user,
);

export const usePermissionsSelector = () => usePlatformDataStoreSelector(
  (state) => state?.auth?.permissions,
);

export const useOrgDataSelector = () => usePlatformDataStoreSelector(
  (state) => state?.orgMgmt?.staticData?.orgData,
);

export const checkPermission = async ({
  rState, permissions, orgId, dispatch
}) => {
  const userPermissions = get(rState, 'auth.permissions', {});
  const baseOrgId = get(rState, 'auth.user.orgId')
  const clientVendorRelation = get(rState, 'orgMgmt.orgProfile.clientVendorRelation')
  const clientVendorRelationState = get(rState, 'orgMgmt.orgProfile.clientVendorRelationState')
  // if (skipHasAccess === true) return true; // use this prop to skip HasAccess validations

  let allowAccess = false;
  // Check for the tag BP_EMPLOYEE, this checks for the email id to have @betterplace.co.in in the email id
  if (permissions?.includes('BP_EMPLOYEE')) {
    allowAccess = rState?.auth?.user?.email?.includes('@betterplace.co.in');
  } 
  // else if (denySuperAdminAccess && !isEmpty(userPermissions['*'])) {
  //   allowAccess = false;
  // } 
  else if (!isEmpty(userPermissions['*'])) {
    allowAccess = true;
  } else if (orgId) {
    forEach(permissions, (permissionToBeChecked) => {
      if (!isEmpty(userPermissions[permissionToBeChecked])
        && !isEmpty(userPermissions[permissionToBeChecked][orgId])) {
        allowAccess = true;
        return false;
      }
    });
    let _clientVendorRelation = clientVendorRelation;
    if(!allowAccess){
      let allVendors = false;
      
      forEach(permissions, (permissionToBeChecked) => {
        if (!isEmpty(userPermissions[permissionToBeChecked])
          && !isEmpty(userPermissions[permissionToBeChecked][baseOrgId])
          && userPermissions[permissionToBeChecked][baseOrgId]?.allVendors
          ) {
            allVendors = true;
        }
      });  
      if(allVendors){
        if((clientVendorRelation === null || clientVendorRelation === undefined) && !['LOADING', 'SUCCESS']?.includes(clientVendorRelationState)){
          dispatch(getClientVendorRelationLoading());
          const CUST_MGMT = process.env.REACT_APP_CUSTOMER_MGMT_API_URL;        
          const CVRelationshipUrl = `${CUST_MGMT}/org/${baseOrgId}/vendor/${orgId}/validate`
          const data = await axios.get(CVRelationshipUrl);
          dispatch(getClientVendorRelation(data?.data?.result));
          _clientVendorRelation = data?.data?.result;
        }
        if(_clientVendorRelation){
          allowAccess = true;
        }
      }
    }
  } else {
    forEach(permissions, (permissionToBeChecked) => {
      if (!isEmpty(userPermissions[permissionToBeChecked])) {
        allowAccess = true;
        return false;
      }
    });
  }
  return allowAccess;
};

export const hasPermission = (permissions) => {
  let userPermissions = usePlatformDataStoreSelector(
    (state) => state?.auth?.permissions,
  );

  return userPermissions ? permissions in userPermissions : false;
}

// export const HasAccess = ({ permissions, yes, no }) => {
//   const dispatch = useDispatch();
//   return hasPermission(permissions) ? yes() : no()
// }

export const HasAccess = ({
  permissions, yes, no
}) => {
  const [hasPermission, setHasPermission] = useState();
  const [isPromiseFulfilled, setPromiseFullfilled] = useState(false);
  const dispatch = useDispatch();
  const { uuid: orgId } = useParams();
  const rState = usePlatformDataStoreSelector(
    (state) => state
  );
  const hasPermissionPromise = useMemo(() => checkPermission({
    rState, permissions, orgId, dispatch
  }) ,[permissions, orgId, rState]); 

    useEffect(() => {
      if (rState) {
        hasPermissionPromise
        .then((_hasPermission) => {
          if (_hasPermission) {
            setHasPermission(true);
            setPromiseFullfilled(true);
          } else {
            setHasPermission(false);
            setPromiseFullfilled(true);
          }
        })
        .catch((error) => {
          console.error(error);
          setHasPermission(false);
          setPromiseFullfilled(true);
        });
      }
    }, [rState]);

    if(hasPermission === false && isPromiseFulfilled){
      return no();
    } else if(hasPermission && isPromiseFulfilled){
      return yes();
    }

    return null;
};

HasAccess.defaultProps = {
  yes: () => null,
  no: () => null,
};

// hoc
export const withPlatformData = (WrappedComponent) => (props) => {
  const [state, setState] = useState(null);
  const platformDataStore = useContext(PlatformDataStoreContext);
  const { uuid } = useParams();
  let user = usePlatformDataStoreSelector(
    (state) => state?.auth?.user,
  )
  useEffect(() => {
    if (!platformDataStore) return;
    const handleChange = () => {
      const currentState = platformDataStore.getState();
      if (state !== currentState) setState(currentState);
    };
    handleChange();
    return platformDataStore.subscribe(handleChange); // eslint-disable-line consistent-return
  }, [platformDataStore]);

  
  return (
    <WrappedComponent
      platformData={state}
      platformDispatch={platformDataStore.dispatch}
      platformActions={platformDataStore.platformActions}
      {...props}
    />
  );
}