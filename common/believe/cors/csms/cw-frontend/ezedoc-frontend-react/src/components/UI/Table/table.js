import React from "react";
import { NavLink } from "react-router-dom";
import "./table.css"
// table_header contains structure of  the body
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
const table = (props) => {

    return (
            <>
               <thead>
                    <tr>
                        {props.table_header.map((e)=>{
                            return (
                                <th className={e.class}>
                                    <div className="table_header"> 
                                        <div>
                                            {e.name}
                                        </div>
                                        {e.search ?
                                        <TableExtra descendingOrder={props.descendingOrder}
                                        ascendingOrder ={props.ascendingOrder}
                                        value ={e.key}
                                        type = {props.type}
                                        name = {props.name} /> : <div/>}
                                    </div>
                                </th>
                            )
                            
                        })}
                    </tr>
                </thead>
            </>
    )
}
export default table;

const TableExtra = (props) => {
    if(props.name === props.value){
        if(props.type === true){
            return ( 
                <div className="icon_set">
                    {/* <i onClick={() => props.descendingOrder(props.value)} class="glyphicon glyphicon-triangle-top icon_control"></i> */}
                    <i onClick={() => props.descendingOrder(props.value)} class="glyphicon glyphicon-triangle-top icon_control"></i>
                </div>
            )
        }else{
            return ( 
                <div className="icon_set">
                    {/* <i onClick={() => props.descendingOrder(props.value)} class="glyphicon glyphicon-triangle-top icon_control"></i> */}
                    <i onClick={() => props.ascendingOrder(props.value)}class="glyphicon glyphicon-triangle-bottom icon_control"></i>
                </div>
            )
        }
       
    }else{
        return ( 
            <div className="icon_set">
                <i onClick={() => props.descendingOrder(props.value)} class="glyphicon glyphicon-triangle-top icon_control"></i>
                {/* <i onClick={() => props.ascendingOrder(prop.value)}class="glyphicon glyphicon-triangle-bottom icon_control"></i> */}
            </div>
        )
    }
    

}