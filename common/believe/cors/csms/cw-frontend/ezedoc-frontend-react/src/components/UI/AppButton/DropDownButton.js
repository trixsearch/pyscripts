import React from 'react';
import './style.css';

const DropDownButton = (props) => {
    let children = null;
    if (Array.isArray(props.children)) {
        children = props.children.filter(item => item);
    }else {
        children = [props.children]
    }

    return (
        <div id="dropdownButton" className="dropdown btnDropdown" style={{display: 'flex', marginLeft: 10}}>
            {props.defaultButtonCondition && (
                <button
                    type="button"
                    className="fancy_btn active"
                    onClick={props.handleClick}
                    style={
                        children.length > 0
                            ? {
                                borderTopLeftRadius: 4,
                                borderTopRightRadius: 0,
                                borderBottomLeftRadius: 4,
                                borderBottomRightRadius: 0,
                                paddingTop: 9
                            }
                            : {
                                paddingTop: 9
                            }
                    }
                >
                    <span>{props.defaultButtonName}</span>
                </button>
            )}
            {
                children && children.length > 0 && (
                    <>
                        <button
                            type="button"
                            className="drop-down-btn btn btn-default dropdown-toggle text-white"
                            data-toggle="dropdown"
                            aria-haspopup="true"
                            aria-expanded="false"
                        >
                            <span className="caret actions-caret" style={{ color: '#fff' }} />
                        </button>
                        <ul className={`dropdown-menu ${!props.defaultButtonCondition && 'dropdown-menu-children'}`}>
                            {children}
                        </ul>
                    </>
                )
            }
        </div>
    )
}

export default DropDownButton;
