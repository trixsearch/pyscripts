import React, { Component } from "react";
import AppButton from "./AppButton";
import "./Carousel.css";
import Button from "../Button/Button";
import { isMobile } from '../../../containers/utils';
import { CarouselContentLoader } from "../ContentLoaders/ContentLoaders";

let newPos = 0;
let section = '';

class Carousel extends Component {

    // scrollValue is the Scoll value (in pixels) of when one clicks the Carousel Scroll Arrows
    scrollValue = isMobile() ? Math.floor((window.innerWidth - 20) * 0.8) : 450;

    componentDidMount() {
        if(section !== this.props.section) {
            section = this.props.section;
            newPos = 0;
        }
        const { carouselViewport } = this.refs;
        carouselViewport.scrollLeft = carouselViewport.scrollLeft + newPos;
    }

    handleRightClick = (e) => {
        e.preventDefault();
        const { carouselViewport } = this.refs;
        newPos = carouselViewport.scrollLeft + this.scrollValue
        carouselViewport.scrollLeft = newPos;
    }

    handleLeftClick = (e) => {
        e.preventDefault();
        const { carouselViewport } = this.refs;
        newPos = carouselViewport.scrollLeft - this.scrollValue
        carouselViewport.scrollLeft = newPos;
    }
    
    render() {
        let buttons = null;
        let carouselItem = null;

        if(!this.props.carouselContentLoader) {
            if (this.props.appsdata) {
                carouselItem = this.props.appsdata.map(Item => {
                    return (
                        <AppButton
                            appId={this.props.appId}
                            appName={this.props.appName}
                            key={Item.id}
                            id={Item.id}
                            carouselLength={this.props.appsdata.length}
                            elementName={Item}
                            selectedApp={() => this.props.selectedApp(
                                Item.name, Item.process_key, Item.id, Item.view_permission
                            )}
                        />
                    )
                })
            }

            // thresholdValue is the count of Workflow buttons
            // Show Carousel Scroll Arrows when exceeds the thresholdValue
            // thresholdValue for the Mobile view is 1 & Desktop view is 4
            let thresholdValue = isMobile() ? 1 : 4;
            
            if (this.props.appsdata.length > thresholdValue) {
                buttons = (
                    <>
                        <Button button="button-slider" buttonType="nav-button" clicked={(e) => this.handleLeftClick(e)}>
                            <span className="glyphicon glyphicon-menu-left" />
                        </Button>
                        <Button button="button-slider" buttonType="nav-button" clicked={(e) => this.handleRightClick(e)}>
                            <span className="glyphicon glyphicon-menu-right" />
                        </Button>
                    </>
                )
            }
        } else {
            carouselItem = (
                <CarouselContentLoader />
            )
        }

        return (
            <div className={`courasel-container ${this.props.filter?'process_filter_dropdown':''}`}>
                <div className="courasel-viewport" ref="carouselViewport" style={isMobile() ? {width: this.scrollValue} : {}} >
                    {carouselItem}
                </div>
                <div className="couresal-button">
                    {buttons}
                </div>
            </div>
        )
    }
}

export default Carousel;
