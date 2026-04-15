import React, { Component } from 'react';
import { connect } from 'react-redux';

import { getMasterModelById, getModelFields, bulkEditModelFields } from '../../store/actions';
import Spinner from '../../components/UI/Spinner/Spinner';
import CreateModel from './CreateModel';
import CreateFields from './CreateFields';
import ErrorPage from '../ErrorPage';


class MasterEdit extends Component {
    constructor(props) {
        super(props);
        this.state = {
            name: "",
            key: "",
            fetch_error: false
        }
    }

    componentDidMount() {
        this.props.getMasterModelById(this.props.match.params.id)
            .then(response => {
                this.setState(() => ({
                    name: response.data.name,
                    key: response.data.key
                }))
            }).catch(() => {
                this.props.history.push('/master')
            })
    }

    bulkEditFields = (data) => {
        this.props.bulkEditModelFields(data, this.props.match.params.id, this.props.history)
    }

    componentDidCatch() {
        this.setState({
            fetch_error: true
        })
    }

    render() {
        const {loader, match} = this.props;
        const { name, key} = this.state;

        if(this.state.fetch_error) {
            return (<ErrorPage />);
        }
        return (
            <div className="config_add_group_form">
                {loader && (<Spinner />)}
                <div className="create-master-model-opacity">
                    <CreateModel initialState={{name,key}} />
                </div>
                <div className="">
                    <CreateFields
                        edit
                        id={match.params.id} 
                        saveData={this.bulkEditFields} 
                    />
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state) => ({
    loader: state.master.loader
});

const mapDispatchToProps = (dispatch) => ({
    getMasterModelById: (id) => dispatch(getMasterModelById(id)),
    getModelFields: (id) => dispatch(getModelFields(id)),
    bulkEditModelFields: (data, id, history) => dispatch(bulkEditModelFields(data, id, history)) 
});

export default connect(mapStateToProps, mapDispatchToProps)(MasterEdit);    