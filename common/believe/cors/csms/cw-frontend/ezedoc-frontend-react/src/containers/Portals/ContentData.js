import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";

import * as actions from '../../store/actions/index';
import ContentSection from "./ContentSection"
import ContentUnpublished from "./ContentUnpublished"
import Spinner from '../../components/UI/Spinner/Spinner';

import "./portal.css";

class Contents extends Component {
    constructor(props) {
        super(props);
        this.delete = this.delete.bind(this);
    }

    contentId(id, e) {
        const orgId = this.props?.match?.params?.uuid;
        let data = {}
        if (e === "publish") {
            data = {
                "is_published": true
            }
        } else {
            data = {
                "is_published": false
            }
        }
        this.props.getContentEdit(orgId, id, data);
    }

    delete(id) {
        const orgId = this.props?.match?.params?.uuid;
        this.props.contentDelete(orgId, id);
    }


    render() {
        let data = this.props.data;
        let contents = data && data.map(d => {
            if (d.is_published === true) {
                return (
                    <ContentSection
                        key={d.id}
                        id={d.id}
                        name={d.name}
                        published={d.is_published}
                        description={d.description}
                        delete={() => this.delete(d.id)}
                        click={() => this.contentId(d.id, "unpublish")}
                        {...this.props}
                    />
                );
            }
            return null
        });

        let contentsUnpublished = data && data.map(d => {
            if (d.is_published === false) {
                return (
                    <ContentUnpublished
                        key={d.id}
                        id={d.id}
                        name={d.name}
                        published={d.is_published}
                        description={d.description}
                        delete={() => this.delete(d.id)}
                        click={() => this.contentId(d.id, "publish")}
                        {...this.props}
                    />
                );
            } 
            return null;
        });
        
        return (
            <div className="main_changable_container">
                {this.props.loader && (<Spinner/>)}
                <div className="app_category_cont">
                    <div className="app_error_msg">
                        {this.props.error && this.props.error.message}
                    </div>
                    <div className="app_category_head">
                        <p>Published Content</p>
                    </div>
                    <div className="app_showing_card_cont">
                        {contents}
                    </div>
                </div>
                <div className="app_showing_cont">
                    <div className="app_showing_head">
                        <div>
                            <p>Unpublished Content</p>
                        </div>
                    </div>
                    <div className="app_category_card_cont">
                        {contentsUnpublished}
                    </div>

                </div>
            </div>
        );


    }
}

const mapStateToProps = state => {
    return {
        error: state.content.error,
        loader: state.content.loader
    }
}

const mapDispatchToProps = dispatch => {
    return {
        getContentEdit: (orgId, id, data) => dispatch(actions.ContentEditId(orgId, id, data)),
        contentDelete: (orgId, id) => dispatch(actions.contentDelete(orgId, id))

    }

}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Contents));
