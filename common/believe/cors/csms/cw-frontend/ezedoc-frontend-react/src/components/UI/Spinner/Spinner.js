import React, { useEffect, useState } from "react";
import loader from '../../../assets/images/loader_white.gif';
import './Spinner.css';

const Spinner = () => {
    const [left, setLeft] = useState(
        window.innerWidth - document?.getElementById("ezedox_main_container")?.getBoundingClientRect()?.width
    );
    const [top, setTop] = useState(
        document?.getElementById("Header_container")?.getBoundingClientRect()?.height
    );

    useEffect(() => {
        const resizeListener = (ev) => {
            setLeft( window.innerWidth - document?.getElementById("ezedox_main_container")?.getBoundingClientRect()?.width)
        }
        const heightResizeListener = (ev) => {
            setTop(document?.getElementById("Header_container")?.getBoundingClientRect()?.height)
        }
        document?.getElementById("ezedox_main_container")?.addEventListener("resize", resizeListener)
        document?.getElementById("Header_container")?.addEventListener("resize", heightResizeListener)

        return () => {
            document.getElementById("ezedox_main_container").removeEventListener("resize", resizeListener)
            document.getElementById("Header_container").removeEventListener("resize", heightResizeListener)
        }
    }, [])
    
    return (
        <div 
            id="spinner_loader" 
            className="busy_loader"
            style={{
                left: left+"px",
                top: (top - 16)+"px",
                width: document?.getElementById("ezedox_main_container")?.getBoundingClientRect()?.width,
                height: window.innerHeight - document?.getElementById("Header_container")?.getBoundingClientRect()?.height,
            }}
        >
            <img src={loader} alt="" />
        </div>
    )
};

export default Spinner;