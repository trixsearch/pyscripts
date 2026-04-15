import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import { isMobile } from 'containers/utils'
import { OWNER, SUPER_ADMINISTRATOR } from 'Data/constants'
import SideDrawerItem from './SideDrawerItem/SideDrawerItem'

import './SideDrawer.css'

const DoesNotShowBrand = process.env.REACT_APP_ONPREM

class SideDrawer extends React.Component {

    shouldComponentUpdate(nextProps) {
        if (nextProps.location.pathname !== this.props.location.pathname
            || nextProps.entity_list !== this.props.entity_list)
            return true
        return false
    }

    render() {
        let {
            location, uiFeatures, entity_list, entity_routes_match, ...props
        } = this.props
        // Property 'show' is to show the item in mobile view
        const routes = [
            {
                displayName: 'dashboard',
                url: '/dashboard',
                id: 'dashboard',
                appClass: 'icon-dashboard',
                show: true,
                feature: true

            },
            {
                displayName: 'tasks',
                url: '/tasks',
                id: 'tasks',
                appClass: 'icon-task',
                show: props.uiPermissions.tasks.manage,
                feature: true,
            },
            {
                displayName: 'hiring',
                url: '/hiring',
                id: 'hiring',
                appClass: 'icon-hiring',
                show: true,
                feature: true,
                children: [
                    {
                        displayName: 'jobs',
                        url: '/job',
                        id: 'job',
                        appClass: 'icon-jobs',
                        show: props.uiPermissions.job?.view,
                        feature: uiFeatures.job?.view,
                    },
                    {
                        displayName: 'events',
                        url: '/event',
                        id: 'event',
                        appClass: 'icon-events',
                        show: props.uiPermissions.hiringevent?.view,
                        feature: uiFeatures.hiringevent?.view,
                    },
                    {
                        displayName: 'head count',
                        url: '/headcount',
                        id: 'headcount',
                        appClass: 'icon-headcount',
                        show: props.uiPermissions.headcountplan?.view,
                        feature: uiFeatures.headcountplan?.view,
                    },
                    {
                        displayName: 'partners',
                        url: '/partner',
                        id: 'partner',
                        appClass: 'icon-events',
                        show: props.uiPermissions.hiringpartner?.view,
                        feature: uiFeatures.hiringpartner?.view,
                    },
                    {
                        displayName: 'job roles',
                        url: '/jobrole',
                        id: 'jobrole',
                        appClass: 'icon-headcountrole',
                        show: props.uiPermissions.jobrole?.view,
                        feature: uiFeatures.jobrole?.view,
                    },
                ]
            },
            {
                displayName: 'entities',
                url: '/',
                id: 'entity',
                appClass: 'icon-card',
                children: entity_list,
                feature: true,
            },
            {
                displayName: 'BGV',
                url: '/bgv',
                id: 'bgv',
                appClass: 'icon-employee',
                show: props.uiPermissions.bgv?.manage,
                feature: true,
            },
            {
                displayName: 'processes',
                url: '/process',
                id: 'processes',
                appClass: 'icon-process',
                show: props.uiPermissions.processes.manage,
                feature: true

            },
            {
                displayName: 'config',
                url: '/',
                id: 'config',
                appClass: 'icon-config',
                feature: true,
                children: [
                    {
                        displayName: 'users',
                        url: '/users',
                        id: 'organisationuser',
                        appClass: 'icon-user',
                        show: props.uiPermissions.organisationuser.view,
                        feature: uiFeatures.organisationuser.view,
                    },
                    {
                        displayName: 'groups',
                        url: '/groups',
                        id: 'organisationgroup',
                        appClass: 'icon-group',
                        show: props.uiPermissions.organisationgroup.view,
                        feature: uiFeatures.organisationgroup.view
                    },
                    {
                        displayName: 'departments',
                        url: '/department',
                        id: 'department',
                        appClass: 'icon-department',
                        show: props.uiPermissions.department.view,
                        feature: uiFeatures.department.view
                    },
                    {
                        displayName: 'locations',
                        url: '/location',
                        id: 'location',
                        appClass: 'icon-location',
                        show: props.uiPermissions.location.view,
                        feature: uiFeatures.location.view
                    },
                    {
                        displayName: 'Email Settings',
                        url: '/smtp',
                        id: 'smtpsettings',
                        appClass: 'icon-server',
                        show: props.uiPermissions.smtpsettings.view,
                        feature: uiFeatures.smtpsettings.view
                    },
                    {
                        displayName: 'themes',
                        url: '/themes',
                        id: 'themes',
                        appClass: 'icon-theme',
                        show: props.uiPermissions.organisation.view && uiFeatures.organisationlicense.theme,
                        feature: uiFeatures.organisationlicense.theme
                    },
                    {
                        displayName: 'view',
                        url: '/view',
                        id: 'view',
                        appClass: 'icon-data-table',
                        show: this.props.user === OWNER || this.props.user === SUPER_ADMINISTRATOR,
                        feature: uiFeatures.organisationworkflow.view,
                    },
                    {
                        displayName: 'lists',
                        url: '/lists',
                        id: 'lists',
                        appClass: 'icon-lists',
                        show: props.uiPermissions.organisationlists.view,
                        feature: uiFeatures.organisationlists.view
                    },
                    {
                        displayName: 'roles',
                        url: '/config/role',
                        id: 'role',
                        appClass: 'icon-roles',
                        show: props.uiPermissions.group.view,
                        feature: uiFeatures.group.view
                    },
                    {
                        displayName: 'portals',
                        url: '/portals',
                        id: 'portals',
                        appClass: 'icon-portals',
                        show: props.uiPermissions.portals.view,
                        feature: uiFeatures.portals.view,
                        children2: [{
                            displayName: 'contents',
                            url: '/contents',
                            id: 'content',
                            appClass: 'icon-content',
                            show: props.uiPermissions.content.view,
                            feature: uiFeatures.portals.view,
                        }]
                    },
                    {
                        displayName: 'custom Attributes',
                        url: '/custom-attributes',
                        id: 'custom-attributes',
                        appClass: 'icon-customattr',
                        show: props.uiPermissions.customattribute.view,
                        feature: uiFeatures.customattribute.view

                    },
                    {
                        displayName: 'workflows',
                        url: '/workflows',
                        id: 'organisationworkflow',
                        appClass: 'icon-apps',
                        show: props.uiPermissions.organisationworkflow.view,
                        feature: uiFeatures.organisationworkflow.view,
                    }
                ]
            },
            {
                displayName: 'Master Records',
                url: '/master',
                id: 'master',
                appClass: 'icon-data-table',
                show: props.uiPermissions.masterrecords.manage,
                feature: uiFeatures.organisationlicense.master

            },
            {
                displayName: 'Reports',
                url: '/reports',
                id: 'reports',
                appClass: 'icon-reports',
                show: props.uiPermissions.reporttemplate.view,
                feature: true
            },
            {
                displayName: 'Inventory',
                url: '/',
                id: 'inventory',
                appClass: 'icon-inventory',
                feature: true,
                children: [
                    {
                        displayName: 'stocks',
                        url: '/inventory/stock',
                        id: 'stock',
                        appClass: 'icon-stock',
                        show: props.uiPermissions.organisationstocks.view,
                        feature: uiFeatures.organisationstocks.view,
                    },
                    {
                        displayName: 'supplies',
                        url: '/inventory/supply',
                        id: 'supply',
                        appClass: 'icon-supply',
                        show: props.uiPermissions.organisationsupply.view,
                        feature: uiFeatures.organisationsupply.view,
                    },
                    {
                        displayName: 'distributions',
                        url: '/inventory/distribution',
                        id: 'distribution',
                        appClass: 'icon-distribution',
                        show: props.uiPermissions.organisationassetdistribution.view,
                        feature: uiFeatures.organisationassetdistribution.view,
                    },
                    {
                        displayName: 'assets',
                        url: '/inventory/asset',
                        id: 'asset',
                        appClass: 'icon-assets',
                        show: props.uiPermissions.organisationasset.view,
                        feature: uiFeatures.organisationasset.view,
                    },
                    {
                        displayName: 'kits',
                        url: '/inventory/kit',
                        id: 'kit',
                        appClass: 'icon-assets',
                        show: props.uiPermissions.organisationkit.view,
                        feature: uiFeatures.organisationkit.view,
                    },
                    {
                        displayName: 'suppliers',
                        url: '/inventory/supplier',
                        id: 'supplier',
                        appClass: 'icon-suppliers',
                        show: props.uiPermissions.organisationsupplier.view,
                        feature: uiFeatures.organisationsupplier.view,
                    },
                ]
            }
        ]

        const configRoutes = [/\/users/, /\/location/, /\/department/, /\/groups/,
            /\/smtp/, /\/themes/, /\/view/, /\/portals/, /\/contents/, /\/lists/, /\/custom-attributes/, /\/config\/role/, /\/workflows/]

        const portalsRoutes = [/\/contents/, /\/portals/]

        const inventoryRoutes = [/\/inventory\/stock/, /\/inventory\/stock\/adjustments/, /\/inventory\/distribution/, /\/inventory\/asset/,
            /\/inventory\/kit/, /\/inventory\/supplier/, /\/inventory\/supply/]

        const hiringRoutes = [/\/hiring/, /\/job/, /\/event/, /\/headcount/, /\/partner/, /\/jobrole/]

        let filteredRoutes = routes.map(item => {
            const id = item.id
            if (id === 'config' && !isMobile()) {
                const configChild = item.children.filter(subItem => subItem.show)
                if (configChild.length > 0) {
                    const firstChildUrl = configChild[0].url
                    return {
                        displayName: 'config', url: firstChildUrl, id: 'config', appClass: 'icon-config', children: configChild, feature: item.feature
                    }
                }
            } else if (id === 'inventory' && !isMobile()) {
                const inventoryChild = item.children.filter(subItem => subItem.show)
                if (inventoryChild.length > 0) {
                    const firstChildUrl = inventoryChild[0].url
                    return {
                        displayName: 'Inventory', url: firstChildUrl, id: 'inventory', appClass: 'icon-inventory', children: inventoryChild, feature: item.feature
                    }
                }
            } else if (id === 'inventory' && isMobile()) {
                const inventoryChild = item.children.filter(subItem => subItem.show)
                if (inventoryChild.length > 0) {
                    const firstChildUrl = inventoryChild[0].url
                    return {
                        displayName: 'Inventory', url: firstChildUrl, id: 'inventory', appClass: 'icon-inventory', children: inventoryChild, feature: item.feature
                    }
                }
            } else if (id === 'hiring' && !isMobile()) {
                const hiringChildren = item.children.filter(subItem => subItem.show)
                if (hiringChildren.length > 0) {
                    return {
                        ...item,
                        children: hiringChildren,
                    }
                }

            } else if (id === 'hiring' && isMobile()) {
                const hiringChildren = item.children.filter(subItem => {
                    if (subItem.displayName !== "head count") {
                        return subItem.show
                    }
                    return false;
                })
                if (hiringChildren.length > 0) {
                    return {
                        ...item,
                        children: hiringChildren,
                    }
                }
            
            } else if (id === 'entity' && !isMobile()) {
                const entitychild = item.children && item.children.filter(subItem => subItem.show)
                if (entitychild && entitychild.length > 0) {
                    const firstChildUrl = entitychild[0].url
                    return {
                        displayName: 'entities', url: firstChildUrl, id: 'entity', appClass: 'icon-card', children: entitychild, feature: item.feature
                    }
                }
            } else if (item.show) {
                if (['master', 'reports'].includes(item.id)) {
                    if (!isMobile()) {
                        return item
                    }
                } else {
                    return item
                }
            }
            return null
        })
        filteredRoutes = filteredRoutes.filter(item => item !== null)

        const subMenuOpen = configRoutes.some(route => location.pathname.match(route))
        const portalsOpen = portalsRoutes.some(route => location.pathname.match(route))
        const inventoryOpen = inventoryRoutes.some(route => location.pathname.match(route))
        const entityOpen = entity_routes_match && entity_routes_match.some(route => location.pathname.match(route))
        const hiringMenuOpen = hiringRoutes.some(route => location.pathname.match(route))

        return (
            <div id='sidebar-wrapper'>
                <ul className='sidebar-nav nav nav-pills' role='tablist'>
                    {filteredRoutes.map((item) => (
                        <SideDrawerItem key={item.id} item={item} onItemClickHandler={this.props.onItemClickHandler} isFirstChild={item.id === 'hiring' && hiringMenuOpen}>
                            {!!(item.children && item.children.length) && item.children.map((childrenItem) => (
                                <ul
                                    key={childrenItem.id}
                                    role='tablist'
                                    id='config_list_menu'
                                    className={
                                        `sidebar-nav nav nav-pills sub_menu_side_bar 
                                    ${item.id === 'config' && subMenuOpen ? 'active' : ''}
                                    ${item.id === 'inventory' && inventoryOpen ? 'active' : ''}
                                    ${item.id === 'entity' && entityOpen ? 'active' : ''}
                                    ${item.id === 'hiring' && hiringMenuOpen ? 'active' : ''}
                                    `
                                    }
                                >
                                    <SideDrawerItem item={childrenItem} onItemClickHandler={this.props.onItemClickHandler} />
                                    <ul
                                        className={
                                            `sidebar-nav nav nav-pills sub_menu_side_bar
                                        ${childrenItem.id === 'portals' && portalsOpen ? 'active' : ''}
                                        `
                                        }
                                        role='tablist'
                                    >
                                        {!!(childrenItem.children2 && childrenItem.children2.length)
                                            && childrenItem.children2.filter(children2Item => children2Item.show).map((children2Item) => (
                                                <SideDrawerItem key={children2Item.id} item={children2Item} />
                                            ))
                                        }
                                    </ul>
                                </ul>
                            ))
                            }
                        </SideDrawerItem>
                    ))}
                </ul>
                {DoesNotShowBrand === 'true' ? null : <p className='powered_by_ezedox'>Powered by ezeDox</p>}
            </div>
        )
    }
}

const mapStateToProps = (state) => ({
    uiPermissions: state.auth.uiPermissions,
    uiFeatures: state.auth.uiFeatures,
    user: state.auth.groupName,
    entity_list: state.auth.entityList,
    entity_routes_match: state.auth.entityRoutesMatches,
})

export default withRouter(connect(mapStateToProps)(SideDrawer))