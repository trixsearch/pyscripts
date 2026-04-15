import React, { Component } from "react";
import Print from 'print-js'
import ImageOrientation from '../../components/UI/ImageOrientation/ImageOrientation';
import FilterDropdown from '../../components/UI/FilterDropdown/FilterDropdown';
import { Button } from '../../components/UI/AppButton/AppButton'
import { 
    isPDF, 
    isSVG, 
    isImage, 
    isMobile,
    isVideo
} from "../utils";

import "./task.css";
import 'print-js/dist/print.css'
import PdfViewer from "../../components/PdfViewer";

const containerDesign = {
    height: isMobile() ? "calc(50vh - 140px)" : "calc(100vh - 145px)"
}

class TaskVerification extends Component {
    constructor(props) {
        super(props);
        this.state = {
            url: "",
            id: null,
            fileType: '',
            prevPDFurl: null,
            rotationDegree: 0,
            showImage: 'fitToWidth',
            isShowingErrorMsg: false,
            isShowingImageLoader: false,
            isImageRotatedSidewise: false
        };
        this.displayContainerRef = React.createRef();
    }

    componentDidMount() {
        let len = Object.keys(this.props.attachments).length;
        if (len) {
            let len2 = Object.values(this.props.attachments)[0].length;
            let firstKey = len2 > 2 ? `${Object.keys(this.props.attachments)[0]}_0` : Object.keys(this.props.attachments)[0];
            if (len2) {
                let firstFile = Object.values(this.props.attachments)[0][0];
                let fileUrl = firstFile.data.url;
                if(fileUrl?.includes("https://https://")){
                    fileUrl = fileUrl?.replace("https://https://", "https://");
                }
                if(fileUrl?.includes("http://")){
                    fileUrl = fileUrl?.replace("http://", "https://");
                }
                this.setState({
                    fileType: firstFile.type,
                    url: fileUrl,
                    id: firstKey,
                });
            }
        }
    }

    onDocumentComplete = () => {
        this.setState(prevState => ({
            prevPDFurl: prevState.url,
        }));
    };

    handlePdfImage = (url, type, id) => {
        let fileUrl = url;
        if(fileUrl?.includes("https://https://")){
            fileUrl = fileUrl?.replace("https://https://", "https://");
        }
        if(fileUrl?.includes("http://")){
            fileUrl = fileUrl?.replace("http://", "https://");
        }
        if (isPDF(type)) {
            if(this.state.prevPDFurl !== url) {
                this.setState({
                    fileType: type,
                    url: fileUrl,
                    id: id,
                    isShowingErrorMsg: false,
                })
            }
        } else {
            this.setState({
                fileType: type,
                url: fileUrl,
                id: id,
                prevPDFurl: null,
                rotationDegree: 0, // resetting the image rotation to 0 degree when switching the images from the dropdown
                isShowingErrorMsg: false,
            })
        }
    }

    selectedItemNameFormat = (id, list) => {
        let name = '';
        list.map(item => {
            if (id === item.id) {
                name = item.name;
            }
            return null;
        })
        return name;
    }

    handleImageSize = (type) => {
        this.setState({
            showImage: type
        })
    }

    loadingCallback = (isShowingErrorMsg, isShowingImageLoader) => {
        this.setState({
            isShowingErrorMsg,
            isShowingImageLoader
        })
    }

    isRotatedSidewise = (degree) => {
        return degree === 90 || degree === -90 || degree === 270 || degree === -270
    }

    rotateImage = (isClockwise) => {
        if(isClockwise !== null) {
            const { rotationDegree } = this.state
            // eslint-disable-next-line no-nested-ternary
            let degree = isClockwise ? rotationDegree === 270 ? rotationDegree - 270 : rotationDegree + 90 : rotationDegree === -270 ? rotationDegree + 270 : rotationDegree - 90
            this.setState({
                rotationDegree: degree,
                isImageRotatedSidewise: this.isRotatedSidewise(degree)
            })
        }
    }

    downloadFile = (fileName, fileUrl) => {
        if(fileUrl?.includes("https://https://")){
            fileUrl = fileUrl?.replace("https://https://", "https://");
        }
        fetch(fileUrl)
            .then(response => {
                response.blob()
                    .then(blob => {
                        let url = window.URL.createObjectURL(blob);
                        let a = document.createElement('a');
                        a.href = url;
                        a.download = fileName;
                        a.click();
                    })
            })
    }

    render() {
        if (Object.values(this.props.attachments).length === 0) {
            return (
                <div>Nothing to show</div>
            )
        }

        const { 
            id,
            url,
            fileType,
            showImage,
            rotationDegree,
            isShowingErrorMsg,
            isShowingImageLoader,
            isImageRotatedSidewise,
        } = this.state;

        let keyslist = Object.keys(this.props.attachments);
        let valueslist = Object.values(this.props.attachments);
        let attachmentList = [];

        for(let i = 0; i < valueslist.length; i += 1) {
            for(let j = 0; j < valueslist[i].length - 1; j += 1) {
                attachmentList.push({
                    url: valueslist[i][j].url,
                    type: valueslist[i][j].type,
                    id: valueslist[i].length > 2 ? `${keyslist[i]}_${j}` : keyslist[i],
                    name: `${valueslist[i][valueslist[i].length - 1]} - ${valueslist[i][j].originalName}`
                })
            }
        }

        const PrintTooltip = (type)=>(
                <button title="Print" type="button" disabled={isShowingImageLoader || isShowingErrorMsg} className="btn icon-print" onClick={() => Print({printable:`${url}`, type:`${type}`, showModal:true})} />
        )

        return (
            <div className="ezedox_tasks_container">
                <div className="task_card_detail_container ezedox_display_section">
                     {/* eslint-disable-next-line no-nested-ternary */}
                    <div className={`select_document_box ${fileType && isImage(fileType) && !isSVG(fileType) ? '' : fileType && isPDF(fileType) ? 'pdf_item' : 'other_item'}`}>
                        <p>Select Document</p>
                        <FilterDropdown
                            list={attachmentList}
                            classes='attachments_dropdown_taskPage'
                            onItemClickHandler={this.handlePdfImage}
                            disableComponent={isShowingImageLoader}
                            selectedItem={this.selectedItemNameFormat(id, attachmentList)}
                        />
                        {
                            fileType && isImage(fileType) && !isSVG(fileType) ? (
                                <div className="file_functionalities">
                                    <div className="btn-group fit_to_icons" role="group" aria-label="Fit To Icons Buttons Group">
                                        <button title="Fit to width" type="button" disabled={isShowingErrorMsg} className={`btn icon-swidth ${showImage === 'fitToWidth' ? 'active_btn': ''}`} onClick={() => this.handleImageSize('fitToWidth')} />
                                        <button title="Fit to height" type="button" disabled={isShowingErrorMsg} className={`btn icon-sheight ${showImage === 'fitToHeight' ? 'active_btn': ''}`} onClick={() => this.handleImageSize('fitToHeight')} />
                                    </div>
                                    <button title="Rotate anticlockwise" type="button" disabled={isShowingImageLoader || isShowingErrorMsg} className="btn icon-anticlockwise" onClick={() => this.rotateImage(false)} />
                                    <button title="Rotate clockwise" type="button" disabled={isShowingImageLoader || isShowingErrorMsg} className="btn icon-clockwise" onClick={() => this.rotateImage(true)} />
                                    { !isMobile() && PrintTooltip('image')}
                                </div>
                            ) : null
                        }
                    </div>
                    <div className="display_document_section_body">
                        <div
                            ref={this.displayContainerRef}
                            style={{
                                justifyContent: showImage === 'fitToHeight'
                                    && this.displayContainerRef.current.firstChild.firstChild.firstChild
                                    && ((
                                        this.displayContainerRef.current.firstChild.firstChild.firstChild.width < this.displayContainerRef.current.firstChild.firstChild.firstChild.height
                                        && (rotationDegree === 0 || rotationDegree === 180 || rotationDegree === -180)
                                    ) || (
                                        this.displayContainerRef.current.firstChild.firstChild.firstChild.width > this.displayContainerRef.current.firstChild.firstChild.firstChild.height
                                        && (rotationDegree === 270 || rotationDegree === -270 || rotationDegree === 90 || rotationDegree === -90)
                                    ))
                                        ? 'center' : ''
                            }}
                            className={`disply_document 
                                ${fileType && isPDF(fileType)
                                    ? 'pdf_doc' 
                                    // eslint-disable-next-line no-nested-ternary
                                    : `${isImageRotatedSidewise 
                                        ? showImage === 'fitToWidth' ? 'img_doc fitToWidthDoc_side' : 'img_doc fitToHeightDoc_side'
                                        : showImage === 'fitToWidth' ? 'img_doc fitToWidthDoc' : 'img_doc fitToHeightDoc'
                                    }
                                `}
                            `}
                        >
                     {/* eslint-disable-next-line no-nested-ternary */}
                            {fileType && isPDF(fileType)
                                ? (
                                    <div className="pdf_process">
                                        <PdfViewer 
                                            file={url}
                                            onDocumentComplete={this.onDocumentComplete}
                                        />
                                    </div>
                                    ) 
                                    // eslint-disable-next-line no-nested-ternary
                                : fileType && isImage(fileType) && !isSVG(fileType)
                                ? (
                                    <span 
                                        style={{
                                            transform: isShowingImageLoader
                                                ? `rotate(0deg)`
                                                : `rotate(${rotationDegree}deg)`, 
                                            width: isShowingImageLoader 
                                                ? '100%' 
                                                : '',
                                                // eslint-disable-next-line no-nested-ternary
                                            alignItems: isImageRotatedSidewise && showImage === 'fitToHeight'
                                            // eslint-disable-next-line no-nested-ternary
                                                ? this.displayContainerRef.current.firstChild.firstChild.firstChild
                                                && (this.displayContainerRef.current.firstChild.firstChild.firstChild.width > this.displayContainerRef.current.firstChild.firstChild.firstChild.height)
                                                    ? rotationDegree === 270 || rotationDegree === -270 || rotationDegree === 90 || rotationDegree === -90
                                                        ? 'center' 
                                                        : ''
                                                    : rotationDegree === 270 || rotationDegree === -90
                                                        ? 'flex-start' 
                                                        : 'flex-end'
                                                : '',
                                                // eslint-disable-next-line no-nested-ternary
                                            justifyContent: isImageRotatedSidewise && showImage === 'fitToWidth' 
                                                ? rotationDegree === 270 || rotationDegree === -90
                                                    ? 'flex-end' 
                                                    : 'flex-start'
                                                : ''                                  
                                        }}
                                        // eslint-disable-next-line no-nested-ternary
                                        className={`attachment_image ${isImageRotatedSidewise
                                                ? showImage === 'fitToWidth' ? 'attachment_image_fitToWidth_side' : 'attachment_image_fitToHeight_side' 
                                                : showImage === 'fitToWidth' ? 'attachment_image_fitToWidth' : 'attachment_image_fitToHeight'
                                            }
                                        `}
                                    >
                                        <ImageOrientation
                                            showErrorMessage
                                            maximumWidth={1000}
                                            maximumHeight={1000}
                                            imageUrl={url}
                                            fileType={fileType}
                                            loadingCallback={this.loadingCallback}
                                            loaderContainerDesign={containerDesign}
                                            makeCenter={!isImageRotatedSidewise}
                                            canvasContainerDesign={
                                                // eslint-disable-next-line no-nested-ternary
                                                isImageRotatedSidewise 
                                                    ? showImage === 'fitToWidth' 
                                                        ? {height: this.displayContainerRef.current.clientWidth - 10} 
                                                        : {width: this.displayContainerRef.current.clientHeight - 10} 
                                                    : null 
                                                }
                                        />
                                    </span>
                                )
                                : fileType && isVideo(fileType) ? (
                                    // eslint-disable-next-line jsx-a11y/media-has-caption
                                <video src={url} autoPlay controls playsInline />
                                )
                                : (
                                    <span className="downloadable_file_container">
                                        <span className="help_text">
                                            No preview available for this file. Click to download
                                        </span>
                                        <span 
                                            className="icon-download"
                                        />
                                        <Button 
                                            variant="primary" 
                                            onClick={() => this.downloadFile(this.selectedItemNameFormat(id, attachmentList), url)}
                                        >
                                            Download
                                        </Button>
                                    </span>
                                )
                            }
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default TaskVerification;
