import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import Axios from "axios";
import {NavLink, useParams } from "react-router-dom";
import { handleError } from "store/authConfig";
import { LOCATION_ERROR } from "store/actions/actionTypes";
import { useQueryParams } from "CustomHooks/usePagination";
import { addToast } from "components/Toast/actions";
import Spinner from "components/UI/Spinner/Spinner";
import { Input,Select } from 'antd';
import Button from '../../../components/Atoms/Button';
// import MapInput from "../../../components/MapInput/MapInput";
import Map from '../../../components/Molecules/Maps';
import TagSearch from '../../../components/TagSearch/TagSearch';
import TagSearchModal from "../../../platform-ui-containers-submodule/TagSearch/TagSearchModal/TagSearchModal";
import { getLocations } from './helpers';
import './style.css';

const APP_URL = process.env.REACT_APP_APP_URL;
const NAME_ERROR = "Special Characters are not allowed except Comma, Underscore, Hyphen and the name can not start and end with any special character or space.";
const MISSING_NAME = "Please Enter a valid name!";
const ALPHNUMERIC_ERROR = "Enter alphanumeric names!"
const LOCATION_ERROR_MSG = "Please select a location !"
const BASE_URL = process.env.REACT_APP_PLATFORM_BASE_URL?.replace('api', 'platform');
const TYPE_INTERVIEW = "Interview Location";
const TYPE_BOTH = "Both";

const { Option } = Select;

const LocationCreateEdit = (props) => {
  const { history, match } = props;
  const [loader, setloader] = useState(false);
  const [mode] = useState(match.params.id ? "edit" : "create");
  const [locationData, setLocationData] = useState({
    name:'',
    type: "Interview Location",
    country: "India",
  });
  const [locationField,setLocationField] = useState({
    siteName:'',
    siteLocation:'',
  })
  const [nameError, setNameError] = useState();
  const [locationError, setLocationError] = useState();
  const [locations, setLocations] = useState();
  const [showModal, setShowModal] = useState();
  const { uuid: orgId } = useParams();
  const { next = 1 } = useQueryParams();

  useEffect(() => {
    if (orgId && match.params.id) {
      setloader(true);
      Axios.get(`${APP_URL}/${orgId}/locations/${match.params.id}`).then(response => {
        const {
          name, type, address, city, state, country, longitude, latitude,
        } = response.data?.data ?? {}
        setLocationData((currentData) => ({
          ...currentData, name, type, address, city, state, country, longitude, latitude,
        }))
      }).catch().finally(() => setloader(false))
    }
  }, [orgId, match.params.id])

  // eslint-disable-next-line consistent-return
  const handleSubmit = (childData) => {
    let name = locationField.siteName?.replace(/^\s+|\s+$/gm, '') || locationData.name;
    let locality=locationField.siteLocation;
    if (!name) return setNameError(MISSING_NAME);
    if (/^\d+$/.test(name)) return setNameError(ALPHNUMERIC_ERROR);
    if(!childData.longitude&&!childData.latitude) return setLocationError(LOCATION_ERROR_MSG);
    if (!/^[a-zA-Z]+[,0-9a-zA-Z_\-\s]*[0-9a-zA-Z]$/.test(name)) return setNameError(NAME_ERROR);
    const payload = {
      ...locationData,
      name,
      address: childData.address + childData.locality,
      locality,
      city: childData.city,
      state: childData.location_state,
      latitude: parseFloat(childData.latitude).toFixed(6),
      longitude: parseFloat(childData.longitude).toFixed(6),
    }
    setLocationData((currentData) => ({
      ...currentData, ...payload,
    }))

    setloader(true);

    Axios({
      method: mode === "create" ? "POST" : "PUT",
      url:
        mode === "create"
          ? `${APP_URL}/${orgId}/locations/`
          : `${APP_URL}/${orgId}/locations/${match.params.id}`,
      data: payload,
    })
      .then((response) => {
        props.addToast("success", "Success", response.data.message);
        history.push(`/custom-workflow/org/${orgId}/config/location?page=${next}`);
      })
      .catch((err) => {
        handleError({
          error: err,
          payload: {},
          type: LOCATION_ERROR,
          showToast: true,
        });
        setloader(false);
      });
  };

  // const active = mode === "edit" ? "Edit Location" : "Add Location";

  const updateInputValueName = (evt) => {
    window.sendEvent("Hire_Search_locations")

    setNameError();
    setShowModal(false);
    setLocationData((currentData) => ({
      ...currentData,
      name: evt?.name,
      platform_id: evt?.uuid
    }))
  };

  const handleChange = (value) => {
    setLocationData((currentData) => ({
          ...currentData,
          type:value.length===2 ? "Both" : value[0]
          
        }))
  };

  const handleSiteNameChange = (e) => {
    setLocationField((currentData) => ({
          ...currentData,
          siteName:e.target.value
          
        }))
  };

  const handleSiteLocationChange = (e) => {
    setLocationField((currentData) => ({
          ...currentData,
          siteLocation:e.target.value
        }))
  };

  // eslint-disable-next-line consistent-return
  const searchLocation = async (e) => {
    if (!e) return setLocations([]);
    let response = await getLocations(e, orgId);
    if (response.length) {
      setLocations([...response]);
    } else {
      setLocations([]);
    }
  };

  const getCity = (addressArray) => {
    let city = "";
    for (let i = 0; i < addressArray.length; i+=1) {
      if (
        addressArray[i].types[0]
        && addressArray[i].types[0].includes("locality")
      ) {
        city = addressArray[i].long_name;
        return city;
      }
    }
    return city;
  };

  const getLocationState = (addressArray) => {
    let location_state = "";
    for (let i = 0; i < addressArray.length; i+=1) {
      if (
        addressArray[i].types[0]
        && addressArray[i].types[0].includes("administrative_area_level_1")
      ) {
        location_state = addressArray[i].long_name;
        return location_state;
      }
    }
    return local_state;
  };

  const getLocality = (addressArray) => {
    let locality = "";
    for (let i = 0; i < addressArray.length; i+=1) {
      if (
        addressArray[i].types[0]
        && addressArray[i].types.includes("sublocality")
      ) {
        locality = addressArray[i].long_name;
        return locality;
      }
    
    }
    return locality;
    
  };
  
  const handleLocationChange = (({ lat, lng }) => {
    // make use of lat and lng based on requirement
    if (lat === 0 && lng === 0) {
      return;
    }
    setLocationError();
    const url = `${BASE_URL}/api/platform-services/maps/api/geocode/json?latlng=${lat},${lng}`;
    Axios.get(url).then((res) => {
      let address = res.data.results[0];
      if(!address) return;
      const city = getCity(address.address_components);
      const location_state = getLocationState(address.address_components);
      const locality = getLocality(address.address_components);    
      setLocationData({
 ...locationData,
address: address.formatted_address, 
        latitude: lat, 
        longitude: lng, 
        city, 
        location_state, 
        locality 
      });
    // eslint-disable-next-line no-unused-vars
    }).catch((err) => {
      // eslint-disable-next-line no-console
      console.log(err)
    });
  })

  return (
    <>
      {loader && <Spinner />}

      <div className="main_changable_container">
        <div className="config_add_group_form">
          {/* <LocationForm
            edit={mode === "edit"}
            id={match.params.id}
            saveData={handleSubmit}
            history={history}
            next={next}
            orgId={orgId}
          /> */}
          <div style={{ marginTop: '40px'}}>
            {locationData.type!==TYPE_INTERVIEW
             ?(
             <div className="inputContainer">
              <h7 className="inputLabel">
Name
<span aria-hidden="true" style={{ color: 'red' }}> *</span>
              </h7>
              <div className="inputRow">
                <TagSearch
                  onChange={(value)=>updateInputValueName(value ? value[value.length-1]:null)}
                  onSearch={searchLocation}
                  data={locations}
                  size="large"
                  className="locationSearch"
                  label="Search a location"
                  defaultValue={locationData.name}
                />
                <Button
                  type="save"
                  label="Select from hierarchy"
                  isDisabled={false}
                  className="locationSearchButton"
                  clickHandler={() => setShowModal(true)}
                />
              </div>
            <p style={{ color: 'red', fontSize: '13px', marginLeft: '5px' }}>{nameError}</p>
             </div>
            )
            : null }

            <div className="inputContainer" style={{marginTop:'20px'}}>
              <h7 className="inputLabel">Site Name</h7>
              <div className="inputRow">
              <Input size="large" placeholder="Enter Site Name" className="siteName" value={locationData.name!=='' ? locationData.name : locationField.name} onChange={(e)=>handleSiteNameChange(e)}/>
              </div>
            </div>

            <div className="inputContainer" style={{marginTop:'20px'}}>
              <h7 className="inputLabel">Site Location</h7>
              <div className="inputRow">
              <Input size="large" placeholder="Enter Site Location" className="siteLocation" value={locationData.locality!=='' ? locationData.locality : ''} onChange={(e)=>handleSiteLocationChange(e)}/>
              </div>
            </div>

            {showModal && (
                <TagSearchModal
                showModal={showModal}
                tags={[]}
                orgId={orgId}
                selectTags={({value}) => updateInputValueName(value[0])}
                closeModal={() => setShowModal(false)}
                category="geographical"
                type="site"
                singleTagSelection
                />
                )}
           
            <div className="inputContainer">
            <h7 className="inputLabel">Select location type</h7>
            <Select
                className="mapModalInput"
                mode="multiple"
                size="large"
                placeholder="Select type"
                value={locationData.type===TYPE_BOTH ? ['Interview Location','Work Location'] : locationData.type}
                onChange={handleChange}
                optionLabelProp="label"
            >
                <Option value="Interview Location" label="Interview Location">
                  Interview Location
                </Option>
                <Option value="Work Location" label="Work Location">
                Work Location 
                </Option>
            </Select>
            </div>
            <br/>

           
            <Map
onLocationChange={handleLocationChange}
              pos={{
 lat: parseFloat(locationData.latitude) || 12.97, 
                lng:  parseFloat(locationData.longitude) || 77.59 
}}
              disabled={false}
            />
             <div className="inputContainer" style={{marginTop:'20px'}}>
              <h7 className="inputLabel">
Place the pin for exact work location
<span aria-hidden="true" style={{ color: 'red' }}> *</span>
              </h7>
              <p style={{marginTop:'10px'}}>{locationData.address ? `Selected Address: ${locationData.address}` :''}</p>
              <p style={{ color: 'red', fontSize: '13px', marginLeft: '5px'}}>{locationError}</p>
             </div>
            <div className="cancel_publish_btn" style={{justifyContent:'flex-end'}}>
                <NavLink to={`/custom-workflow/org/${orgId}/config/location?page=${next}`}>
                  <button
                    type="button"
                    className="fancy_btn cancel_button"
                  >
                    Cancel
                  </button>
                </NavLink>
                <button
                  type="button"
                  className="fancy_btn active"
                  onClick={() => {
                    // eslint-disable-next-line no-unused-expressions
                    mode==="edit" ? window.sendEvent("Hire_Location_Successfully_edited",{
                      Location_Edited:locationData.name
                      }) : window.sendEvent("Hire_Successfully_Added_location",{
                        Location_added:locationData.name
                        })
                    handleSubmit(locationData)
                  }}
                >
                  Save
                </button>
            </div>
            {/* <MapInput
              readOnly
              setAddressInInput
              value={locationData}
              handleSubmit={handleSubmit}
              next={next}
              orgId={orgId}
            /> */}
          </div>
        </div>
      </div>
    </>
  );
};

export default connect(null, { addToast })(LocationCreateEdit);
