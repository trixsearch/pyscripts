import {
    defaultTourOptions,
    StepsCreator
} from './utils'

// Tour will show the steps in the below given order
const steps = [
    {
        element: '#sidebar-wrapper > .sidebar-nav #dashboard',
        position: 'right',
        extraClassName: 'right-element',
        title: 'Dashboard',
        text: 'A birds eye view of everything happening in your organization'
    },
    {
        element: '#sidebar-wrapper > .sidebar-nav #processes',
        position: 'right',
        extraClassName: 'right-element',
        title: 'Processes',
        text: 'Get on to details of all your processes'
    },
    {
        element: '#sidebar-wrapper > .sidebar-nav #tasks',
        position: 'right',
        extraClassName: 'right-element',
        title: 'Tasks',
        text: 'All the tasks waiting to be actioned'
    },
    {
        element: '#sidebar-wrapper > .sidebar-nav #config',
        position: 'right',
        extraClassName: 'right-element',
        title: 'Config',
        text: 'Setup Groups, Departments, locations, Roles, Portal content'
    },
    {
        element: '#sidebar-wrapper > .sidebar-nav #reports',
        position: 'right',
        extraClassName: 'right-element',
        title: 'Reports',
        text: 'Get your analysis going through reports on all your processes'
    },
    {
        element: '#sidebar-wrapper > .sidebar-nav #inventory',
        position: 'right',
        extraClassName: 'right-element',
        title: 'Inventory',
        text: 'Order, Manage and Distribute the assets'
    },
    {
        element: '.body_nav_button > button.fancy_btn.active',
        position: 'bottom',
        extraClassName: 'bottom-element',
        title: 'Start New',
        text: 'Initiate a new process'
    },
    {
        element: '.profile_cont',
        position: 'bottom',
        extraClassName: 'bottom-element',
        title: 'Profile',
        text: 'Set up your Administrator Photo, Company Logo, Address'
    }
]

export const dashboardTourOptions = defaultTourOptions

export const dashboardSteps = StepsCreator(steps)
