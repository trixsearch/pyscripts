import { useEffect, useRef, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { parseQueryString } from "containers/utils";

/**
 *
 * URL eg: https://ezedox.codzelocal.com/org/process?type=completed&page=2&size=5&sort=asc&deleted=false
 *
 * usage:
 *
 * const queryParams = useQueryparams();
 *
 * returns {
 *      type: 'completed',
 *      page: '2',
 *      size: '5',
 *      sort: 'asc',
 *      deleted: 'false'
 *  }
 *
 * Optionally you can destructure only some params
 *
 * const { type, page } = useQueryparams();
 *
 */

export const useQueryParams = () => {
  const location = useLocation();

  const [params, setParams] = useState({});

  useEffect(() => {
    const parsedQueryParams = parseQueryString(location.search);
    setParams(parsedQueryParams);
  }, [location.search]);

  return { ...params };
};

/**
 * PageData
 * @typedef {Object} PageData
 * @property {Array | null} data - The List Data.
 * @property {number} total - The total items.
 * @property {number} [itemsPerPage = 10] - itemsPerPage - The items displayed in each page.
 * @property {string} [queryParamsString = ""] - Optional string to be appended to query params, other than page number.
 * @returns {void}
 */

/**
 * accepts pageData
 * @param {PageData} pageData - Page data
 */

const usePagination = (pageData) => {
  const { 
    data, 
    total, 
    itemsPerPage = 10, 
    queryParamsString = "" 
  } = pageData;

  const history = useHistory();
  const location = useLocation();

  const didRedirect = useRef(false);

  // calling custom hook to get page number
  const { page } = useQueryParams();

  useEffect(() => {
    if(!total) return;
    
    if (typeof page === "number" && page < 2) return;

    if (data && data.length === 0 && !didRedirect.current) {

      let nextPage;

      if (typeof page === "string" && page === "last") {
        nextPage = Math.ceil(total / itemsPerPage) - 1 || 1;
      } else {
        nextPage = page - 1 || 1;
      }
      didRedirect.current = true;
      history.push({
        pathname: location.pathname,
        search: queryParamsString
          ? `?page=${nextPage}${queryParamsString}`
          : `?page=${nextPage}`,
      });
    } else {
      didRedirect.current = false;
    }
  }, [
    data,
    page,
    total,
    history,
    itemsPerPage,
    queryParamsString,
    location.pathname,
  ]);
};

export default usePagination;
