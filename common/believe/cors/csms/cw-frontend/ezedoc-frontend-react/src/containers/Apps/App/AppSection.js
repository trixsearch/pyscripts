import React from "react";

const AppSection = (props) => {
    let classVar = (props.id === props.clicked) ? "app_category_card active" : "app_category_card outer_app_category";
    return (
        <div className={classVar} onClick={props.click} key={props.id}>
            <div className="app_category_inner_card">
                <p>
                    <span className={props.icon}/>
                </p>
                <p className="category_card_text">{props.name}</p>
            </div>
        </div>
    )
}


export default AppSection;





