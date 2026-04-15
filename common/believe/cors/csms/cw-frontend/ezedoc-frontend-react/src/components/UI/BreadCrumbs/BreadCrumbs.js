import React, { useState, useEffect } from 'react';
import { useLocation, useHistory, matchPath } from 'react-router-dom';

import styles from './BreadCrumbs.module.css';
import rightArrowIcon from '../../../assets/images/right.svg';

const BreadCrumbs = ({ routes, homeUrl }) => {
  const { pathname, state } = useLocation();
  const history = useHistory();
  const [breadCrumblinks, setBreadCrumbLinks] = useState([]);

  useEffect(() => {
    const navLinks = [];
    routes.forEach((route) => {
      const match = matchPath(pathname, {
        path: `/custom-workflow/org/:orgId${route.path}`,
      });
      if (match) navLinks.push({ ...match, name: route.name });
    });
    setBreadCrumbLinks([
      { name: 'Dashboard', url: homeUrl },
      ...navLinks,
    ]);
  }, [pathname]);

  return (
    <div className={styles.container}>
      {
        breadCrumblinks.map(({ name, url }, index, arr) => ((index === arr.length - 1) ? (
          <span key={name}>{name}</span>
        ) : (
          <button
            type="button"
            className={styles.link}
            onClick={() => history.push({ pathname: url, state })}
          >
            {name}
            <img src={rightArrowIcon} alt="right-arrow" />
          </button>
        )))
      }
    </div>
  );
};

export default BreadCrumbs;
