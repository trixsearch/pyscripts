import React from "react";
import { Link, NavLink, useParams } from "react-router-dom";
import routes from 'urls'

import { Button } from "components/UI/AppButton/AppButton";
import { EntityPhoto, email_test, display_var_check } from "../Process/ProcessComponents";
import userProfilePlaceholderImg from "../../assets/images/svg/userplaceholder.svg";

import './components.css';

const CardItem = props => {
  return (
    <div className={props.className}>
      <p>{props.name}</p>
      <h6>{props.value}</h6>
    </div>
  )
}

const Card = props => {
  let {
 entity_fields, open, redirect, jobId, eventId, profileButton 
} = props;
  const { uuid: orgId } = useParams();

  let dynamic_fields = entity_fields && Object.keys(entity_fields).filter(item => item !== 'entity_name' && item !== 'entity_photo')
  if (!open) {
    return (
      <div className="card1">
        {entity_fields.entity_photo && entity_fields.entity_photo.length > 0 ? (
          <EntityPhoto url={entity_fields.entity_photo[0].data.url} />
        ) : (
          <img src={userProfilePlaceholderImg} alt='placeholder' className='image-cropper no-border' />
        )}
        <div className="card_texts">
          <CardItem
            className="card_text card_entity_name"
            name="Name"
            value={entity_fields.entity_name}
          />
          <CardItem
            className="card_text card_entity_dynamic_field1"
            name={dynamic_fields[0] || '-'}
            value={email_test(entity_fields[dynamic_fields[0]] || '') ? '-' : display_var_check(entity_fields[dynamic_fields[0]] || '-')}
          />
          <CardItem
            className="card_text card_entity_dynamic_field2"
            name={dynamic_fields[1] || '-'}
            value={email_test(entity_fields[dynamic_fields[0]] || '') ? '-' : display_var_check(entity_fields[dynamic_fields[1]] || '-')}
          />
          {jobId ? (
            <NavLink
              to={
                eventId
                  ? routes.JOB_VIEW.eventTo(orgId, jobId, eventId, profileButton)
                  : routes.JOB_VIEW.to(orgId, jobId)
              }
            >
              <Button variant="primary">
                Go back
              </Button>
            </NavLink>
          ) : (
<Link to={redirect}>
            {/* <Button variant="primary">
              Hide details
            </Button> */}
</Link>
)}
        </div>
      </div>
    );
  }

  return null;
};

export default Card
