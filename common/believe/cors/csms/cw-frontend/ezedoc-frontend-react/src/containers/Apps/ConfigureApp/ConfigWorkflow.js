import React from 'react';

import ConfigureApp from './ConfigureApp';

const ConfigWorkflow = (props) => {
    return (
        <div>
            <div className="main_changable_container">
                {/* <Designer /> */}
                <ConfigureApp id={props.match.params.id} />
            </div>
        </div>
    )
}

export default ConfigWorkflow;