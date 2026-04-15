import React, { Component } from "react";
import { connect } from "react-redux";
import * as actions from '../../../store/actions/index';
import ColourPicker from './colourPicker';
import { saveToLocalStorage } from "../../../localStorage";
import * as constants from "../../../Data/constants";
import AssetsPicker from './assetPicker';
import PreviewMain from './previewer/previewMain';
import { addToast } from '../../../components/Toast/actions';
import "./theme.css";

class Theme extends Component {
    constructor(props) {
        super(props);
        this.state = {
            initialThemeData: null,
            selectedBtn: 'primary_colour',
            theme: this.props.themeInfo,
            primary_colour: ['first_primary_color', 'second_primary_color'],
            btn_colour: ['first_button_color', 'second_button_color'],
            icon_colour: ["icon_color"],
            assets_color: null,
            text_color: "",
            update: false
            // selectedColourVal:['first_primary_color', 'second_primary_color'],
        }
    }

    componentDidMount() {
        const { themeInfo } = this.props;
        this.setState({
            initialThemeData: { ...themeInfo }
        })
    }

    onSaveThemeCallback = themeData => response => {
        this.props.addToast('success', 'Success', response)
        this.setState({
            initialThemeData: { ...themeData }
        })
    }

    onSaveTheme = () => {
        const { theme } = this.state
        if (JSON.stringify(this.state.initialThemeData) !== JSON.stringify(theme)) {
            this.props.saveTheme(theme, this.onSaveThemeCallback(theme))
        }
    }

    toggleBtn = (event) => {
        this.setState({
            'selectedBtn': event.target.value,
            // eslint-disable-next-line react/no-access-state-in-setstate
            'selectedColourVal': this.state[event.target.value]
        })
    }

    updateThemeColour = (item, colourCode) => {
        let { theme } = this.state;
        theme[item] = colourCode;
        this.setState({ theme: theme, update: true })
    }

    render() {
        let colourPickerContainer = this.state[this.state.selectedBtn]
        let colourPickerComponent = [];
        if (this.state.selectedBtn !== "assets_color") {
            for (let i = 0; i <= colourPickerContainer.length - 1; i += 1) {
                if (this.state.theme[colourPickerContainer[i]]) {
                    colourPickerComponent.push(
                        <ColourPicker
                            key={i}
                            indexVal={i}
                            canvasId={`${this.state.selectedBtn}-${i}`}
                            theme={this.state.theme}
                            upateThemeColour={this.updateThemeColour}
                            itemName={colourPickerContainer[i]}
                            colourCode={this.state.theme[colourPickerContainer[i]]}
                            update={this.state.update}
                        />
                    )
                }
            }
        }

        return (
            <div id="right_side">
                <div className="main_changable_container">
                    <div className="task_card_detail_container">
                        <div className="select_document_box">
                            <div className="app_category_head">
                                <p>Select to Change Colours</p>
                            </div>
                            <div>
                                <button type='button' className={`app_btn ${this.state.selectedBtn === "primary_colour" ? "active" : null}`} value="primary_colour" onClick={this.toggleBtn}>Primary Color</button>
                                <button type='button' className={`app_btn ${this.state.selectedBtn === "btn_colour" ? "active" : null}`} value="btn_colour" onClick={this.toggleBtn}>Button Color</button>
                                <button type='button' className={`app_btn ${this.state.selectedBtn === "text_color" ? "active" : null}`} value="text_color" onClick={this.toggleBtn}>Button Text Color</button>
                                {/* <button className={"app_btn " + (this.state.selectedBtn === "icon_colour" ? "active" : null)} value="icon_colour" onClick={this.toggleBtn}>Icon Color</button> */}
                                <button type='button' className={`app_btn ${this.state.selectedBtn === "assets_color" ? "active" : null}`} value="assets_color" onClick={this.toggleBtn}>Assets Color</button>
                            </div>
                        </div>
                        <PreviewMain theme={this.state.theme} button_text_color={this.state.theme.button_text_color} orgInfo={this.props.orgInfo} />
                        {this.props.editPermission
                            ? (
                                <div className="upgrade_btn_cont">
                                    <button
                                        type='button'
                                        onClick={this.onSaveTheme}
                                        className='fancy_btn active'
                                        disabled={JSON.stringify(this.state.initialThemeData) === JSON.stringify(this.state.theme)}
                                    >
                                        Save
                                    </button>
                                </div>
                            ) : <div />
                        }
                    </div>
                    <div className="color_picker_container">
                        <div className="app_category_head">
                            {this.state.selectedBtn === "text_color"
                                ? <p>Select Button Text Colour</p>
                                : <p>Select Primary Colours</p>
                            }
                        </div>
                        <div className={this.state.selectedBtn !== "text_color" ? "color_picker_body" : ""}>
                            {this.state.selectedBtn === "assets_color" ? <AssetsPicker assetsInfo={this.state.theme} updateThemeColour={this.updateThemeColour} /> : colourPickerComponent}
                        </div>
                        {this.state.selectedBtn === "text_color"
                            ? (
                                <div className="color_picker_body">
                                    <div className="col-md-12">
                                        <div className="col-md-2">
                                            <div
                                                role='presentation'
                                                onClick={() => { this.updateThemeColour('button_text_color', 'BLACK') }}
                                                className={this.state.theme.button_text_color === 'BLACK' ? 'pick_black_color active' : "pick_black_color"}
                                            />
                                            <p className="pick_color_text">Black</p>
                                        </div>
                                        <div className="col-md-2">
                                            <div
                                                role='presentation'
                                                onClick={() => { this.updateThemeColour('button_text_color', 'WHITE') }}
                                                className={this.state.theme.button_text_color === 'WHITE' ? 'pick_white_color active' : "pick_white_color"}
                                            />
                                            <p className="pick_color_text">White</p>
                                        </div>
                                        <div className="col-md-8" />
                                    </div>
                                </div>
                            ) : null
                        }
                    </div>
                </div>
            </div>
        )
    }
}
const mapStateToProps = state => {
    saveToLocalStorage(state.orgLogo.theme, constants.THEME_CONTROLLER);
    return {
        themeInfo: state.orgLogo.theme,
        orgInfo: state.orgLogo,
        editPermission: state.auth.uiPermissions.organisation.change
    }
}

const mapDispatchToProps = dispatch => {
    return {
        saveTheme: (data, CB) => dispatch(actions.orgThemeUpdate(data, CB)),
        addToast: (type, title, message, duration) => dispatch(addToast(type, title, message, duration))
    }

}

export default connect(mapStateToProps, mapDispatchToProps)(Theme);
