import React from 'react'
import { NavLink } from 'react-router-dom'

import { Button } from '../../components/UI/AppButton/AppButton'

const ReportsRow = props => {
    const {
        data,
        handleReport,
        permission,
        downloadPermission,
        showWarning
    } = props

    function handleGenerate() {
        handleReport(data)
    }

    let reportIcon = ''
    if (data.report_on === 'ENTITY') {
        reportIcon = 'icon-entity_report'
    } else {
        reportIcon = 'icon-report'
    }

    return (
        <tr>
            <td className='col-xs-2' style={{ display: 'inline' }}>
                <span className={reportIcon} />
                &nbsp;
                {data.name}
            </td>
            <td className='col-xs-3'>{data.description}</td>
            <td className='col-xs-2'>{data.created_at.substring(0, 10)}</td>
            <td className='col-xs-5 action_cont'>
                {downloadPermission ? (
                    <div>
                        <Button onClick={handleGenerate} variant='table-row-edit'>
                            <span className='icon glyphicon glyphicon-play' />
                            <span>Run</span>
                        </Button>
                    </div>
                ) : null
                }
                {permission.change && data.report_on !== 'INVENTORY' ? (
                    <div>
                        <NavLink to={`/reports/edit/${data.id}/?next=${props.currentPage}`}>
                            <Button
                                variant='table-row-secondary'
                                icon='icon icon-edit'
                            >
                                Edit
                            </Button>
                        </NavLink>
                    </div>
                ) : null
                }
                {permission.delete && data.report_on !== 'INVENTORY' ? (
                    <div>
                        <Button onClick={() => { showWarning(data.id, data.name) }} variant='table-row-delete'>
                            <span className='icon glyphicon glyphicon-trash' />
                            <span>Delete</span>
                        </Button>
                    </div>
                ) : null
                }
                {downloadPermission && !(data.report_on === 'ENTITY') ? (
                    <div>
                        {
                            data.report_type !== 4 ? (
                                <NavLink to={`/reports/${data.id}/scheduler?report_type=${data.report_type}`}>
                                    <button
                                        type='button'
                                        className='table_btn'
                                        style={{
                                            backgroundColor: 'transparent',
                                            border: '1px solid var(--main-first-button-color)'
                                        }}
                                    >
                                        <span className='icon icon-edit' />
                                        <span>Schedule</span>
                                    </button>
                                </NavLink>
                            ) : null
                        }
                    </div>
                ) : <div />
                }
            </td>
        </tr>
    )
}

export default ReportsRow
