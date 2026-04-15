import React, { Component } from 'react';
import { connect } from 'react-redux';

import CreateModel from './CreateModel';
import CreateFields from './CreateFields';
import Spinner from '../../components/UI/Spinner/Spinner';
import { postMasterModel, clearMasterState, createModelFields } from '../../store/actions';


class MasterCreate extends Component {

    componentWillUnmount() {
        this.props.clearMasterState();
    }

    postMasterModelFields = (values) => {
        const { modelID, history } = this.props;
        this.props.createModelFields(modelID, values, history)
    }

    render() {
        
        const initialState = {
            name: "",
            key: ""
        }

        const { loader, step1, step2 } = this.props;
        return (
            <div>
                {loader && (<Spinner />)}
                <div className={step2 ? 'create-master-model-opacity' : ''}>
                    <CreateModel 
                        initialState={initialState} 
                        saveData={this.props.postMasterModel} 
                    />
                </div>
                <div className={step1 ? 'create-master-model-opacity' : ''}>
                    <CreateFields
                        edit={false}
                        id={null} 
                        saveData={this.postMasterModelFields} 
                    />
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state) => ({
    loader: state.master.loader,
    step1: state.master.step1,
    step2: state.master.step2,
    modelID: state.master.modelID
});

const mapDispatchToProps = (dispatch) => ({
    postMasterModel: (data, history) => dispatch(postMasterModel(data, history)),
    clearMasterState: () => dispatch(clearMasterState()),
    createModelFields: (id, data, history) => dispatch(createModelFields(id, data, history))
})

export default connect(mapStateToProps, mapDispatchToProps)(MasterCreate);
