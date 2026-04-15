import React, { useEffect } from "react";
import { connect } from "react-redux";
import { getDynamicChart } from "../../../../../store/actions/index";
import ChartTooltip from "./ChartTooltip"
import "../Widget.css"
import ConfigCharts from "./ConfigCharts";

const DashboardWidget = (props) => {
  const { uuid: orgId } = useParams();
  const queryData = props.query
  const getDynamicChartData = props.getDynamicChart

  useEffect(() => {
    if (queryData) {
      getDynamicChartData(orgId, queryData)
    }
  }, [getDynamicChartData, orgId, queryData])

  const {
    widgetData, query, info, id, chartError, type
  } = props
  let chartId = `app_btn_tooltip_chart_${id}`
  let data = []
  let name = ""
  let description = ""

  if (widgetData.length) {
    widgetData.map((item) => {
      if (query === item.chartQuery) {
        data = item.chartData
      }
      return item
    })
  }

  if (info) {
    name = info.name
    description = info.description
  }

  return (
    <>
      {!chartError
        ? (
          <div className="graph_cont_body">
            <ChartTooltip
              id={chartId}
              name={name}
              description={description}
            />
            <ConfigCharts
            data={data}
            type={type}
            />
          </div>
        ) : null}
    </>
  )

}

const mapStateToProps = state => ({
  widgetData: state.view.widgetData,
  chartError: state.view.chartError
})

const mapDispatchToProps = dispatch => ({
  getDynamicChart: (orgId, query) => dispatch(getDynamicChart(orgId, query))
});

export default connect(mapStateToProps, mapDispatchToProps)(DashboardWidget);
