import React from "react";

import Empty from "components/Empty";

import './DynamicTable.css';

const DynamicTable = (props) => {

    const {
        children,
        table_body_styles,
        table_body_classes,
        table_header_datas,
        table_extra_classes,
        isLoading,
        // paginationCount,
    } = props;

    let dynamicTableBodyStyles = null
    if(table_body_styles)
        dynamicTableBodyStyles = table_body_styles;
    else if(!children || !children.length) {
        dynamicTableBodyStyles = {'height': '150px'}
    } else
        dynamicTableBodyStyles = {'height': window.innerHeight - 232};
    
    if(isLoading) {
        dynamicTableBodyStyles = {'height': window.innerHeight - 232};
    }

    return (
        <>
        <table 
            className={`table ${table_extra_classes}`}
        >
            <thead>
                <tr>
                    {
                        table_header_datas.map((item, index) => (
                            <th 
                                className={item.classes}
                                key={`header_item_${index+1}`}
                            >
                                {item.label}
                            </th>
                        ))
                    }
                </tr>
            </thead>
            <tbody
                style={dynamicTableBodyStyles}
                className={table_body_classes}
            >
                {children}
            </tbody>
        </table>
        {(!children || !children.length) ? (
            <Empty isLoading={isLoading} style={{paddingBottom: window.innerHeight - 466}} />
        ) : (
            null
        )}
        </>
    )
}

DynamicTable.defaultProps = {
    isLoading: false,
    children: null,
    paginationCount: 0,
    table_body_classes: '',
    table_body_styles: null,
    table_extra_classes: '',
}

export default DynamicTable;
