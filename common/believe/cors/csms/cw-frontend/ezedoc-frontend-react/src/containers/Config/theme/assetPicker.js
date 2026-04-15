import React, { Component } from "react";
import Slider from 'react-rangeslider';
import 'react-rangeslider/lib/index.css';
import bgImage from "../../../assets/images/previewer_two_bg.png";

class AssetsPicker extends Component {
    constructor(props) {
        super(props);
        this.state = {
            value: 100,
            opacity: 1
        }
    }

    handleChange = value => {
        this.setState({
            value: value,
            opacity: value / 100
        }, () => {
            this.props.updateThemeColour('assets_color', value)
        })
    }

    render() {
        const { value } = this.state;
        const styles = {
            backgroundStyle: {
                opacity: this.state.opacity
            }
        };
        const { backgroundStyle } = styles;
        const horizontalLabels = {
            0: '0',
            100: '100'
        }
        return (
            <>
                <div style={{ width: "100%" }}>
                    <div className="col-md-12">
                        <div className="col-md-6">
                            <div className='slider'>
                                <Slider
                                    min={0}
                                    max={100}
                                    value={value}
                                    labels={horizontalLabels}
                                    onChange={this.handleChange}
                                />
                                {/* https://whoisandy.github.io/react-rangeslider/ */}
                                {/* <div className='value'>{value}</div> */}
                            </div>
                            <div className="slider_desc">
                                <p>Move the slider to adjust opacity</p>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="gradient_opact" >
                                <img src={bgImage} alt="" style={backgroundStyle} />
                            </div>
                        </div>
                    </div>
                </div>
            </>

        )
    }
}

export default AssetsPicker
