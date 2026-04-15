import React from "react";
import { NavLink } from "react-router-dom";
import "./table.css"
// table_header contains structure of  the header
// table_body contains structure of the body
// key values is used to match the table_body structure
// name is used to display the name of the field 
// table_header : [
//     {
//         name : "Item",
//         key  : "label",
//         class : "col-xs-3",
//     },
//     {
//     {
//         name : "Action",
//         key : "button",
//         class : "col-xs-2",
//     }
// ] 

const tableBody = (props) => {
    // const {name, Type, label,available, description,id} = props.inventory
    return (
            <>
               <tbody>
                        {props.table_body.map((e) =>
                            <tr>
                                {props.table_header.map((d)=>{
                                    return (
                                        <TableExtra url={props.url} id = {e.id} class={d.class} value={e[d.key]} type={d.key}/>
                                    )
                                })}
                            </tr> 
                        )}    
                 
                </tbody>
            </>
    )
}


const TableExtra = (props) =>  {
    if(props.type === "button") { 
        return ( 
            <td className={props.class}>
                <NavLink to={`${props.url}${props.id}`}>
                    <button className="table_btn edit">
                        <span>Add Stock</span>
                    </button>
                </NavLink>
            </td>
        )
    }
    else {
        return ( 
            <>
                <td className={props.class}>{props.value}</td>
           </>
      )
    }
 

}

export default tableBody;



