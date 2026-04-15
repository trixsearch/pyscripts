import React from 'react';
import { connect } from 'react-redux';

import { Button } from '../../../components/UI/AppButton/AppButton';


const Designer = (props) => {

    /*
     * Modeler designer has been extracted to this component, this is not functional now, 
     and will be hidden from user, as before.
     * To be completed by vishal/harish.
     */

    const UserToken = localStorage.getItem("token")

    let data = {
        username: "",
        password: ""
    };
    let modeler_host = ""
    let form_post = ""
    // let modeler_host = datatype.hostname;
    // let idm_url = " "
    // if (this.state.url !== "") {
    //     let url = new URL(this.state.url);
    //     idm_url = url.pathname;
    // }
    // let form_post = window.location.protocol + "//" + modeler_host + idm_url


    // let data = this.state.data;
    // let modeler_host = datatype.hostname;
    // let idm_url = " "
    // if (this.state.url !== "") {
    //     let url = new URL(this.state.url);
    //     idm_url = url.pathname;
    // }
    // let form_post = window.location.protocol + "//" + modeler_host + idm_url

    // if(this.props.modellerPermission){
    //     axios
    //         .get(`/api/apps/modeler-auth`)
    //         .then((res) => {
    //             this.setState({
    //                 data: res.data.data,
    //                 url: res.data.data.url
    //             })
    //         })
    //         .catch(err => {
    //             console.log(err)
    //         })
    // }

    return (
        <form name="formModelerIdm" action={form_post} method="post">
            <input hidden id="j_username" type="text" value={data.username} name="j_username" />
            <input hidden id="j_password" type="text" value={data.password} name="j_password" />
            <input hidden id="_spring_security_remember_me" type="text" value="true" name="_spring_security_remember_me" />
            <input hidden id="j_modelerhost" type="text" value={modeler_host} name="j_modelerhost" />
            <input hidden id="j_apitoken" type="text" value={UserToken} name="j_apitoken" />
            <input hidden id="j_hostname" type="text" value={window.location.href} name="j_hostname" />
            <input hidden id="submit" type="text" value="Login" name="submit" />
            {props.modellerPermission && (
                <div className="body_nav_button">
                    <Button variant="table-row-edit">
                        Designer
                    </Button>
                </div>
            )}
        </form>
    )
}

const mapStateToProps = (state) => ({
    modellerPermission: state.auth.uiPermissions.modeller.manage,
})

export default connect(mapStateToProps)(Designer);