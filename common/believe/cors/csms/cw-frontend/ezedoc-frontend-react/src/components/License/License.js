import React from 'react';

import classes from './License.module.css';

function License({children, feature}) {

    if (feature) {
        return (
            <React.Fragment>{children}</React.Fragment>
        )
    }    
    return (
        <React.Fragment>
            <div className={classes.license} >
                <div className={classes.contact}>
                    <div>
                        <span className={`icon-premium ${classes.premium}`} />
                    </div>
                    <div>
                        This is a premium feature and has not been enabled for your organisation.
                        Contact 
                        <a href={`mailto:${process.env.REACT_APP_SUPPORT}?Subject=License%20Upgrade`} target="_top">{` ${process.env.REACT_APP_SUPPORT}`}</a>
                    </div>
                </div>
            </div>
            <div className={classes.blur}>
                {children}
            </div>
        </React.Fragment>
    )
}

export default License