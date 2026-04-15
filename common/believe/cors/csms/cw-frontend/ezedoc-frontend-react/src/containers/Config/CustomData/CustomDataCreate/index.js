import React from 'react';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom';
import { HasAccess } from '../../../../platformDataStoreContext';
import UnauthorizedPage from '../../../UnauthorizedPage';

import CustomDataFrom from '../CustomDataForm';
import { postCustomData } from '../../../../store/actions';
import { CW_SERVICE_LIST_CREATE } from '../../../../Data/constants';

const CustomDataCreate = ({ postCustomListData, loader, history }) => {

    const { uuid: orgId } = useParams();

    let initialState = {
        key: "",
        name: "",
        list: [{
            key: "",
            value: ""
        }]
    }
    return (
        <HasAccess
        permissions={[CW_SERVICE_LIST_CREATE]}
            yes={() => (
                <div>
                    Create Custom List
                    <CustomDataFrom 
                        edit={false}
                        initialState={initialState} 
                        saveData={postCustomListData} 
                        history={history}  
                        loader={loader}
                        orgId={orgId}
                    />
                </div>
            )}
            no={() => (
                <UnauthorizedPage />
            )}
        />
    );
}

const mapStateToProps = ({ customData }) => ({
    loader: customData.loader
})

const mapDispatchToProps = (dispatch) => ({
    postCustomListData: (orgId, data, history) => dispatch(postCustomData(orgId, data, history))
})

export default connect(mapStateToProps, mapDispatchToProps)(CustomDataCreate);