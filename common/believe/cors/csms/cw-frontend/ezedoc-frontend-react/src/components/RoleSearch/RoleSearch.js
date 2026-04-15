import React, { useEffect, useState } from 'react';
import { Select } from 'antd';
import right from '../../assets/images/svg/right.svg';
import functionIcon from '../../assets/images/svg/folder.svg';

import styles from "./RoleSearch.module.css";
const { Option } = Select;

function RoleSearch(props) {
    const [defaultValue, setDefaultValue] = useState();

    const onSearch = (e) => props.onSearch(e);
    const onChange = (e) => props.onChange(props?.data[e]);

    const Tag = ({ parent, name }) => (
        <>
            <img src={functionIcon} height="12px" alt="right" className={styles.iconSize} />
            <span className="pl-2">
                {parent
                    ? (
                        <span>
                            {name}
                            <img src={right} height="12px" alt="right" className="mx-3" />
                        </span>
                    )
                    : <span className={styles.searchText}>{name}</span>}
            </span>
        </>
    );

    useEffect(() => setDefaultValue(props.defaultValue),[props.defaultValue]);

    return (
        <div className='roleSelect'>
            <Select
                key={defaultValue}
                showSearch
                placeholder={props.label}
                optionFilterProp="children"
                className={styles.jobRoleSelect}
                onChange={onChange}
                onSearch={onSearch}
                allowClear
                showArrow={false}
                filterOption={false}
                onClear={() => setDefaultValue(null)}
                defaultValue={defaultValue? <Tag parent={false} name={defaultValue} /> : null}
                notFoundContent={null}
            >
                {props.data?.map((item, i) => (

                    <Option key={i} className={styles.iconStyle}>
                        {
                            item.map((ser, index) => (<Tag parent={index !== (item.length - 1)} name={ser.name} />))
                        }
                    </Option>
                ))}
            </Select>
        </div>
    )
}

export default RoleSearch;
