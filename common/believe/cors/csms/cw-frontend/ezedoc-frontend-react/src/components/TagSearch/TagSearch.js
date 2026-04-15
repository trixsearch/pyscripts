import React, { useEffect, useState } from "react";
import { Select } from "antd";
import right from "../../assets/images/svg/right.svg";
import functionIcon from "../../assets/images/svg/folder.svg";
import { SearchOutlined } from "@ant-design/icons";
import "antd/dist/antd.css"; // or 'antd/dist/antd.less'

import styles from "./TagSearch.module.css";
const { Option } = Select;

function TagSearch(props) {
    const [defaultValue, setDefaultValue] = useState(props?.defaultValue);

    const onSearch = (e) => props.onSearch(e);

    const handleChange = (value, option) => {
        props.setSelectedValue && props.setSelectedValue((currentData) => ({ ...currentData, name: option?.label, id: value, type: option?.type }));
        setDefaultValue(value)
        props.onChange({ name: option?.label, id: value, type: option?.type });
    };

    useEffect(() => {
        setDefaultValue(props.defaultValue)
    }, [props.defaultValue])

    const Tag = ({ parent, name }) => (
        <>
            <img
                src={functionIcon}
                height="12px"
                alt="right"
                className={styles.iconSize}
            />
            <span className="pl-2">
                {parent ? (
                    <span>
                        {name}
                        <img src={right} height="12px" alt="right" className="mx-3" />
                    </span>
                ) : (
                    <span className={styles.searchText}>{name}</span>
                )}
            </span>
        </>
    );

    const handleClear = () => {
        if (props?.setSelectedValue) {
            props.setSelectedValue((currentData) => ({
                ...currentData,
                name: "",
            }))
        } else {
            setDefaultValue('')
        }
    }

    return (
        <div className="roleSelect">
            <Select
                key={defaultValue}
                showSearch
                placeholder={props.label}
                className={props.className}
                optionFilterProp="children"
                onChange={handleChange}
                onSearch={onSearch}
                size={props.size || "medium"}
                allowClear
                disabled={props.disabled}
                filterOption={false}
                suffixIcon={() => <SearchOutlined />}
                onClear={handleClear}
                value={defaultValue}
                notFoundContent={null}
                optionLabelProp="label"
            >
                {props.data?.map(
                    (item, i) =>
                        item.length >= 1 && (
                            <Option key={item.slice(-1)[0].uuid} label={item.slice(-1)[0].name} className={styles.iconStyle} type={item.slice(-1)[0]?.type}>
                                {item.map((ser, index) => (
                                    <Tag parent={index !== item.length - 1} name={ser.name} />
                                ))}
                            </Option>
                        )
                )}
            </Select>
        </div>
    );
}

export default TagSearch;
