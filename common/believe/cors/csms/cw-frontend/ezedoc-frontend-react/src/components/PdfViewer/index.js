import React, { useState, useEffect } from 'react';
import Spinner from '../UI/Spinner/Spinner';
 
const PdfViewer = ({
    file,
    onDocumentComplete
}) => {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const showPdf = (fileUrl) => {
    if(fileUrl?.includes("https://https://")){
        fileUrl = fileUrl?.replace("https://https://", "https://");
    }
    if(fileUrl?.includes("http://")){
      fileUrl = fileUrl?.replace("http://", "https://");
    }
    setLoading(true);
    fetch(fileUrl)
        .then(response => {
            response.blob()
                .then(blob => {
                    let url = window.URL.createObjectURL(blob);
                    setUrl(url);
                    setLoading(false);
                    if(onDocumentComplete){
                      onDocumentComplete();
                    }
                })
        })
  }
 
  useEffect(() => {
    if(file){
      showPdf(file);
    }
  }, [file]);
 
  return (
    <>
      {loading && <Spinner />}
      {url && 
          <iframe 
            width="100%" 
            height="100%" 
            src={url} 
            style={
              { 
                width: "100%", 
                height: "100%",
                borderRadius: "10px",
                border: "none"
              }
            } 
            >
          </iframe>
      }
    </>
  );
}
 
export default PdfViewer;