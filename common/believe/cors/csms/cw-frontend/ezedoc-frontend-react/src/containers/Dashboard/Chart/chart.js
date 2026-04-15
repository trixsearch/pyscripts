import React, { Component } from "react";
import { Column } from '@ant-design/charts';
// import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

import * as constants from "../../../Data/constants";
import { DashboardChartContentLoader } from "../../../components/UI/ContentLoaders/ContentLoaders";

let dateRange = '';

class Chart extends Component {
    state = {
        selectedOption: ''
    }

    componentDidMount() {
        this.intialChartCreation(this.props.id);
    }

    componentDidUpdate(prevProps) {
        if (prevProps.id !== this.props.id
            || (this.props.updateType.time !== prevProps.updateType.time
                && constants.DASHBOARD_UPDATE_VARIABLE.includes(this.props.updateType.type))) {
            // TODO this needs to be refector  
            /* eslint-disable*/
            this.setState({ selectedOption: dateRange });
            this.intialChartCreation(this.props.id);
            /* eslint-enable */  
        }
    }

    intialChartCreation = (id) => {
        let d = new Date();
        let endMonth = d.getMonth();
        let endYear = d.getFullYear();
        d.setMonth(d.getMonth() - 5);
        let startMonth = d.getMonth();
        let startYear = d.getFullYear();
        this.props.showChartData(
            startMonth + 1, startYear, endMonth + 1, endYear, this.props.id ? id : null
        )
        dateRange = `${startMonth}-${startYear}-${endMonth}-${endYear}`;
    }

    handleChange = (e) => {
        let s = e.target.value;
        this.setState({ selectedOption: s });
        let arr = s.split("-");
        this.props.showChartData(
            Number(arr[0]) + 1, 
            Number(arr[1]),
            Number(arr[2]) + 1, 
            Number(arr[3]),
            this.props.id ? this.props.id : null
        );
    }

    render() {
        let d = new Date();
        let month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
        let endMonth = d.getMonth();
        let endYear = d.getFullYear();
        d.setMonth(d.getMonth() - 5);
        let startMonth = d.getMonth();
        let startYear = d.getFullYear();
        let numberOfIntervals = 4;
        let i = 0;
        let interval = [{
            endMonth: endMonth,
            endYear: endYear,
            startMonth: startMonth,
            startYear: startYear,
            id: i
        }]
        while (numberOfIntervals > 1) {
            let nextEndMonth = d.getMonth() - 1;
            let nextFullYear = d.getFullYear();
            endMonth = nextEndMonth < 0 ? nextEndMonth + 12 : nextEndMonth;
            endYear = nextEndMonth < 0 ? nextFullYear - 1 : nextFullYear;
            d.setMonth(d.getMonth() - 6);
            startMonth = d.getMonth();
            startYear = d.getFullYear();
            i += 1;
            interval.push({
                endMonth: endMonth,
                endYear: endYear,
                startMonth: startMonth,
                startYear: startYear,
                id: i,
            })
            numberOfIntervals -= 1;
        }

        let data = this.props.data.data ? Object.values(this.props.data.data) : [];
        // let themeData = JSON.parse(window.localStorage.getItem(constants.THEME_CONTROLLER)) || {}

        // let initiatedBarColor = themeData.first_primary_color;
        // let completedBarColor = themeData.first_primary_color === themeData.first_button_color 
        //     ? `${themeData.first_button_color}77`
        //     : themeData.first_button_color;

            const config = {
            data: data,
            forceFit: true,
            isGroup: true,
            xField: 'month',
            yField: 'value',
            label: {
                position: 'top'
            },
            seriesField: 'name',
            color: ['#5697D9', '#BFD554'],
            };

        return (
            <div className="graph_cont">
                <div className="graph_cont_body">
                    <div className="graph_cont_heading">
                        <div className="graph_cont_heading_text">
                            <div className="graph_head_text progress_text">
                                <p>PROCESS CHART</p>
                            </div>
                        </div>
                        <div className="graph_cont_heading_dropdown">
                            <div className="form-group">
                                <select className="form-control" id="sel1" value={this.state.selectedOption} onChange={this.handleChange}>
                                    {interval.map(option => (
                                        <option key={option.id} value={`${option.startMonth}-${option.startYear}-${option.endMonth}-${option.endYear}`}>
                                            {month[option.startMonth]}
                                            &nbsp;
                                    {option.startYear}
                                            -
                                    {month[option.endMonth]}
                                            &nbsp;
                                    {option.endYear}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div 
                        id="process_chart_container"
                        style={this.props.chartContentLoader ? {paddingLeft: '65px'} : {}}
                    >
                        {
                            !this.props.chartContentLoader
                                ? data.length > 0 && (
                                    <Column {...config} />
                                )
                            : (
                                <>
                                <div className="process_chart_loader">
                                <DashboardChartContentLoader />
                                </div>
                                </>
                            )
                        }
                    </div>
                </div>
            </div>
        )
    }

}

export default Chart;