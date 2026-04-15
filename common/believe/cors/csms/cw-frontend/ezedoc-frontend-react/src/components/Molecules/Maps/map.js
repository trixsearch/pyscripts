/* eslint-disable react/forbid-prop-types */
import React, { useEffect, useState, useRef } from 'react';
import GeoSuggest from 'react-geosuggest';
import GeoCode from 'react-geocode';
import cx from 'classnames';
import PropTypes from 'prop-types';
import {
  Map, Marker, GoogleApiWrapper, Circle,
} from 'google-maps-react';
import { get } from 'lodash';
import markerIcon from '../../../assets/images/svg/location_map.svg';
import styles from './map.module.scss'; 
import { loadAsset } from '../../utils.js';

const API_KEY = process.env.REACT_APP_GOOGLE_API_PLACE_SUGGESTION_KEY;
GeoCode.setApiKey(API_KEY);

const initialState = {
  showSuggestion: true,
  lat: 0,
  lng: 0,
  zoom: 5,
};

const {
  container,
  geosuggest,
  geosuggestText,
  geosuggestSuggestions,
  geosuggestInput,
  defaultContainer,
  geosuggestItem,
  hide,
} = styles;

const MapComponent = ({
  google, containerClass, radius, onLocationChange, showMap, placeholder, types, defaultValue,
  pos, disabled,
}) => {
  const [state, setState] = useState(initialState);
  const suggesrRef = useRef('');
  const {
    lat, lng, zoom, showSuggestion,
  } = state;

  const getAddress = (latitude, longitude, label) => {
    onLocationChange({
      lat: latitude,
      lng: longitude,
      rawInput: label,
    });
  };

  const onSuggestSelect = (suggest) => {
    if (get(suggest, 'location.lat', false) && get(suggest, 'location.lng', false)) {
      const { location: { lat: latitude, lng: longitude } } = suggest;
      setState({
        ...state,
        lat: latitude,
        lng: longitude,
        showSuggestion: false,
      });
      getAddress(latitude, longitude, suggest.label);
    }
  };

  useEffect(() => {
    if (navigator && navigator.geolocation && !pos.lat && !pos.lng) {
      navigator.geolocation.getCurrentPosition((positon) => {
        const { coords } = positon;
        setState({
          ...initialState,
          lat: coords.latitude,
          lng: coords.longitude,
          zoom: 13,
        });
      });
    }
  }, []);

  useEffect(() => {
    if (typeof pos.lat === 'number' && typeof pos.lng === 'number') {
      setState({
        ...state,
        lat: pos.lat,
        lng: pos.lng,
        zoom: 13,
      });
    }
  }, [pos]);

  const coords = { lat, lng };
  const renderSuggestItem = (suggest) => {
    const { description } = suggest;
    return (
      <div>
        <p className={geosuggestText}>{description}</p>
      </div>
    );
  };

  const onInputChange = (e) => {
    if (!showSuggestion) {
      setState({
        ...state,
        showSuggestion: true,
      });
    }
    onLocationChange({
      lat: 0, lng: 0, address: '', rawInput: e,
    });
  };

  const centerMoved = (props, map, coord) => {
    const { latLng } = coord;
    const latitude = latLng.lat();
    const longitude = latLng.lng();
    setState({
      ...state,
      lat: latitude,
      lng: longitude,
    });
    suggesrRef.current.clear();
    getAddress(latitude, longitude);
  };

  const onInputBlur = () => {
    setState({
      ...state,
      showSuggestion: false,
    });
  };
  if (!showMap) {
    return (
      <GeoSuggest
        className={geosuggest}
        inputClassName={geosuggestInput}
        placeholder={placeholder}
        suggestsClassName={cx(geosuggestSuggestions, { [`${hide}`]: !showSuggestion })}
        onSuggestSelect={onSuggestSelect}
        renderSuggestItem={renderSuggestItem}
        onChange={onInputChange}
        ref={suggesrRef}
        types={types}
        initialValue={defaultValue}
        suggestItemClassName={geosuggestItem}
        autoComplete="off"
        onBlur={onInputBlur}
        disabled={disabled}
      />
    );
  }
  return (
    <div className={cx(container, containerClass)}>
      <Map
        google={google}
        initialCenter={coords}
        center={{
          lat,
          lng,
        }}
        zoom={zoom}
        mapTypeControl={false}
        style={{
          width: '100%',
          height: '100%',
        }}
        fullscreenControl={false}
        containerStyle={{
          position: 'relative',
          width: '100%',
          height: '100%',
        }}
      >
        <div className="ml-5 mr-5 pt-2">
          <GeoSuggest
            className={geosuggest}
            inputClassName={geosuggestInput}
            placeholder="Search your location"
            suggestsClassName={cx(geosuggestSuggestions, { [`${hide}`]: !showSuggestion })}
            onSuggestSelect={onSuggestSelect}
            renderSuggestItem={renderSuggestItem}
            onChange={onInputChange}
            ref={suggesrRef}
            onBlur={onInputBlur}
            autoComplete="off"
            disabled={disabled}
          />
        </div>
        <Marker
          position={{ lat, lng }}
          draggable={!disabled}
          onDragend={centerMoved}
          icon={{
            url: loadAsset(markerIcon),
          }}
        />
        <Circle
          radius={radius}
          center={coords}
          strokeColor="transparent"
          strokeOpacity={0}
          strokeWeight={5}
          fillColor={styles.primaryBlue100}
          fillOpacity={0.2}
        />
      </Map>
    </div>
  );
};

MapComponent.propTypes = {
  /**
   * class for the container, useful for modifying height and width
   */
  containerClass: PropTypes.string,
  /**
   * radius of the location in meters
   */
  radius: PropTypes.number,
  /**
   * onLocationChange callback {lat, lng, address, rawInput} whenever loaction updates
   */
  onLocationChange: PropTypes.func,
  /**
   * if we need to show map or not, useful for only location search use cased
   */
  showMap: PropTypes.bool,
  /**
   * Placeholder for input feild
   */
  placeholder: PropTypes.string,
  /**
   * The types of predictions to be returned. Four types are supported:
   * establishment for businesses,
   * geocode for addresses,
   * (regions) for administrative regions and
   * (cities) for localities.
   * If nothing is specified, all types are returned.
   * Consult the Google Docs for up to date types.
   */
  types: PropTypes.array,
  /**
   * default search value
   */
  defaultValue: PropTypes.string,
  /**
   * positon {lat, lng}
   */
  pos: PropTypes.objectOf(PropTypes.number),
  /**
   * disabled
   */
  disabled: PropTypes.bool,
};

MapComponent.defaultProps = {
  containerClass: defaultContainer,
  radius: 1000,
  onLocationChange: () => null,
  showMap: true,
  placeholder: 'Search Location',
  types: null,
  defaultValue: null,
  pos: { lat: null, lng: null },
  disabled: false,
};

export default GoogleApiWrapper({
  apiKey: API_KEY,
})(MapComponent);
