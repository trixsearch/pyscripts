import React from "react"
import styles from './entityFilter.module.scss'
import FilterDropdown from "../../../components/UI/FilterDropdown/FilterDropdown"
import { filters } from "../entity"
export const EntityFilter = (props) => {

    const {
        handleSearch,
        setFilteredData,
        data,
        setFilterName,
        filterName,
        setSearchKey,
        searchKey,
        employeeAlias
    } = props
    const modifiedFilters =filters.map((filter)=>{
        switch(filter.id){
            case 'employeeId':
                return{...filter, name:(`${employeeAlias} ID`).toUpperCase()}
        }
        return filter
    })
    
    return (
        <div className={styles.entityFilter}>
            <div className={styles['entityFilter__search']}>
                <span className="icon-search" style={{ color: "#999999" }} />
                <input
                    placeholder='Search'
                    type="text"
                    className={styles['entityFilter__search__input']}
                    onChange={(e) => setSearchKey(e.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && handleSearch(searchKey)}
                    value={searchKey}
                />
                {searchKey && <span onClick={() => { setSearchKey(''); setFilteredData(data) }} className={styles['entityFilter__search__close']}>X</span>}
            </div>
            <div className={styles["entityFilter__filter"]}>
                <div>
                    <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#505766', marginRight: '10px' }}>Search by:</span>
                    <FilterDropdown
                        list={filters}
                        disableComponent={true}
                        selectedItem={modifiedFilters?.[0].name}
                    // onItemClickHandler={handleFilterChange}
                    />
                </div>
                <div>
                    <button
                        type='button'
                        className='fancy_btn active'
                        disabled={true}
                        style={{
                            padding: '9px 20px',
                            minWidth: 'unset',
                            fontSize: '14px',
                            fontWeight: '400px'
                        }}
                    >
                        Filter
                    </button>
                </div>
            </div>
        </div>
    )
}