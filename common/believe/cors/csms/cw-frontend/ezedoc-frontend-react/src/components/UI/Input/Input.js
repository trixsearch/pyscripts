import React from "react";
import datatype from "../../../Data/Createdata";

import "./Input.css";

const Input = (props) => {
    let inputElement = null;
    let domainCheck = [];
    let classes = ["floating-input"];
    if (!props.domainAvailable && props.domainChecked) {
        domainCheck.push("checkmark")
    }
    if (props.domainAvailable && props.domainChecked) {
        domainCheck.push("close_box");
    }
    if (props.invalid && props.touched) {
        classes.push("Invalid")
    }

    switch (props.elementType) {
        case ("input"):
            inputElement = (
                <input
                    className={classes.join(" ")}
                    {...props.elementConfig}
                    value={props.value}
                    onChange={props.changed}
                    autoComplete="true" 
                />
            );
            break;
        case ("url"):
            inputElement = (
                <input
                    className={classes.join(" ")}
                    {...props.elementConfig}
                    value={props.value}
                    onChange={props.changed}
                    onBlur={props.checkDomain} 
                />
            );
            break;
        case ('select'):
            inputElement = (
                <select 
                    className="floating-select"
                    value={props.value}
                    defaultValue='none'
                    onChange={props.changed}
                >
                    <option disabled value='none'>Select {props.label}</option>
                    {props.elementConfig.options.map(option => (

                        <option key={option.value} value={option.value}>
                            {option.displayValue}
                        </option>
                    ))}
                </select>
            );
            break;
        case ('search'):

            inputElement = (
                <>

                    <input
                        className={classes.join(" ")}
                        {...props.elementConfig}
                        onKeyUp={props.CheckString}
                        value={props.value}
                        onChange={props.changed}
                    />

                    {props.elementConfig.options.length > 0 
                        ? (
                            <select 
                                className="floating-select select"
                                onClick={props.changed} 
                            >
                                {props.elementConfig.options.map(option => (
                                    <option key={option.id} value={option.email}>
                                        {option.email}
                                    </option>
                                ))}
                            </select>
                        )
                        : null
                    }
                </>

            );
            break;
        default:
            inputElement = null
    }


    let inputValue = null;

    if (props.elementType === "url") {
        inputValue = (
            <div className={props.floatLabel}>
                <div className="company_identifier">
                    {inputElement}
                    <label className="wrap">{props.label}</label>
                </div>
                <div className="ezedox_email_box">
                    <span>.{datatype.base_domain}</span>
                    <span className={domainCheck}/>
                </div>
            </div>
        )

    }
    else {
        inputValue = (
            <div className={props.floatLabel}>
                {inputElement}
                <label>{props.label}</label>
            </div>
        )
    }
    return (
        <>
            {inputValue}
        </>
    )

}

export default Input;
