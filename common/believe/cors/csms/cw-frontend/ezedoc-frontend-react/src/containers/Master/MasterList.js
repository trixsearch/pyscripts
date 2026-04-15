import React from 'react';
import { NavLink } from 'react-router-dom';
import { connect } from 'react-redux';

import { getMasterModel, deleteMasterModel } from '../../store/actions';
import Spinner from '../../components/UI/Spinner/Spinner';
import EzedoxPagination from '../../components/UI/Pagination/Pagination';
import DynamicTable from '../../components/UI/DynamicTable/DynamicTable';
import no_records from "../../assets/images/no_records.png";

const MasterListTableHeaderDatas = [
    {
        label: 'Model Name',
        classes: 'col-xs-10'
    },
    // {
    //     label: 'Actions',
    //     classes: 'col-xs-2'
    // }
]

class MasterList extends React.Component {

    componentDidMount() {
        if (this.props.feature) {
            this.props.getMasterModel();
        }
    }

    handlePageChange = (page) => {
        this.props.getMasterModel(page);
    }

    render() {
        return (
            <div className="process_details_tab_cont config_location_view">
                {this.props.loader && (<Spinner />)}
                {/* <ul className="process_tab_ongoing_comp_ul" id="myTab" role="tablist">
                    <li className="process_tab_last_li">
                        <div className="process_details_btn_cont">
                            <NavLink to="/master/create">
                                <button
                                    type="button"
                                    className="process_fancy_btn fancy_btn active"
                                >
                                    Create Master Model
                                </button>
                            </NavLink>
                        </div>
                    </li>
                </ul> */}
                {this.props.modelData.length !== 0 ? (
                    <div className="config_table_list_box">
                        <DynamicTable
                            isLoading={this.props.loader}
                            paginationCount={this.props.total}
                            table_body_classes='masterList_list_container'
                            table_header_datas={MasterListTableHeaderDatas}
                            table_extra_classes='table_container table_cont_edit_delete_list'
                        >
                            {
                                this.props.modelData
                                && Array.isArray(this.props.modelData)
                                && this.props.modelData.map(model => (
                                    <tr key={model.id}>
                                        <td className="col-xs-10">
                                            <NavLink to={`/master/${model.id}`}>
                                                <button type="button" className="appear-like-link">
                                                    {model.name}
                                                </button>
                                            </NavLink>
                                        </td>
                                        {/* <td className="col-xs-2">
                                            <NavLink to={`/master/edit/${model.id}`}>
                                                <button type="button" className="table_btn edit">
                                                    <span className="icon icon-edit" />
                                                    <span>Edit</span>
                                                </button>
                                            </NavLink>
                                            <button type="button" className="table_btn delete" onClick={() => { this.props.deleteMasterModel(model.id) }}>
                                                <span className="icon glyphicon glyphicon-trash" />
                                                <span>Delete</span>
                                            </button>
                                        </td> */}
                                    </tr>
                                ))
                            }
                        </DynamicTable>
                        <EzedoxPagination
                            active={this.props.active}
                            taskCount={this.props.total}
                            handlePageChange={this.handlePageChange}
                            itemsCountPerPage={10}
                        />
                    </div>):
                    <div className="no_records_cont">
                        <div className="no_records_img_text">
                            <img src={no_records} alt="" />
                            <p>
                                No Records
                            </p>
                        </div>
                    </div>
                }
            </div>
        );
    }
}

const mapStateToProps = (state) => ({
    loader: state.master.loader,
    modelData: state.master.modelData,
    active: state.master.active,
    total: state.master.total,
    feature: state.auth.uiFeatures.organisationlicense.master
});

const mapDispatchToProps = (dispatch) => ({
    getMasterModel: (page) => dispatch(getMasterModel(page)),
    deleteMasterModel: (id) => dispatch(deleteMasterModel(id))
});

export default connect(mapStateToProps, mapDispatchToProps)(MasterList);