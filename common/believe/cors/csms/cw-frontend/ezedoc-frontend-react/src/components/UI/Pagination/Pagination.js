/* eslint-disable react/no-array-index-key */
import React from "react";
import { NavLink } from "react-browser-router";
import PropTypes from "prop-types";

import "./Pagination.css";

const Pagination = (props) => {
  let {
    active,
    handlePageChange,
    itemsCountPerPage,
    taskCount,
    generateHref,
    range,
  } = props;

  const getPath = (pageNumber) => {
    /**
     * @param {Number} pageNumber Page Number
     */

    if (generateHref) {
      return generateHref(pageNumber);
    }

    if (pageNumber === 0) {
      return `${window.location.pathname.substring(4)}#`;
    }

    return `${window.location.pathname.substring(4)}?page=${pageNumber}`;
  };

  const RANGE = range || 5;
  const CURRENT_PAGE = Number(active);
  const ITEMS_PER_PAGE = itemsCountPerPage;
  const TOTAL_ITEMS = taskCount;

  const TOTAL_PAGES = Math.ceil(TOTAL_ITEMS / ITEMS_PER_PAGE);

  const pages = [];

  let MIN = CURRENT_PAGE - Math.floor(RANGE / 2);
  let MAX = CURRENT_PAGE + Math.floor(RANGE / 2);

  if (MIN < 1) {
    MIN = 1;
    MAX = RANGE;
  }

  if (MAX > TOTAL_PAGES) {
    MIN = TOTAL_PAGES - (RANGE - 1);
    MAX = TOTAL_PAGES;

    if (MIN < 1) {
      MIN = 1;
    }
  }

  for (let page = MIN; page <= MAX; page += 1) {
    pages.push(
      <li key={page} className="page-item">
        <NavLink
          className={
            CURRENT_PAGE === page ? "page-link active-page" : "page-link"
          }
          activeClassName="active-page"
          to={getPath(page)}
          isActive={() => page === Number(CURRENT_PAGE)}
          disabled={CURRENT_PAGE === page}
          onClick={
            CURRENT_PAGE !== page ? () => handlePageChange(page) : () => undefined
          }
        >
          {page}
        </NavLink>
      </li>
    );
  }

  const from = CURRENT_PAGE * ITEMS_PER_PAGE - ITEMS_PER_PAGE + 1;
  let to = CURRENT_PAGE * ITEMS_PER_PAGE;

  if (CURRENT_PAGE === TOTAL_PAGES) {
    to = TOTAL_ITEMS;
  }

  return (
    <nav className="pagination-container">
      {!!TOTAL_ITEMS && (
        <p>{`Showing ${from} to ${to} of ${props.taskCount} entries`}</p>
      )}
      {TOTAL_ITEMS > ITEMS_PER_PAGE && (
        <ul className="pagination">
          <li className="page-item">
            <NavLink
              className={
                CURRENT_PAGE === 1 ? "page-link-disabled" : "page-link"
              }
              to={getPath(1)}
              onClick={
                CURRENT_PAGE === 1 ? () => false : () => handlePageChange(1)
              }
            >
              <span>&lt;&lt;</span>
            </NavLink>
          </li>
          <li className="page-item">
            <NavLink
              className={
                CURRENT_PAGE === 1 ? "page-link-disabled" : "page-link"
              }
              to={CURRENT_PAGE === 1 ? getPath(1) : getPath(CURRENT_PAGE - 1)}
              onClick={
                CURRENT_PAGE !== 1
                  ? () => handlePageChange(CURRENT_PAGE - 1)
                  : () => false
              }
            >
              <span>&lt;</span>
            </NavLink>
          </li>
          {pages}
          <li className="page-item">
            <NavLink
              className={
                CURRENT_PAGE === TOTAL_PAGES
                  ? "page-link-disabled"
                  : "page-link"
              }
              to={
                CURRENT_PAGE === TOTAL_PAGES ? getPath(TOTAL_PAGES) : getPath(CURRENT_PAGE + 1)
              }
              onClick={
                CURRENT_PAGE === TOTAL_PAGES
                  ? () => false
                  : () => handlePageChange(CURRENT_PAGE + 1)
              }
            >
              <span>&gt;</span>
            </NavLink>
          </li>
          <li className="page-item">
            <NavLink
              className={
                CURRENT_PAGE === TOTAL_PAGES
                  ? "page-link-disabled"
                  : "page-link"
              }
              to={getPath(TOTAL_PAGES)}
              onClick={
                CURRENT_PAGE === TOTAL_PAGES
                  ? () => false
                  : () => handlePageChange(TOTAL_PAGES)
              }
            >
              <span>&gt;&gt;</span>
            </NavLink>
          </li>
        </ul>
      )}
    </nav>
  );
};

Pagination.propTypes = {
  active: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  range: PropTypes.number,
  handlePageChange: PropTypes.func,
  taskCount: PropTypes.number.isRequired,
  itemsCountPerPage: PropTypes.number.isRequired,
  generateHref: PropTypes.func,
};

Pagination.defaultProps = {
  active: 1,
  range: 5,
  generateHref: null,
  handlePageChange: function() {}
};

export default Pagination;
