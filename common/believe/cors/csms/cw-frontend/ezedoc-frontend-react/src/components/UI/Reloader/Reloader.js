import React from 'react';

import classes from './Reloader.module.css'

export default function(props) {
    return (
        <div className={classes.reload} >
            {props.message} 
            &nbsp;
            {props.showReloadBtn 
                ? (
                    <span 
                        role='presentation'
                        onClick={props.clicked} 
                    >
                        Reload now
                    </span>
                ) : null
            }
        </div>
    )
}