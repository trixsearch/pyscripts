import React from 'react'
import {
    Column, Funnel, Line, Pie
} from '@ant-design/charts';
import {
    DashboardBarChartContentLoader, DashboardFunnelChartContentLoader, DashboardLineChartContentLoader, DashboardPieChartContentLoader
} from "../../../../../components/UI/ContentLoaders/ContentLoaders";
import * as constants from "../../../../../Data/constants";

const ConfigCharts = ({ data, type }) => {

    if (type === "barChart") {
        if (data.length) {
            let themeColor = JSON.parse(window.localStorage.getItem(constants.THEME_CONTROLLER)).first_primary_color;
            let config = {
                data: data,
                forceFit: true,
                padding: 'auto',
                xField: 'name',
                yField: 'value',
                meta: {
                    name: {
                        alias: 'Process',
                    },
                    value: {
                        alias: 'Count',
                    },
                },
                label: {
                    visible: true,
                    style: {
                        fill: '#0D0E68',
                        fontSize: 12,
                        fontWeight: 600,
                        opacity: 0.6,
                    },
                },
                color: themeColor
            };
            return (
                <div className="widget_container">
                    <Column {...config} />
                </div>
            )
        }
        return (
            <div className="widget_chart_loader">
                <DashboardBarChartContentLoader />
            </div>
        )
    }
    if (type === "funnelChart") {
        if (data.length) {
            let themeData = JSON.parse(window.localStorage.getItem(constants.THEME_CONTROLLER))
            let ongoingBarColor = themeData.first_primary_color;
            let completedBarColor = themeData.first_primary_color === themeData.first_button_color
                ? `${themeData.first_button_color}77`
                : themeData.first_button_color;
            let withdrawnBarColor = `${themeData.first_primary_color}70`;
            let configs = {
                data: data,
                xField: 'name',
                yField: 'value',
                minSize: 0.5,
                shape:'pyramid',
                conversionTag: false,
                color: [ongoingBarColor, completedBarColor, withdrawnBarColor]
            }
            return (
                <div className="widget_container">
                    <Funnel {...configs} />
                </div>
            )
        }
        return (
            <div className="widget_chart_loader">
                <DashboardFunnelChartContentLoader />
            </div>
        )
    }
    if (type === "lineChart") {
        let themeColor = JSON.parse(window.localStorage.getItem(constants.THEME_CONTROLLER)).first_primary_color;
        let config = {
            data: data,
            forceFit: true,
            padding: 'auto',
            xField: 'name',
            yField: 'value',
            point: {
                size: 5
                },
            smooth: true,
            color: themeColor
        };
        if (data.length) {
            return (
                <div className="widget_container">
                    <Line {...config} />
                </div>
            )
        }
        return (
            <div className="widget_chart_loader">
                <DashboardLineChartContentLoader />
            </div>
        )
    }
    if (type === "pieChart") {
        if (data.length) {
            let themeData = JSON.parse(window.localStorage.getItem(constants.THEME_CONTROLLER))
            let ongoingBarColor = themeData.first_primary_color;
            let completedBarColor = themeData.first_primary_color === themeData.first_button_color
                ? `${themeData.first_button_color}77`
                : themeData.first_button_color;
            let withdrawnBarColor = `${themeData.first_primary_color}70`;
            const config = {
                data: data,
                radius: 0.8,
                angleField: 'value',
                colorField: 'name',
                label: {
                    visible: true,
                    type: 'inner',
                },
                color: [ongoingBarColor, completedBarColor, withdrawnBarColor]
            };
            return (
                <div className="widget_container">
                    <Pie {...config} />
                </div>
            )
        }
        return (
            <div className="widget_chart_loader">
                <DashboardPieChartContentLoader />
            </div>
        )
    }
    return null;
}

export default ConfigCharts;