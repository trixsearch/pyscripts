/* eslint-disable */
import React from 'react';

// Dashboard Chart Content Loader Dynamic Bar size Logic //

const InitiatedGraphBar = () => {
    return Math.floor(Math.random() * 100) + 30
}

const CompletedGraphBar = () => {
    return Math.floor(Math.random() * 31)
}

let graphBarAInitiated = InitiatedGraphBar()
let graphBarACompleted = CompletedGraphBar()
let graphBarBInitiated = InitiatedGraphBar()
let graphBarBCompleted = CompletedGraphBar()
let graphBarCInitiated = InitiatedGraphBar()
let graphBarCCompleted = CompletedGraphBar()
let graphBarDInitiated = InitiatedGraphBar()
let graphBarDCompleted = CompletedGraphBar()
let graphBarEInitiated = InitiatedGraphBar()
let graphBarECompleted = CompletedGraphBar()
let graphBarFInitiated = InitiatedGraphBar()
let graphBarFCompleted = CompletedGraphBar()

// ***************************************************** //

/* 
Note: 
    Empty mobileData must if there is no specific mobile content loader datas.
Sample Data Object:
    XXXXXX_XXXX_CONTENT_LOADER: {
        mobileData: {}
    }
*/

// Datas of all Content Loaders
export const ContentLoadersDatas = {
    CONTENT_LOADER_DEFAULTS: {
        speed: 1,
        primaryColor: '#dbdbdbcc',
        secondaryColor: '#ecebeb'
    },
    CAROUSEL_CONTENT_LOADER: {
        width: 770,
        height: 40,
        children: (
            <>
                <rect x="0" y="0" rx="5" ry="5" width="150" height="40" />
                <rect x="155" y="0" rx="5" ry="5" width="150" height="40" />
                <rect x="310" y="0" rx="5" ry="5" width="150" height="40" />
                <rect x="465" y="0" rx="5" ry="5" width="150" height="40" />
                <rect x="620" y="0" rx="5" ry="5" width="150" height="40" />
            </>
        ),
        mobileData: {
            width: 150
        }
    },
    DASHBOARD_PROCESSES_COUNT_CONTENT_LOADER: {
        width: 150,
        height: 50,
        mobileData: {
            width: 200
        }
    },
    WOKFLOWS_TASK_COUNT_CONTENT_LOADER: {
        width: 150,
        height: 14,
        mobileData: {
            width: 200
        }
    },
    
    DASHBOARD_MY_PENDING_TASKS_CONTENT_LOADER: {
        width: 400,
        height: 230,
        children: (
            <>
                <rect x="30" y="25" rx="6" ry="6" width="250" height="12" />
                <rect x="31" y="41" rx="3" ry="3" width="150" height="6" />
                <rect x="30" y="64" rx="6" ry="6" width="250" height="12" />
                <rect x="31" y="80" rx="3" ry="3" width="150" height="6" />
                <rect x="30" y="103" rx="6" ry="6" width="250" height="12" />
                <rect x="31" y="119" rx="3" ry="3" width="150" height="6" />
                <rect x="30" y="142" rx="6" ry="6" width="250" height="12" />
                <rect x="31" y="158" rx="3" ry="3" width="150" height="6" />
                <rect x="30" y="181" rx="6" ry="6" width="250" height="12" />
                <rect x="31" y="197" rx="3" ry="3" width="150" height="6" />
            </>
        ),
        mobileData: {
            height: 149,
            children: (
                <>
                    <rect x="30" y="25" rx="6" ry="6" width="250" height="12" />
                    <rect x="31" y="41" rx="3" ry="3" width="150" height="6" />
                    <rect x="30" y="64" rx="6" ry="6" width="250" height="12" />
                    <rect x="31" y="80" rx="3" ry="3" width="150" height="6" />
                    <rect x="30" y="103" rx="6" ry="6" width="250" height="12" />
                    <rect x="31" y="119" rx="3" ry="3" width="150" height="6" />
                </>
            ),
        }
    },
    DASHBOARD_CHART_CONTENT_LOADER: {
        width: 450,
        height: 200,
        children: (
            <>
                <rect x="0" y="155" rx="0" ry="0" width="450" height="1" />
                <rect x="7" y={155 - graphBarAInitiated} rx="0" ry="0" width="25" height={graphBarAInitiated} />
                <rect x="35" y={155 - graphBarACompleted} rx="0" ry="0" width="24" height={graphBarACompleted} />
                <rect x="71" y={155 - graphBarBInitiated} rx="0" ry="0" width="25" height={graphBarBInitiated} />
                <rect x="99" y={155 - graphBarBCompleted} rx="0" ry="0" width="24" height={graphBarBCompleted} />
                <rect x="135" y={155 - graphBarCInitiated} rx="0" ry="0" width="25" height={graphBarCInitiated} />
                <rect x="163" y={155 - graphBarCCompleted} rx="0" ry="0" width="24" height={graphBarCCompleted} />
                <rect x="199" y={155 - graphBarDInitiated} rx="0" ry="0" width="25" height={graphBarDInitiated} />
                <rect x="227" y={155 - graphBarDCompleted} rx="0" ry="0" width="24" height={graphBarDCompleted} />
                <rect x="263" y={155 - graphBarEInitiated} rx="0" ry="0" width="25" height={graphBarEInitiated} />
                <rect x="291" y={155 - graphBarECompleted} rx="0" ry="0" width="24" height={graphBarECompleted} />
                <rect x="327" y={155 - graphBarFInitiated} rx="0" ry="0" width="25" height={graphBarFInitiated} />
                <rect x="355" y={155 - graphBarFCompleted} rx="0" ry="0" width="24" height={graphBarFCompleted} />
            </>
        ),
        mobileData: {}
    },

    DASHBOARD_BAR_CHART_CONTENT_LOADER: {
        width: 400,
        height: 200,
        children: (
            <>
                {/* <rect x="40" y="5" rx="0" ry="0" width="1" height="150" /> */}
                <rect x="40" y="155" rx="0" ry="0" width="330" height="1" />
                <rect x="90" y={155 - graphBarBInitiated} rx="0" ry="0" width="50" height={graphBarBInitiated} />
                <rect x="180" y={155 - graphBarBCompleted} rx="0" ry="0" width="50" height={graphBarBCompleted} />
                <rect x="270" y={155 - graphBarCInitiated} rx="0" ry="0" width="50" height={graphBarCInitiated} />

            </>
        ),
        mobileData: {}
    },

    DASHBOARD_LINE_CHART_CONTENT_LOADER: {
        width: 340,
        height: 180,
        children: (
            <>
                {/* <rect x="40" y="5" rx="0" ry="0" width="1" height="150" /> */}
                <rect x="40" y="155" rx="0" ry="0" width="270" height="1" />
                <circle cx="80" cy={155 - graphBarBInitiated} r="5" />
                <circle cx="180" cy={155 - graphBarBCompleted} r="5" />
                <circle cx="280" cy={155 - graphBarCInitiated} r="5" />

            </>
        ),
        mobileData: {}
    },
    
    DASHBOARD_PIE_CHART_CONTENT_LOADER: {
        width: 340,
        height: 170,
        children: (
            <>
                <circle cx="170" cy="100" r="50"/>

            </>
        ),
        mobileData: {}
    },

    DASHBOARD_FUNNEL_CHART_CONTENT_LOADER: {
        width: 340,
        height: 170,
        children: (
            <>
                <polygon points="80,30 260,30 200,150 140,150" />

            </>
        ),
        mobileData: {}
    },

    TASK_LIST_ITEM_CONTENT_LOADER: {
        width: 160,
        height: 18,
        mobileData: {}
    },
    TASK_LIST_ITEM_ACTION_BUTTON_CONTENT_LOADER: {
        width: 150,
        height: 37,
        mobileData: {}
    },
    NOTIFICATION_LOADER: {
        width: 300,
        height: 37,
        children: (
            <>
                <rect x="10" y="10" rx="6" ry="6" width="170" height="12" />
                <rect x="10" y="25" rx="6" ry="6" width="70" height="12" />
                <rect x="250" y="13" rx="6" ry="6" width="28" height="6" />
                <rect x="250" y="27" rx="3" ry="3" width="10" height="6" />
            </>
        ),
        mobileData: {}
    }
}