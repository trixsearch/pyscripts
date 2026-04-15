import React, { Component } from "react";
import { connect } from "react-redux";
import "./theme.css";
import tc from "tinycolor2";
import ColourWheel from "../../../colorWheel/components/colorWheel";

class ColourPicker extends Component {
    constructor(props) {
        super(props);
        this.state = {
            colourCode: "",
            prevProps: {},
            colorPickerStatus: false
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

    handleColorChange(rgb) {
        if (rgb) {
            let colorCode = tc(rgb).toHexString();
            this.setState({
                colourCode: colorCode
            })

            this.props.upateThemeColour(this.props.itemName, colorCode)
        }
    }

    onInputChange(event) {
        if (event.target.value !== undefined && event.target.value !== "") {
            this.setState({ colourCode: event.target.value });
            this.props.upateThemeColour(this.props.itemName, event.target.value);

            this.setState({
                colorPickerStatus: !this.state.colorPickerStatus
            })
        }
    }


    render() {

        return (
            <>
                <div className="colorwheel_box">
                    {this.state.colorPickerStatus ?
                        <ColourWheel
                            canvasId={this.props.canvasId}
                            radius={90}
                            padding={2}
                            lineWidth={30}
                            onColourSelected={this.handleColorChange}
                            onRef={ref => (this.colourWheel = ref)}
                            spacers={{
                                colour: "#FFFFFF",
                                shadowColour: "#ccc",
                                shadowBlur: 5
                            }}
                            shades={256}
                            preset={true} // You can set this bool depending on whether you have a pre-selected colour in state.
                            presetColour={this.state.colourCode}
                            animated
                        /> :
                        <ColourWheel
                            canvasId={this.props.canvasId}
                            radius={90}
                            padding={2}
                            lineWidth={30}
                            onColourSelected={this.handleColorChange}
                            onRef={ref => (this.colourWheel = ref)}
                            spacers={{
                                colour: "#FFFFFF",
                                shadowColour: "#ccc",
                                shadowBlur: 5
                            }}
                            shades={256}
                            preset={true} // You can set this bool depending on whether you have a pre-selected colour in state.
                            presetColour={this.state.colourCode}
                            animated
                        />}

                    <div className="color_picker_name">color {this.props.indexVal + 1}</div>
                </div>
                <div className="colorwheel_value_box">
                    <div className="color_code_paste">
                        <p>Or paste #code </p>
                    </div>
                    <div className="details_text_box_body">
                        <form action="" className="form_up_box">
                            <div className="row col-md-12 m-0 p-0">
                                <div className="floating-label col-md-8 ">
                                    <input
                                        className="floating-input"
                                        type="text"
                                        placeholder="Paste #code here"
                                        value={this.state.colourCode}
                                        onChange={this.onInputChange}
                                        pattern="^#+([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$"
                                    />
                                    <label>Hex Code {this.props.indexVal + 1}</label>
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




