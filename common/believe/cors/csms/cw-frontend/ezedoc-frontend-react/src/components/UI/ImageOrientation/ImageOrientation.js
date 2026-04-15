import React, { Component } from "react";
import loadImage from "blueimp-load-image";

import Spinner from "../Spinner/Spinner";
import { isImage } from '../../../containers/utils';

/* By default, this style will be applied. 
Modify the makeCenter prop if you don't want to make the canvas element center */
const centerize = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};

class ImageOrientation extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      isLoading: true
    }
    this.imageCanvas = React.createRef();
  }

  componentDidMount() {
    this.isUnMounted = false;
    if(this.state.isLoading) {
      this.loaderCallBack();
      this.correctOrientation(this.props);
    }
  }

  componentDidUpdate(prevProps) {
    if(
      this.props.imageUrl !== "" 
      && isImage(this.props.fileType) 
      && this.props.imageUrl !== prevProps.imageUrl
      ) {
      this.updatingImageProcess()
    }
  }

  componentWillUnmount() {
    this.isUnMounted = true;
  }

  updatingImageProcess = () => {
    this.setState({
      isLoading: true
    }, () => {
      this.loaderCallBack();
      if (this.imageCanvas.current) {
        this.canvasElement = this.imageCanvas.current.getElementsByTagName("canvas");
        if (this.canvasElement && this.canvasElement.length !== 0)
          this.imageCanvas.current.removeChild(this.canvasElement[0]);
      }
      this.correctOrientation(this.props);
    })
  }

  loaderCallBack = () => {
    if(this.props.showLoader)
      this.props.loadingCallback(this.state.hasError, this.state.isLoading)
  }

  correctOrientation = properties => {
    if (properties.imageUrl !== "" && isImage(properties.fileType)) {
      loadImage(
        properties.imageUrl,
        (img) => {
          if (!this.isUnMounted && img.type === undefined) {
            this.setState({
              isLoading: false,
              hasError: false
            },() => {
              this.loaderCallBack();
            })
            this.imageCanvas.current.appendChild(img);
          }
          if (!this.isUnMounted && img.type === 'error') {
            this.setState({
              hasError: true,
              isLoading: false
            },() => {
              this.loaderCallBack();
            })
          }
        },
        {
          maxWidth: properties.maximumWidth,
          maxHeight: properties.maximumHeight,
          orientation: true
          /* Setting orientation to true enables the canvas & meta-data options.
          It automatically rotates the image according to EXIF data */
        }
      );
    }
  };

  render() {
    const { 
      classes, 
      makeCenter, 
      showLoader,
      showErrorMessage,
      loaderContainerDesign,
      canvasContainerDesign,
      errorImagePlaceholder,
    } = this.props;
    const { hasError, isLoading } = this.state;

    let customStyle;
    if(makeCenter) {
      customStyle = (showLoader && isLoading && loaderContainerDesign) || hasError 
        ? loaderContainerDesign 
        : centerize
    } else {
      customStyle = canvasContainerDesign
    }

    return !isLoading && !showErrorMessage && errorImagePlaceholder && hasError
      ? (
        <img className="process-card-image" src={errorImagePlaceholder} alt="" />
      )
      : (
        <div
          style={customStyle}
          ref={this.imageCanvas}
          className={`canvas_container ${hasError ? 'fetch_error_container' : classes}`}
        >
          {
            isLoading && showLoader ? (<Spinner />) : null
          }
          {
            !isLoading && showErrorMessage && hasError 
              ? 'File preview is not available. The file is missing or has been recently added. For recently added files, use Save Draft and then refresh this task'
              : null
          }
        </div>
      )
  }
}

// Default properties
ImageOrientation.defaultProps = {
  classes: "",
  imageUrl: "",
  fileType: "",
  makeCenter: true,
  showLoader: true,
  maximumWidth: 100,
  maximumHeight: 100,
  showErrorMessage: false,
  loaderContainerDesign: null,
  canvasContainerDesign: null,
  errorImagePlaceholder: null,
};

export default ImageOrientation;
