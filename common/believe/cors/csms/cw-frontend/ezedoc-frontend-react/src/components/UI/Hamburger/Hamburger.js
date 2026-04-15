import React from 'react';

const Hamburger = ({ clickFunc, isOpen }) => (
    <span 
        role="presentation" 
        onClick={() => clickFunc()} 
        style={{fontSize: 20, cursor: 'pointer'}}
        className={isOpen ? 'icon-hamburger_close': 'icon-hamburger_open'} 
    />
)

export default Hamburger;