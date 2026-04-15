import React from 'react';

import { ContentLoaderTemplate } from './ContentLoaderUtils';
import { ContentLoadersDatas } from './ContentLoadersDatas';

// ================================================= //
// ========== List of all Content Loaders ========== //
// ================================================= //

// Carousel Content Loader
export const CarouselContentLoader = () => (
    <ContentLoaderTemplate
        data={ContentLoadersDatas.CAROUSEL_CONTENT_LOADER}
        mobileData={ContentLoadersDatas.CAROUSEL_CONTENT_LOADER.mobileData}
    />
)

// Dashboard ProcessesCount Content Loader
export const DashboardProcessesCountContentLoader = () => (
    <ContentLoaderTemplate
        data={ContentLoadersDatas.DASHBOARD_PROCESSES_COUNT_CONTENT_LOADER}
        mobileData={ContentLoadersDatas.DASHBOARD_PROCESSES_COUNT_CONTENT_LOADER.mobileData}
    />
)

// Workflow Task Content Loader
export const WorkflowTaskCountContentLoader = () => (
    <ContentLoaderTemplate
        data={ContentLoadersDatas.WOKFLOWS_TASK_COUNT_CONTENT_LOADER}
        mobileData={ContentLoadersDatas.WOKFLOWS_TASK_COUNT_CONTENT_LOADER.mobileData}
    />
)

// Dashboard TaskCount Content Loader
export const DashboardTaskCountContentLoader= () => (
    <ContentLoaderTemplate
        data={ContentLoadersDatas.DASHBOARD_PROCESSES_COUNT_CONTENT_LOADER}
        mobileData={ContentLoadersDatas.DASHBOARD_PROCESSES_COUNT_CONTENT_LOADER.mobileData}
    />
)

// Dashboard MyPendingTasks Content Loader
export const DashboardMyPendingTasksContentLoader = () => (
    <ContentLoaderTemplate
        data={ContentLoadersDatas.DASHBOARD_MY_PENDING_TASKS_CONTENT_LOADER}
        mobileData={ContentLoadersDatas.DASHBOARD_MY_PENDING_TASKS_CONTENT_LOADER.mobileData}
    />
)

// Dashboard Chart Content Loader
export const DashboardChartContentLoader = () => (
    <ContentLoaderTemplate
        data={ContentLoadersDatas.DASHBOARD_CHART_CONTENT_LOADER}
        mobileData={ContentLoadersDatas.DASHBOARD_CHART_CONTENT_LOADER.mobileData}
    />
)

export const DashboardBarChartContentLoader = () =>(
    <ContentLoaderTemplate
        data={ContentLoadersDatas.DASHBOARD_BAR_CHART_CONTENT_LOADER}
        mobileData={ContentLoadersDatas.DASHBOARD_BAR_CHART_CONTENT_LOADER.mobileData}
    />
)

export const DashboardLineChartContentLoader = () =>(
    <ContentLoaderTemplate
        data={ContentLoadersDatas.DASHBOARD_LINE_CHART_CONTENT_LOADER}
        mobileData={ContentLoadersDatas.DASHBOARD_LINE_CHART_CONTENT_LOADER.mobileData}
    />
)

export const DashboardPieChartContentLoader = () =>(
    <ContentLoaderTemplate
        data={ContentLoadersDatas.DASHBOARD_PIE_CHART_CONTENT_LOADER}
        mobileData={ContentLoadersDatas.DASHBOARD_PIE_CHART_CONTENT_LOADER.mobileData}
    />
)

export const DashboardFunnelChartContentLoader = () =>(
    <ContentLoaderTemplate
        data={ContentLoadersDatas.DASHBOARD_FUNNEL_CHART_CONTENT_LOADER}
        mobileData={ContentLoadersDatas.DASHBOARD_FUNNEL_CHART_CONTENT_LOADER.mobileData}
    />
)

// Task List Item Content Loader
export const TaskListItemContentLoader = () => (
    <ContentLoaderTemplate
        data={ContentLoadersDatas.TASK_LIST_ITEM_CONTENT_LOADER}
        mobileData={ContentLoadersDatas.TASK_LIST_ITEM_CONTENT_LOADER.mobileData}
    />
)

// Task List Item Action Button Content Loader
export const TaskListItemActionButtonContentLoader = () => (
    <ContentLoaderTemplate
        data={ContentLoadersDatas.TASK_LIST_ITEM_ACTION_BUTTON_CONTENT_LOADER}
        mobileData={ContentLoadersDatas.TASK_LIST_ITEM_ACTION_BUTTON_CONTENT_LOADER.mobileData}
    />
)

// Notification Content Loader
export const NotificationContentLoader = () => (
    <ContentLoaderTemplate
        data={ContentLoadersDatas.NOTIFICATION_LOADER}
        mobileData={ContentLoadersDatas.NOTIFICATION_LOADER.mobileData}
    />
)
