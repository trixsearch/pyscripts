import React from 'react'

const TickCross = (value) => {
    let typeofValue = typeof value;
  
    if(typeofValue === 'boolean') {
      return value ? <span>&#10004;</span> : <span>&#10008;</span>
    }
    return value || '-';
}

export default TickCross;
