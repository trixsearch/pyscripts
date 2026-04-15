import React from "react";
import { Link } from 'react-router-dom';

import './breadcrumb.css';

export default ({ list, active }) => (
    <div className="body_nav">
        <div className="body_nav_bg" />
        <div className="body_nav_indicater">
            <span className="icon-corner_path out_a" />
            {list && active ? (
                <>
                    {list.map((item, i) => (
                        <Link key={i} to={item.path} className="">
                            <span>{` ${item.name} `}</span>
                            <span className="icon-corner_path" />
                        </Link>
                    ))}
                    <p className="breadcrumb_sec_nav active">
                        <span>{` ${active} `}</span>
                    </p>
                    <span className="icon-corner_path out_a" />
                </>
              )
                : (
                <>
                    {list && !active

                        ? list.map((item, i) => (
                            <p key={i} to={item.path} className="breadcrumb_fir_nav">
                                <span>{` ${item.name} `}</span>
                                <span className="icon-corner_path" />
                            </p>
                        ))

                        : (
                        <p className="breadcrumb_sec_nav active">
                            <span>{` ${active} `}</span>
                            <span className="icon-corner_path out_a" />
                        </p>
                      )}
                </>
)
            }
            {/* Default Code */}
            {/* {list.map((item, i) => (
                <Link key={i} to={item.path} className="">
                    <span>{` ${item.name} `}</span>
                    <span className="icon-corner_path"></span>
                </Link>
            ))}
            <Link to="#" className="active">
            <p className="active">
                <span>{` ${active} `}</span>
                <span className="icon-corner_path"></span>
            </p>
            </Link> */}
        </div>
    </div>
)