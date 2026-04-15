import React from "react";
import Pagination from "react-js-pagination";
import { isMobile } from "containers/utils";
import "./Pagination.css";

/**
 * This is the old implementation of pagination 
 * this is still being used , in tasks and process page, 
 * untill those are ready for refactor, this implementation will exist.
 * 
 * After refactor, this implementation can be removed in favour of new 
 * implementation in Pagination.js
 */

const EzedoxPagination = (props) => {
  let pageRangeDisplayed = 5;
  let itemsCountPerPage = 10;
  if (props.itemsCountPerPage) {
    itemsCountPerPage = props.itemsCountPerPage;
  }

  const lastPage = Math.ceil(props.taskCount / itemsCountPerPage);
  const from = props.active * itemsCountPerPage - itemsCountPerPage + 1;
  let to = props.active * itemsCountPerPage;

  if (props.active === lastPage) {
    to = props.taskCount;
  }

  return (
    <div className="entity-list-count-text">
      {!!props.taskCount && (
        <p>{`Showing ${from} to ${to} of ${props.taskCount} entries`}</p>
      )}
      {props.taskCount > itemsCountPerPage && (
        <div className="pagination_container">
          <Pagination
            itemClass="page-item"
            linkClass="page-link"
            activePage={props.active}
            itemsCountPerPage={itemsCountPerPage}
            totalItemsCount={props.taskCount}
            pageRangeDisplayed={pageRangeDisplayed}
            onChange={props.handlePageChange}
            prevPageText="&lt;"
            firstPageText="&lt;&lt;"
            nextPageText="&gt;"
            lastPageText="&gt;&gt;"
            itemClassFirst={isMobile() ? 'mobile-visible' : ''}
            itemClassPrev={isMobile() ? 'mobile-visible' : ''}
            itemClassNext={isMobile() ? 'mobile-visible' : ''}
            itemClassLast={isMobile() ? 'mobile-visible' : ''}
          />
        </div>
      )}
    </div>
  );
};

export default EzedoxPagination;
