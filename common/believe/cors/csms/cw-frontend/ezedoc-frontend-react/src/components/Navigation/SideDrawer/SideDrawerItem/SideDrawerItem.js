import React from "react"
import { NavLink } from "react-router-dom"
import { isMobile } from '../../../../containers/utils'

const SideDrawerItem = ({
    item,
    children,
    onItemClickHandler,
    isFirstChild = false,
}) => {
    return (
        <li className={`nav-item main_menu ${isFirstChild ? 'first-child' : ''}`} id={item.id}>
            <NavLink to={item.url} onClick={() => (isMobile() ? onItemClickHandler() : null)}>
                <span className={item.appClass} />
                <span className={`side_text_span ${!item.feature && 'sidebutton_blur'}`}>{item.displayName}</span>
                {item.feature ? null : (
                    <React.Fragment>
                        <span className='icon-premium-reddot' />
                        <span className='icon-premium premium-icon-sidedrawer' />
                    </React.Fragment>
                )}
            </NavLink>
            {children}
        </li>
    )
}

export default SideDrawerItem