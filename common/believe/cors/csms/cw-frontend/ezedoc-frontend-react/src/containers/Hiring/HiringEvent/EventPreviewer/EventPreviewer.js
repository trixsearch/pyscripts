/* eslint-disable react-hooks/exhaustive-deps */
import React, {
    useState,
    useEffect,
} from 'react'
import { connect } from 'react-redux'
import axios from 'axios'
import { useParams } from 'react-router-dom'
import EzeReactModal from 'ezereactcomponents/EzeReactModal'

import Spinner from 'components/UI/Spinner/Spinner'
import { Button } from 'components/UI/AppButton/AppButton'

import { addToast } from 'components/Toast/actions'

import './EventPreviewer.css'

const APP_URL = process.env.REACT_APP_APP_URL;

const ModalDesktopStyles = {
    content: {
        top: '50%',
        left: '50%',
        width: '500px',
        height: '600px',
        transform: 'translate(-50%, -50%)',
    }
}

const EventPreviewer = props => {
    const [loader, setLoader] = useState(false)
    const [url, setUrl] = useState('')

    const { uuid: orgId } = useParams();

    const protocol = window.location.protocol
    const hostName = window.location.hostname

    const {
        logo,
        eventId,
        addToaster,
        primaryColor,
        payloadData = {},
        openPreviewModal,
        closeModalHandler,
    } = props

    useEffect(() => {
        const templateKey = process.env.REACT_APP_JOB_EVENT_BANNER_TEMPLATE_KEY
        if (openPreviewModal && templateKey) {
            const api = `${APP_URL}/${orgId}/config/document/${templateKey}/template?doc_type=png`
            const payload = {
                ...payloadData,
                logo_url: logo,
                primary_color: primaryColor,
                qr_url: `${protocol}//${hostName}/org/jobs`,
            }

            setLoader(true)
            axios.post(api, payload)
                .then(res => setUrl(res.data[0].url))
                .catch(err => {
                    if (err.response?.data?.message) addToaster('error', 'Error', err.response.data.message)
                    else addToaster('error', 'Error', 'Something went wrong!')
                })
                .finally(() => setLoader(false))
        }
    }, [openPreviewModal])

    const downloadHandler = () => {
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', eventId ? `Event-Banner-${eventId}.png` : 'Event-Banner.png')
        document.body.appendChild(link)
        link.click()
        addToaster('success', 'Success', 'The event banner is downloaded successfully!')
    }

    return (
        <EzeReactModal
            modalIsOpen={openPreviewModal}
            closeModal={closeModalHandler}
            desktopStyles={ModalDesktopStyles}
        >
            <div className='job-event-banner'>
                {loader && <Spinner />}
                <div className='banner-container'>
                    {
                        url && <img src={url} alt='Banner' />
                    }
                    {
                        !url && !loader && <div className='no-data'>No Image</div>
                    }
                </div>
                <Button
                    disabled={!url}
                    variant='primary'
                    onClick={downloadHandler}
                >
                    Download
                </Button>
            </div>
        </EzeReactModal>
    )
}

const mapStateToProps = ({ orgLogo }) => ({
    logo: orgLogo.logo,
    primaryColor: orgLogo.theme.first_primary_color,
})

const mapDispatchToProps = {
    addToaster: addToast,
}

export default connect(mapStateToProps, mapDispatchToProps)(EventPreviewer)
