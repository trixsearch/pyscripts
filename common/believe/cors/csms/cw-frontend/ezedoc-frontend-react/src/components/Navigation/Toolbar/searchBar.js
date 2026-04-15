/* eslint-disable react-hooks/exhaustive-deps */

import React, {useState, useEffect} from "react";
import { connect } from "react-redux";
import { useHistory, useParams } from "react-router-dom";

import FilterDropdown from "components/UI/FilterDropdown/FilterDropdown";
import {
        updateSearchData, searchTask, getAllTaskCount, 
        getFilterTask, getAllTaskPersist, clearSearch, clearTaskSearch,
        setListsSearch, clearListSearch,
        searchAdvList, clearAdvListSearch,
        setBgvSearch, clearBgvSearch,
    } from "../../../store/actions/index";
import {
        ENTITY_NAME, 
        ENTITY_PHONE_NUMBER,
    } from "../../../Data/constants";
import { addToast } from '../../Toast/actions';
import { getDebugText, isMobile } from '../../../containers/utils';

import "../../../assets/img_font/style.css";
import { COMPLETED_TASKS, GROUP_TASKS, MY_TASKS } from "../../../containers/Tasks/TaskConstants";

const SearchBar = (props) => {
    
    const [searchElement, setSearchElement] = useState("");
    const [showCancelSearch, setCancelSearch] = useState(false);
    const [isInputFocus, setInputFocus] = useState(false);

    const [process_search_by, set_process_search_by] = useState("");

    // all props
    const {
        pathName,
        process,
        showSearchBar,
        task,
        processData,
    } = props;

    const { uuid: orgId } = useParams();
    const history = useHistory();

    // This useEffect works only 'showSearchBar' data changes
    useEffect(() => {
        setCancelSearch(processData.searchData)
        
        /* 
            Cause >>> Do a search on Process page, go to any other page and return back to Process page, 
            you can see the clear search icon on searchbar without searchData.
            Here you can click the clear icon it will lead to unnecessary rendering & execution of xhr calls.
        */

        // Solution >>> Setting false to show the clear search icon to avoid that unnecessary behaviour
    }, [showSearchBar])

    const showProcessSearchBy = (/\/process\/*/).test(pathName);

    let searchFieldsList = [];

    if (showProcessSearchBy) {
      if (process && process.process_search_list) {
        try {
           searchFieldsList = Object.keys(process.process_search_list).map(item => {
                return {
                    id: item,
                    name: process.process_search_list[item]
                }
            });
        } catch(e) {
            searchFieldsList = [];
        }
      } else {
          searchFieldsList = [];
      }
      if (searchFieldsList.length && !process_search_by) {
        set_process_search_by(searchFieldsList[0]);
      }
    }

    const isEmailSearch = false
    const isPhoneNumberSearch = pathName === "/tasks";
    /* for tasks search on Name or Phone Number.
    for other config item search on Name and for Process search on dropdown values */
    
    let placeHolderText = "";
    if (showSearchBar) {
        placeHolderText = "Search by ";
        if(isEmailSearch) {
            placeHolderText += "Email Id"; 
        } else if(searchFieldsList.length) {
            if(showProcessSearchBy) {
                placeHolderText += process_search_by.name; 
            }
        } else if (isPhoneNumberSearch) {
            placeHolderText += "Name or Phone Number";
        }else {
            placeHolderText += "Name";
        }
    }

    const onChange = (event) => {
        event.preventDefault();
        setCancelSearch(true)
        setSearchElement(event.target.value);
    }

    // useEffect(() => {
    //     if(pathName === "/tasks" && task.searchedData) {
    //         let data = task.searchedData.value
    //         setSearchElement(data.substring(1, (data.length) - 1));
    //         setCancelSearch(true);
    //     } else {
    //         setSearchElement("");
    //     }
    // },[
    //     props.process, 
    //     props.task.taskType, 
    //     props.task.processKey, 
    //     pathName, 
    //     props.task.taskTitle, 
    //     task.searchedData,
    // ])

    useEffect(() => {
        if(pathName === "/tasks" ) {
            setSearchElement(searchElement);
            setCancelSearch(true);
        } else {
            setSearchElement("");
        }
    },[
        props.process, 
        props.task.taskType, 
        props.task.processKey, 
        pathName, 
        props.task.taskTitle, 
        task.searchedData,
    ])

    const validateEmail = (email) => {
        let re = /\S+@\S+\.\S+/;
        return re.test(email);
    }

    const getElementType = (item) => {
        const isEmail = validateEmail(item);
        if (isEmail) {
            return "email";
        }
        // eslint-disable-next-line no-restricted-globals
        let elementType = isNaN(searchElement) ? ENTITY_NAME : ENTITY_PHONE_NUMBER;
        return elementType;
    }

    const search = (event) => {
        window.sendEvent("Hire_Search_task")
        
        event.preventDefault();
        let minSearchWordLength = 3;
        if(searchElement.length >= minSearchWordLength) {
            const elementType = getElementType(searchElement);
            if(props.pathName === "/process") {
                let searchData = {
                    "name"      : process_search_by.id,
                    "value"     : `%${searchElement}%`
                }
                history.push({
                    pathname: `/custom-workflow/org/${orgId}/process`,
                    search : `?process_key=${props.processKey}&processType=${props.processType}&page=${1}&size=${props.pageSize}${getDebugText()}`
                })
                props.updateSearchData(searchData)
            } else if(props.pathName === "/tasks") {
                if (elementType !== "email") {
                    const {
                        processKey, taskType, filterByValue, size
                    } = props.task;

                    let searchData = {
                        "name"      : elementType,
                        "value"     : `%${searchElement}%`
                    }
                    props?.onChange?.(searchData);
                    const CURRENT_SORT= JSON.parse(localStorage.getItem("TASK_FILTER_BY_SORT")) || "createTime";
                    const CURRENT_ORDER= JSON.parse(localStorage.getItem("TASK_FILTER_BY_ORDER")) || "asc"; 
                    localStorage.setItem("CURRENT_TASK_PAGE", JSON.stringify(1));
                    let order = CURRENT_ORDER;
                    let sort = CURRENT_SORT;
                    let page = 1
                    let task_type = taskType
                    task_type = taskType.split("@")
                    history.push({
                        pathname: `/custom-workflow/org/${orgId}/tasks`,
                        search : `?taskType=${task_type[0]}&page=${page}&size=${size}`
                    })
                }
            } else if(props.pathName === "/bgv") {
                props.setBgvSearch(searchElement);
            }
             // Making the search bar blur(unfocus) inorder to hide the keyboard immediately
            document.activeElement.blur();
        } else {
            props.addToast('error', 'Error', 'Please enter more than 3 characters.')
        }
    }

    const clearSearchData = () => {
        setSearchElement("");
        setCancelSearch(false);
        props.clearSearchResult();
        props.clearTaskSearch();
        props.clearBgvSearch();
        if(props.pathName === "/process") {
            history.push({
                pathname: `/custom-workflow/org/${orgId}/process`,
                search : `?process_key=${props.processKey}&processType=${props.processType}&page=${1}&size=${props.pageSize}${getDebugText()}`
            })
            props.updateSearchData(null)
        }else if(props.pathName === "/tasks") {
            const {
                taskType, filterByValue, size
            } = props.task;
            const CURRENT_SORT= JSON.parse(localStorage.getItem("TASK_FILTER_BY_SORT")) || "createTime";
            const CURRENT_ORDER = JSON.parse(localStorage.getItem("TASK_FILTER_BY_ORDER")) || "desc";
            localStorage.setItem("CURRENT_TASK_PAGE", JSON.stringify(1));
            let order = CURRENT_ORDER;
            let sort = CURRENT_SORT;
            let page=1
            let task_type = taskType
            task_type = taskType.split("@")
            history.push({
                pathname: `/custom-workflow/org/${orgId}/tasks`,
                search : `?taskType=${task_type[0]}&page=${page}&size=${size}`
            })
        }else {
            // TODO: Nothing
        }
    }

    const handleSearchBy = (value) => {
        if(searchFieldsList.length) {
         let [filteredItem] = searchFieldsList.filter(item => (item.id === value));
         if(filteredItem) {
            if(showProcessSearchBy) {
                set_process_search_by(filteredItem);
            }
         }
        }
    }

    const handleInputFocus = () => {
        setInputFocus(true)
    }

    const handleInputBlur = () => {
        setInputFocus(false)
    }

    let SearchBySelectedItem = null;

    if(showProcessSearchBy) {
        SearchBySelectedItem = process_search_by.name
    }

    return (
        <div className="search_input">
            {(props.showSearchBar) ? (
                    <form className={`form-inline mt-2 mt-md-0 mr-auto input_search_form_cont ${searchElement ? `input_search_form_cont_persist`: ``}`} onSubmit={search}>
                        <span className="input_search_cont">
                            <span style={{color: '#999999', display: !isInputFocus ? 'block' : 'none'}}>
                                <i className="icon-search"/>
                            </span>
                            {!!searchFieldsList.length && showProcessSearchBy && (
                                <div 
                                    className="entity_search_by" 
                                    style={{ width: !isInputFocus ? '33%' : '26%'}}
                                >
                                    <FilterDropdown
                                        list={searchFieldsList}
                                        classes='entity_search_by_no_border'
                                        selectedItem={SearchBySelectedItem}
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
                            onClick={()=>{
                            clearSearchData()
                            props.clearSearchData()
                            }} 
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

const mapStateToProps = (state) => ({
  processData: state.process,
  processKey: state.process.process_key,
  processType: state.process.processType,
  process: state.process.appData,
  pageSize: state.process.size,
  searchCount: state.process.searchCount,
  task: state.task,
  selectedOption: state.process.selectedOption,
  processStateFilter: state.process.processStateFilter,
});

const mapDispatchToProps = {
  addToast,
  searchTask,
  setListsSearch,
  getFilterTask,
  searchAdvList,
  clearTaskSearch,
  updateSearchData,
  getAllTaskPersist,
  clearAdvListSearch,
  clearSearchResult: clearSearch,
  getSearchedTaskCount: getAllTaskCount,
  clearListSearchResult: clearListSearch,
  setBgvSearch,
  clearBgvSearch,
};

export default connect(mapStateToProps, mapDispatchToProps)(SearchBar);
