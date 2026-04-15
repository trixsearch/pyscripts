import React from 'react';

const button = (props) => {
   return(
      <div className={props.buttonType}>
        <button className={props.button} 
        onClick={props.clicked}>{props.children}</button>
       </div>
   )
}

export default button;
