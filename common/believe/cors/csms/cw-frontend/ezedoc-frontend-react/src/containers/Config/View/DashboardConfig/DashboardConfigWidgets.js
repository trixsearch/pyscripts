import React from 'react';
import QuickActions from "../../../Dashboard/QuickActions/QuickActions";
import DashboardChartWidgets from "./dashboardWidgets/DashboardWidgets"
import { HasAccess } from '../../../../platformDataStoreContext';
import { CW_SERVICE_TASKS_VIEW } from '../../../../Data/constants';

const DashboardconfigWidgets = ({
    item,
    index,
    navlink,
    orgId,
}) => {

     if (item.type === "myTaskCount") {
      return (
        <HasAccess
          permissions={[CW_SERVICE_TASKS_VIEW]}
          yes={() => (
            <QuickActions
              type="myTask"
              navlink={navlink}
              orgId={orgId}
            />
          )}
        />
      )
    } if (item.type === "groupTaskCount") {
      return (
        <HasAccess
          permissions={[CW_SERVICE_TASKS_VIEW]}
          yes={() => (
            <QuickActions
              type="grouptask"
              navlink={navlink}
              orgId={orgId}
            />
          )}
        />
      )
    }
      return (
        <DashboardChartWidgets
          query={item.chartQuery}
          info={item.formData}
          id={index}
          type={item.type}
        />
      )

  }

  export default DashboardconfigWidgets;