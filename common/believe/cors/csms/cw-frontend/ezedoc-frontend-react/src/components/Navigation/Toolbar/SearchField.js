/* eslint-disable react-hooks/exhaustive-deps */

import React, {useState, useEffect} from "react";
import { useDispatch } from "react-redux";

import FilterDropdown from "components/UI/FilterDropdown/FilterDropdown";
import {
        ENTITY_NAME, 
        ENTITY_PHONE_NUMBER,
    } from "../../../Data/constants";
import { addToast } from '../../Toast/actions';
import { isMobile } from '../../../containers/utils';

import "../../../assets/img_font/style.css";

const SearchField = ({
    showSearchBar = false,
    searchFieldsList = [], // [{ name: "Name", id: "entity_name" }] example how to create searchFieldsList
    onSearchChange = () => {},
    isLocalSearch = false,
    onClearSearchData = () => {},
    showSearchByFields = false,
    placeholderText = "Search by ",
}) => {
    
    const [searchElement, setSearchElement] = useState("");
    const [showCancelSearch, setCancelSearch] = useState(false);
    const [isInputFocus, setInputFocus] = useState(false);
    const [searchByselectedItem, setSearchBySelectedItem] = useState("");
    const dispatch = useDispatch();
    
    let placeHolderText = "";
    if (showSearchBar) {
        placeHolderText = "Search by ";
        if(searchFieldsList.length && showSearchByFields) {
            placeHolderText += searchByselectedItem?.name; 
        } else if(!showSearchByFields) {
            placeHolderText = placeholderText;
        }
    }

    const onChange = (event) => {
        event.preventDefault();
        setCancelSearch(true)
        setSearchElement(event.target.value);
        if(isLocalSearch){
            onSearchChange(event.target.value)
        }
    }

    useEffect(() => {
        if(showSearchByFields && searchFieldsList?.length && !searchByselectedItem){
            setSearchBySelectedItem(searchFieldsList[0]);
        }
    },[
        searchFieldsList,
        showSearchByFields,
        searchByselectedItem
    ])

    useEffect(() => {
        setSearchElement("");
    },[
        isLocalSearch
    ])

    const validateEmail = (email) => {
        let re = /\S+@\S+\.\S+/;
        return re.test(email);
    }

    const getElementType = (item) => {
        if(showSearchByFields){
            return searchByselectedItem?.id;
        }
        if (validateEmail(item)) {
            return "email";
        }
        
        return isNaN(searchElement) ? ENTITY_NAME : ENTITY_PHONE_NUMBER;
    }

    const search = (event) => {
        window.sendEvent("CW_Search_task")
        
        event.preventDefault();
        if(isLocalSearch){
            return;
        }
        let minSearchWordLength = 3;
        if(searchElement.length >= minSearchWordLength) {
            const elementType = getElementType(searchElement);
            let searchData = {
                "name"      : elementType,
                "value"     : `%${searchElement}%`
            }
            if(onSearchChange){
                onSearchChange(searchData);
            }
             // Making the search bar blur(unfocus) inorder to hide the keyboard immediately
            document.activeElement.blur();
        } else {
            dispatch(addToast('error', 'Error', 'Please enter more than 3 characters.'));
        }
    }

    const clearSearchData = () => {
        setSearchElement("");
        setCancelSearch(false);
        onClearSearchData();
    }

    const handleSearchBy = (value) => {
        if(searchFieldsList.length) {
            setSearchBySelectedItem(searchFieldsList.find(item => (item.id === value)));
        }
    }

    const handleInputFocus = () => {
        setInputFocus(true)
    }

    const handleInputBlur = () => {
        setInputFocus(false)
    }

    return (
        <div className="search_input">
            {showSearchBar ? (
                    <form className={`form-inline mt-2 mt-md-0 mr-auto input_search_form_cont ${searchElement ? `input_search_form_cont_persist`: ``}`} onSubmit={search}>
                        <span className="input_search_cont">
                            <span style={{color: '#999999', display: !isInputFocus ? 'block' : 'none'}}>
                                <i className="icon-search"/>
                            </span>
                            {!!searchFieldsList.length && showSearchByFields && (
                                <div 
                                    className="entity_search_by" 
                                    style={{ width: !isInputFocus ? '33%' : '26%'}}
                                >
                                    <FilterDropdown
                                        list={searchFieldsList}
                                        classes='entity_search_by_no_border'
                                        selectedItem={searchByselectedItem?.name}
                                        onItemClickHandler={handleSearchBy}
                                    />
                                </div>
                            )}
                            <span className="input_search_span">
                                <input 
                                    className="form-control mr-sm-2" 
                                    type="text" 
                                    placeholder={placeHolderText} 
                                    aria-label="Search" 
                                    value={searchElement}
                                    onChange={onChange}
                                    onBlur={isMobile() ? () => handleInputBlur() : () => {}}
                                    onFocus={isMobile() ? () => handleInputFocus() : () => {}}
                                />
                            </span>
                            <span
                            style={{color:"#999999", fontSize: "10px"}} 
                            onClick={clearSearchData} 
                            role="presentation"
                            >
                                {showCancelSearch ? <i className="icon-close"/> : null}
                            </span>
                        </span>
                    </form>
            ):null}
        </div>
    )
}

export default SearchField;
