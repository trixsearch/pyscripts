import React from "react";
import html2canvas from 'html2canvas';
import EzeReactModal from "ezereactcomponents/EzeReactModal";

import { Button } from '../../../components/UI/AppButton/AppButton';

import './IdCard.css';

const ModalDesktopStyles = {
  content: {
    top: '50%',
    left: '50%',
    width: '500px',
    height: '600px',
    transform: 'translate(-50%, -50%)'
  }
}

const IdCard = (props) => {
  const html2CanvasCreation = () => {
    html2canvas(document.getElementById('companyIdCard')).then(canvas => {
      let link = document.createElement('a');
      link.download = `${props.personName ? `${props.personName}_` : ''}id_card.png`;
      link.href = canvas.toDataURL()
      link.click();
    });
  }

  return (
    <EzeReactModal
      modalIsOpen={props.open}
      closeModal={props.onClose}
      desktopStyles={ModalDesktopStyles}
    >
      <>
        <div
          className='idCard'
          id='companyIdCard'
          style={
            window.innerWidth > 576
              ? { height: 'calc(100% - 45px)' }
              : { height: window.innerHeight - 85 }
          }
        >
          <div className='idCard_header_color color_box' />
          <div className='idCard_footer_color color_box' />
          <div className='idCard_company_logo'>
            {
              props.orgLogo && (
                <img src={props.orgLogo} alt='company logo' />
              )
            }
          </div>

          <div
            className='idCard_profile_pic'
            style={
              window.innerWidth > 576
                ? { width: '56%' }
                : { width: (window.innerWidth * 62) / 100 }
            }
          >
            <img src={props.profilePic} alt='profile pic' />
          </div>

          <div
            className='idCard_context'
            style={
              window.innerWidth > 576
                ? { height: '36%' }
                : { height: window.innerHeight - 426 }
            }
          >
            <p className='idCard_person_name tac'>{props.personName || ''}</p>
            <p className='idCard_designation tac'>{props.designation || ''}</p>
            <p className='idCard_address tac'>{props.address || ''}</p>
          </div>
        </div>
        <div className='downloadButtonCont'>
          <Button
            variant='primary'
            onClick={html2CanvasCreation}
          >
            Download
          </Button>
        </div>
      </>
    </EzeReactModal>
  );
};

export default IdCard;
