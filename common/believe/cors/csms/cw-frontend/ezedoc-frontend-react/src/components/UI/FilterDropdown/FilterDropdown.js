import React, { useEffect, useRef, useState } from 'react';
import './FilterDropdown.css';
import { isMobile, getTaskName } from '../../../containers/utils';

function SubFilter({
    hoverPopupMenuClosed, item, subMenuList,
    onItemClickHandler3, onItemClickHandler4, icon, subFilterpos = '157', onMouseLeave = () => { }, classes = ''
}) {

    const clickHandler = (event, subList) => {
        if (onItemClickHandler3) {
            onItemClickHandler3(event, item.process_key, item.name, item.icon_class, subList)
        } else {
            onItemClickHandler4(event, item.process_key, item.name, item.id, subList)
        }
    }

    return (
        <ul
            onMouseLeave={() => (classes === 'workflow_dropdown_taskPage' ? onMouseLeave() : null)}
            style={{ top: `${classes === 'workflow_dropdown_taskPage' ? (subFilterpos - 125) + 'px' : null}`, zIndex: '1000', visibility: `${hoverPopupMenuClosed === true ? 'hidden' : 'visible'}` }}
            id={item?.id + 'sub_list'}
            className={`${hoverPopupMenuClosed !== true ? "sub_list filter_dropdown_menu" : 'hoverPopupMenuClosed filter_dropdown_menu'}`}>
            {subMenuList && Array.isArray(subMenuList)
                && subMenuList.map(subList => (
                    <li
                        key={subList}
                        role="presentation"
                        style={{ position: 'relative' }}
                        className="dropdown-item filter_dropdown_item"
                        onClick={(event) => clickHandler(event, subList)}
                    >
                        <span className={icon} />&nbsp;
                        <span className='filter_dropdown_item_name'>
                        { getTaskName(subList) }
                        </span>
                    </li>
                ))}
        </ul>
    )
}

const setClassNameIfDropDownPresent = (isPresent) => `${isPresent ? '_withDropDownIcon' : ''}`

const setSelectedItemClassName = (selectedItem, splitButtonData, dropDownIconName) => {
    if (selectedItem !== "All Workflows") {
        return splitButtonData ? `filter_button_text_split_withIcon${setClassNameIfDropDownPresent(dropDownIconName)}` : `filter_button_text_withIcon${setClassNameIfDropDownPresent(dropDownIconName)}`
    }
    return splitButtonData ? `filter_button_text_split${setClassNameIfDropDownPresent(dropDownIconName)}` : `filter_button_text${setClassNameIfDropDownPresent(dropDownIconName)}`
}

const setDropdownExtraClassName = (selectedItemIconName, selectedItem) => {
    return selectedItemIconName && selectedItem && selectedItem !== "All Workflows" ? 'filter_dropdown_button_withIcon' : 'filter_dropdown_button_noIcon'
}

const setOnClickHandler = (classes, item, onItemClickHandler, onItemClickHandler2) => {
    if (classes === 'workflow_dropdown_taskPage') return item.id === 'all_workflows' ? onItemClickHandler(item.name) : onItemClickHandler2(item.process_key, item.name, item.icon_class)
    if (classes === 'attachments_dropdown_taskPage') return onItemClickHandler(item.url, item.type, item.id)
    return (classes === 'workflow_dropdown_processPage' || classes === 'config_view_workflow_dropdown') ? onItemClickHandler(item.name, item.process_key, item.id) : onItemClickHandler(item.id)
}

const FilterDropdown = ({
    list,
    classes,
    selectedItem,
    splitButtonData,
    disableComponent,
    dropDownIconName,
    onItemClickHandler,
    onItemClickHandler2,
    onItemClickHandler3,
    onItemClickHandler4,
    selectedItemIconName,
    splitIconClickHandler,
    onMouseEnter,
    tasksTitle,
    onMouseLeave,
    hoverPopupMenuClosed,
    hoverId,
    isDisableSplitButton,
    showSearch = false
}) => {
    let subMenuTask = {}
    let subMenuTaskList = {}
    if (tasksTitle) {
        subMenuTask = tasksTitle.filter(task => Object.keys(task)[0] === hoverId)[0]
        if (subMenuTask) {
            subMenuTaskList = Object.values(subMenuTask)[0]
        }
    }

    const [subFilterpos, setSubFilterpos] = useState();
    const [taskData, setTaskData] = useState()
    const [searchValue, setSearchValue] = useState();
    const [filterList, setFilterList] = useState(list);
    const divRef = useRef(null);
    const handleCloseEvent = () => {
        if (!divRef?.current?.classList?.value?.includes('show')) {
            hoverPopupMenuClosed !== true && onMouseLeave()
        }
    }

    useEffect(() => {
        if (list && !searchValue) {
            setFilterList(list)
        }
    }, [list])

    useEffect(() => {
        if (searchValue) {
            const data = list?.filter(item => item?.name?.toLowerCase()?.includes(searchValue?.toLowerCase()))
            setFilterList(data)
        }
        else setFilterList(list)
    }, [searchValue])

    const handleSearchChange = (e) => {
        setSearchValue(e?.target?.value)
    }

    useEffect(() => {
        classes === 'workflow_dropdown_taskPage' && document.addEventListener('click', handleCloseEvent);
        return () => {
            document.removeEventListener('click', handleCloseEvent);
        };
    }, [])
    return (
        <div className={`dropdown btn-group filter_dropdown ${classes} `}>
            <div
                aria-haspopup="true"
                aria-expanded="false"
                data-toggle="dropdown"
                id="dropdownMenuButton"
                className={`btn dropdown-toggle filter_dropdown_button ${disableComponent ? 'disabled' : ''} ${splitButtonData ? 'filter_dropdown_button_shortened' : ''} ${isMobile() ? setDropdownExtraClassName(selectedItemIconName, selectedItem) : ''} ${showSearch ? 'filter_dropdown_workflow' : ''}`}
            >
                {dropDownIconName ? (<span className={`dropdown_icon ${dropDownIconName} ${showSearch ? 'workflow_selected_icon' : ''}`} />) : null}
                {selectedItemIconName && selectedItem && selectedItem !== "All Workflows" ? (
                    <span
                        data-attr={selectedItem}
                        className={`workflow_selected_icon ${selectedItemIconName}`}
                    />
                ) : null}
                <span className={`${selectedItemIconName && selectedItem && setSelectedItemClassName(selectedItem, splitButtonData, dropDownIconName)} overflow_text_controller  ${showSearch ? 'overflow_text_workflow' : ''}`}>
                    {selectedItem}
                </span>
                <span className="caret" />
            </div>
            <ul ref={divRef} className="dropdown-menu filter_dropdown_menu filter_dropdown_menu_main " aria-labelledby="dropdownMenuButton">
                {(showSearch && list?.length > 1) ? <span className="input_search_span">
                    <span style={{ color: '#999999' }}>
                        <i className="icon-search" />
                    </span>
                    <input
                        className="form-control mr-sm-2"
                        type="text"
                        placeholder='Search...'
                        aria-label="Search"
                        value={searchValue}
                        onChange={handleSearchChange}
                    />
                </span> : null}
                {
                    filterList
                    && Array.isArray(filterList)
                    && filterList.map(item => (
                        <li
                            key={item.id}
                            id={item.id}
                            role="presentation"
                            className="dropdown-item filter_dropdown_item"
                            onClick={() => {
                                setSearchValue('')
                                setOnClickHandler(classes, item, onItemClickHandler, onItemClickHandler2)
                            }}
                            onMouseOver={() => {
                                const element = document.getElementById(item?.id);
                                const rect = element.getBoundingClientRect();
                                setSubFilterpos(rect?.top)
                                setTaskData(item)
                            }}
                            onMouseEnter={() => ((classes === 'workflow_dropdown_taskPage' && item.id !== 'all_workflows') || classes === 'workflow_dropdown_processPage' ? onMouseEnter(item.id) : null)}
                            onMouseLeave={() => (classes === 'workflow_dropdown_processPage' ? onMouseLeave() : null)}
                        >
                            {(item.id !== 'all_workflows' && classes === 'workflow_dropdown_taskPage') || classes === 'workflow_dropdown_processPage'
                                ? (
                                    <>
                                        <span className="icon-apps dropdown-icon" />
                                    </>
                                ) : null}
                            <span className='filter_dropdown_item_name'>
                                {item.name}
                            </span>
                            {(item.process_state_list && item.process_state_list.length && Object.keys(subMenuTaskList).length)
                                || (item.id !== 'all_workflows' && classes === 'workflow_dropdown_taskPage')
                                ? <span className="leftArrow" />
                                : null}

                            {classes !== 'workflow_dropdown_taskPage' && subMenuTaskList && Object.keys(subMenuTaskList).length && item.id !== 'all_workflows'
                                ? (
                                    <SubFilter
                                        subMenuList={subMenuTaskList}
                                        hoverPopupMenuClosed={hoverPopupMenuClosed}
                                        item={item}
                                        icon="icon-task"
                                        onItemClickHandler3={onItemClickHandler3}
                                    />
                                )
                                : null}

                            {classes !== 'workflow_dropdown_taskPage' && item.process_state_list && item.process_state_list.length && Object.keys(subMenuTaskList).length === 0 && classes === 'workflow_dropdown_processPage'
                                ? (
                                    <SubFilter
                                        subMenuList={item.process_state_list}
                                        hoverPopupMenuClosed={hoverPopupMenuClosed}
                                        item={item}
                                        icon="icon-processState"
                                        onItemClickHandler4={onItemClickHandler4}
                                    />
                                )
                                : null}

                        </li>
                    ))
                }
            </ul>
            {classes === 'workflow_dropdown_taskPage' && subMenuTaskList && Object.keys(subMenuTaskList).length && taskData?.id !== 'all_workflows'
                ? (
                    <SubFilter
                        subMenuList={subMenuTaskList}
                        hoverPopupMenuClosed={hoverPopupMenuClosed}
                        item={taskData}
                        icon="icon-task"
                        onItemClickHandler3={onItemClickHandler3}
                        subFilterpos={subFilterpos}
                        onMouseLeave={onMouseLeave}
                        classes={classes}
                    />
                )
                : null}
            {splitButtonData ? (
                <button
                    type="button"
                    onClick={splitIconClickHandler}
                    disabled={isDisableSplitButton}
                    className="btn filter_dropdown_split_button"
                >
                    {splitButtonData}
                </button>
            ) : null}
        </div>
    )
}

FilterDropdown.defaultProps = {
    list: [],
    classes: '',
    selectedItem: '',
    dropDownIconName: '',
    splitButtonData: null,
    disableComponent: false,
    selectedItemIconName: '',
    isDisableSplitButton: false,
};

export default FilterDropdown;
