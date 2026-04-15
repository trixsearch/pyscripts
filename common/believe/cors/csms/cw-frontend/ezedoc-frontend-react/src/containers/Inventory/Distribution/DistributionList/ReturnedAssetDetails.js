/* eslint-disable no-confusing-arrow */
import React, { Fragment } from 'react'
import { Table } from 'antd'
import moment from 'moment'

import { DATETIME_FORMAT } from 'Data/constants'
import { Item } from 'containers/utils'
import Modal from 'components/Modal'
import Spinner from 'components/UI/Spinner/Spinner'

const ReturnedAssetDetails = props => {

    const {
        showModal,
        stateLoader,
        handleModal,
        returnDetails,
    } = props

    const columns = [
        {
            title: 'Old Asset',
            dataIndex: 'old_distribution',
            key: 'oldAsset',
            ellipsis: true,
            render: (old_distribution, record) => old_distribution ? <Item type='text' data={old_distribution} id={record.id} name='distribution-old-distribution' /> : '',
        },
        {
            title: 'New Asset',
            dataIndex: 'new_distribution',
            key: 'newAsset',
            ellipsis: true,
            render: (new_distribution, record) => new_distribution ? <Item type='text' data={new_distribution} id={record.id} name='distribution-new-distribution' /> : '',
        },
        {
            title: 'Time',
            dataIndex: 'created_at',
            key: 'time',
            ellipsis: true,
            render: (created_at, record) => created_at ? <Item type='text' data={moment(created_at).local().format(DATETIME_FORMAT)} id={record.id} name='distribution-created-at' /> : '',
        },
        {
            title: 'Quantity',
            dataIndex: 'quantity',
            key: 'quantity',
            ellipsis: true,
            render: (quantity, record) => quantity ? <Item type='text' data={quantity} id={record.id} name='distribution-quantity' /> : '',
        },
        {
            title: 'Damaged',
            dataIndex: 'damage',
            key: 'isDamaged',
            render: damage => <input type='checkbox' checked={damage} readOnly />
        },
    ]

    return (
        <Fragment>
            { stateLoader && <Spinner /> }
            <Modal
                show={showModal}
                onClose={() => handleModal(false)}
                title='Returned Asset Details'
                primaryBtn={{
                    text: 'Close',
                    className: 'fancy_btn active',
                    onClick: () => handleModal(false),
                }}
            >
                <Table
                    columns={columns}
                    dataSource={returnDetails}
                    rowKey={record => record.id}
                    pagination={false}
                />
            </Modal>
        </Fragment>
    )
}

export default ReturnedAssetDetails
