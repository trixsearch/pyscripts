import React, { Component } from "react";
import ReactDOM from 'react-dom';


class EmailPhone extends Component {
    constructor(props) {
        super(props);
        this.emailPhone = React.createRef();
        this.addFocus  =  this.addFocus.bind(this)
      }

    addFocus =()=> {
        ReactDOM.findDOMNode(this.refs.emailPhone).focus();
        this.props.showAll()
    }


    render(){
        const {selected_data,showCount,handleOnBlur} = this.props
        let emailNotify = null
        if (showCount){
            emailNotify = (
            <>
                <div>{selected_data.length && selected_data[0].label}</div>
                  {selected_data.length >=2  ? ( <span
                        role="presentation"
                        onClick = {this.addFocus}
                        className = "label label-default notify_count"
                    > 
                        +{selected_data.length-1} more 
                    </span>) : ""}
            </>   
        )

        }else {
            emailNotify = (
                <>
                    {selected_data.map(e =>{
                        return (<div  key={e.value}>{e.label}</div>)
                    })}
                </>
            )

        }

            return(
                <div
                    onBlur = {handleOnBlur}
                    tabIndex={1}
                    className="notify_select_list"
                    ref = "emailPhone"
                >
                  {emailNotify}
                </div>
                
            )
    }
}
    

export default EmailPhone;