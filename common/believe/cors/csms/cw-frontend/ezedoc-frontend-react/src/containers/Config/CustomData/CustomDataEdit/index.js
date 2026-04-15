import React from 'react';
import { connect } from 'react-redux';

import CustomDataFrom from '../CustomDataForm';
import { editCustomData } from '../../../../store/actions';
import { HasAccess } from '../../../../platformDataStoreContext';
import UnauthorizedPage from '../../../UnauthorizedPage';
import { CW_SERVICE_LIST_UPDATE } from '../../../../Data/constants';

class CustomDataEdit extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            key: "",
            name: "",
            list: [{
                key: "",
                value: ""
            }]
        }
    }

    render() {

        const { state, props } = this;
        const {
 loader, editCustomListData, history, match 
} = props;

        return (
            <HasAccess
                permissions={[CW_SERVICE_LIST_UPDATE]}
                yes={() => (
                    <div>
                        Edit Custom List
                        <CustomDataFrom
                            edit
                            initialState={{ ...state }}
                            saveData={editCustomListData}
                            history={history}
                            id={match.params.id}
                            loader={loader}
                            orgId={match.params.uuid}
                        />
                    </div>
                )}
                no={() => (
                    <UnauthorizedPage />
                )}
            />
        );
    }
}


const mapStateToProps = ({ customData }) => ({
    loader: customData.loader,
    listData: customData.listData
})

const mapDispatchToProps = (dispatch) => ({
    editCustomListData: (orgId, data, history) => dispatch(editCustomData(orgId, data, history))
})

export default connect(mapStateToProps, mapDispatchToProps)(CustomDataEdit);