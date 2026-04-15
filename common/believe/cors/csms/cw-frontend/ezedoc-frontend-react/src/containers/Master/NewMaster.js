import React, { Component } from 'react';
import ReactTable from 'react-table';
import { connect } from 'react-redux';

import { parseQueryString } from 'containers/utils';
import Spinner from '../../components/UI/Spinner/Spinner';
import ErrorPage from '../ErrorPage';
import EzedoxPagination from '../../components/UI/Pagination/Pagination';
import { getMasterModelById, getEntityMasterData, handleRecordDownload } from '../../store/actions/MasterDB/master';

import 'react-table/react-table.css';
import './master.css';
import MasterRecordDownload from './MasterRecordDownload/MasterRecordDownload'

class NewMaster extends Component {
    constructor(props) {
        super(props);
        this.state = {
            header: [],
            data: [],
            fetch_error: false,
            activePage: null,
            total: null,
            showRecordDownloadModel:false,
            query: {}
        }
    }

    componentDidMount() {
        document.getElementById('right_side').style.marginLeft = '0px';

        // Get master record headers
        this.props.getMasterFields(this.props.match.params.id)
            .then((res) => {
                this.setState(prevState => ({
                    ...prevState,
                    id: res.data.id,
                    header: res.data.keyvaluepair
                }))
            })
            .catch(() => {
                this.setState({
                    fetch_error: true
                })
            });

        // Get master record data
        const { page } = parseQueryString(this.props.location.search);
        this.fetchMasterData(this.props.match.params.id, page);
    }


    componentWillUnmount() {
        document.getElementById('right_side').style.marginLeft = '5px';
    }

    fetchMasterData = (id, page = 1) => {
        this.props.getMasterData(id, page)
            .then(res => {
                this.setState(prevState => ({
                    ...prevState,
                    data: res.data.data.map(item => (item.entity_data)),
                    total: res.data.pagination_data.total_count,
                    activePage: page
                }))
            })
            .catch(() => {
                this.setState({fetch_error: true})
            })
    }

    handlePageChange = (page) => {
        this.fetchMasterData(this.props.match.params.id, page)
    }

    
    showRecordDownload = () => {        
        this.setState({
            showRecordDownloadModel: true,
            query: {}
        })
      }

    hideRecordDownload = () => {
        this.setState({
            showRecordDownloadModel: false,
            query: {}
        })
    }
    
    updateQuery = (data) =>{
        this.setState({
            query: data
        }, () => {
            this.props.handleRecordDownload(this.state.id, this.state.query, this.hideRecordDownload)
        })
    }

    render() {
        const { loader } = this.props;
        const {
            header, fetch_error, data, activePage, total
        } = this.state;

        if (fetch_error) {
            return (<ErrorPage />);
        }

        const columns = header.map(item => ({
            Header: item.name,
            accessor: item.key
        }));

        return (
            <>
                {loader && (<Spinner />)}

                <div className="master-download-btn">
                    <button
                        type="button"
                        onClick={this.showRecordDownload}
                        className="fancy_btn active"
                    >
                        Download
                    </button>
                </div>
                <div className="master-react-table">
                    <ReactTable
                        data={data}
                        className="master-react-table-component"
                        columns={columns}
                        showPagination={false}
                        showPageSizeOptions={false}
                        defaultPageSize={10}
                        getTrProps={() => ({
                            style: {
                                textAlign: 'left',
                            }
                        })}
                        getTheadTrProps={() => ({
                            style: {
                                textAlign: 'left'
                            }
                        })}
                        getTbodyProps={() => ({
                            style: {
                                overflowX: 'auto',
                                overflowY: 'overlay'
                            }
                        })}
                    />
                    <div className="master-pagination">
                        <EzedoxPagination
                            active={activePage}
                            taskCount={total}
                            handlePageChange={this.handlePageChange}
                            itemsCountPerPage={10}
                        />
                    </div>
                </div>
                <MasterRecordDownload 
                  showRecordDownloadModel={this.state.showRecordDownloadModel}
                  selectedAppAllProcessVars={this.state.header}
                  updateQuery={this.updateQuery}
                  hideRecordDownload={this.hideRecordDownload}
                />
            </>
        )
    }
}

const mapStateToProps = ({ master }) => ({
    loader: master.loader
});

const mapDispatchToProps = (dispatch) => ({
    getMasterFields: (id) => dispatch(getMasterModelById(id)),
    getMasterData: (id, page) => dispatch(getEntityMasterData(id, page)),
    handleRecordDownload:(id, query, hideRecordDownload) => dispatch(handleRecordDownload(id, query,hideRecordDownload))
})

export default connect(mapStateToProps, mapDispatchToProps)(NewMaster);
