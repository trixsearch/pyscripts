import React, { Component } from "react";
import { connect } from "react-redux";
import { NavLink } from "react-router-dom";
import * as actions from '../../../store/actions/index';

import CircularColor from 'react-circular-color';

class ColourPicker extends Component {
    constructor(props) {
        super(props);
        this.state = {
            colourCode: "",
            prevProps: {}
        }
        this.handleColorChange = this.handleColorChange.bind(this);
        this.onInputChange = this.onInputChange.bind(this);
    }

    componentDidMount() {
    }

    // static getDerivedStateFromProps(nextProps, prevState) {
    //     let newProps = nextProps.colourCode
    //     if (newProps != prevState.colourCode) {
    //         return {
    //             colourCode: newProps
    //         }
    //     }

    // }
    static getDerivedStateFromProps(props, state) {
        const prevProps = state.prevProps || {};
        // Compare the incoming prop to previous prop
        const colourCode =
          prevProps.colourCode !== props.colourCode
            ? props.colourCode
            : state.colourCode;
        return {
          // Store the previous props in state
          prevProps: props,
          colourCode,
        };
      }

    // componentDidUpdate(oldProps) {
    //     const newProps = this.props
    //     if(oldProps.colourCode !== newProps.colourCode) {
    //       this.setState({colourCode:newProps.colourCode })
    //     }
    //   }

    handleColorChange(color) {
        // this.setState({colourCode: color})
        this.props.upateThemeColour(this.props.itemName, color)
    }

    onInputChange(event) {
        // this.setState({colourCode: event.target.value})
        this.props.upateThemeColour(this.props.itemName, event.target.value)
    }

    renderHandle = ({ onHandleDown, cx, cy, handleRadius }) => {
        return(
            <svg x={cx-10} y={cy-10} width={20} height={20} > 
            <polygon points={'10,0 0,20 20,20'} fill="#fff" />
            </svg>
        );
    }

    render() {

        return (
            <>
                <div className="colorwheel_box">
                    <CircularColor
                        size={200}
                        onChange={this.handleColorChange}
                        centerRect={true}
                        renderHandle={this.renderHandle}
                        color={this.state.colourCode}
                    />
                    <div className="color_picker_name">color 1</div>
                </div>
                <div className="colorwheel_value_box">
                    <div className="color_code_paste">
                        <p>Or paste #code </p>
                    </div>
                    <div className="details_text_box_body">
                        <form action="" className="form_up_box">
                            <div className="row col-md-12 m-0 p-0">
                                <div className="floating-label col-md-6 ">
                                    <input className="floating-input" type="text" placeholder="Paste #code here" value={this.state.colourCode} onChange={this.onInputChange}/>
                                    <label>Hex Code 1</label>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

            </>

        )
    }
}
const mapStateToProps = state => {
    return {

    }
}

const mapDispatchToProps = dispatch => {
    return {
    }

}

export default connect(mapStateToProps, mapDispatchToProps)(ColourPicker);




