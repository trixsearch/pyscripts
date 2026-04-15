import React, { Component } from "react";
import {
  withScriptjs,
  withGoogleMap,
  GoogleMap,
  Marker,
} from "react-google-maps";
import { compose, withProps, lifecycle } from "recompose";
import "./MapInput.css";
import { NavLink } from "react-router-dom";
import { SearchBox } from "react-google-maps/lib/components/places/SearchBox";

// const defaultMapOptions = {
//   fullscreenControl: false,
//   disableDefaultUI: true,
//   mapTypeControl: false,
//   zoomControl: true,
// };
const GOOGLE_MAP_API = process.env.REACT_APP_GOOGLE_MAP_API;

class MapInput extends Component {
  constructor(props) {
    super(props);
    this.state = {
      initialLocation: "",
      address: "",
      city: "",
      locality: "",
      location_state: "",

      location: {
        coordinates: [77.688, 12.906], // lon, lat
      },
    };
  }

  componentDidMount() {
    if (this.props.value) {
      const {
        longitude, latitude, address, city
      } = this.props.value
      if (longitude && latitude) {
        this.setState({
          location: {
            coordinates: [Number(longitude), Number(latitude)]
          },
          address,
          city,
        });
      }
    }
  }

  componentDidUpdate(prevProps) {
    let { value, id, initialLocation } = this.props;
    if (prevProps.id !== id) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({
        address: "",
        city: "",
        locality: "",
        location_state: "",

        location: {
          coordinates: [77.688, 12.906],
        },
      });
    } else if (prevProps.value && value) {
      if (prevProps.value.address !== value.address)
        // eslint-disable-next-line react/no-did-update-set-state
        this.setState({ ...value });
    }
    if (prevProps.initialLocation !== initialLocation) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ initialLocation });
    }
    if (prevProps.value !== value) {
      const {
        longitude, latitude, address, city
      } = value
      if (longitude && latitude) {
        // eslint-disable-next-line react/no-did-update-set-state
        this.setState({
          location: {
            coordinates: [Number(longitude), Number(latitude)]
          },
          address,
          city,
        });
      }
    }
  }

  fromAddress = (address) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address }).then((response) => {
      const location = response.results[0].geometry.location;
      const addressArray = response.results[0].address_components;
      const city = this.getCity(addressArray);
      const location_state = this.getLocationState(addressArray);
      const locality = this.getLocality(addressArray);
      // zoomba
      this.setState({
        city: city || "",
        locality: locality || "",
        location_state: location_state || "",

        location: {
          coordinates: [location.lng(), location.lat()],
        },
      });
    // eslint-disable-next-line no-console
    }).catch(e => { console.log("error is", e) })
  };

  onMarkerDragEnd = (event) => {
    const { latLng } = event;
    const lat = latLng.lat();
    const lon = latLng.lng();

    const geocoder = new google.maps.Geocoder();
    geocoder
      .geocode({ location: { lat: lat, lng: lon } })
      .then((response) => {
        const address = response.results[0].formatted_address;
        const addressArray = response.results[0].address_components;
        const city = this.getCity(addressArray);
        const location_state = this.getLocationState(addressArray);
        let locality = this.getLocality(addressArray);

        document.getElementById("autocompleteModal_id").value = address;

        this.setState({
          location: {
            coordinates: [lon, lat],
          },
          address: address || "",
          city: city || "",
          locality: locality || "",
          location_state: location_state || "",
        });
      })

      // eslint-disable-next-line no-console
      .catch((error) => console.error(error));
  };

  getCity = (addressArray) => {
    let city = "";
    for (let i = 0; i < addressArray.length; i += 1) {
      if (
        addressArray[i].types[0]
        && addressArray[i].types[0].includes("locality")
      ) {
        city = addressArray[i].long_name;
        return city;
      }
    }
    return "";
  };

  getLocationState = (addressArray) => {
    let location_state = "";
    for (let i = 0; i < addressArray.length; i += 1) {
      if (
        addressArray[i].types[0]
        && addressArray[i].types[0].includes("administrative_area_level_1")
      ) {
        location_state = addressArray[i].long_name;
        return location_state;
      }
    }
    return ""

  };

  getLocality = (addressArray) => {
    let locality = "";
    for (let i = 0; i < addressArray.length; i += 1) {
      if (
        addressArray[i].types[0]
        && addressArray[i].types.includes("sublocality")
      ) {
        locality = addressArray[i].long_name;
        return locality;
      }
    }
    return "";
  };

  getLocation = (address, from) => {
    if (address === undefined) {
      return;
    }

    if (from === "MAPMODAL") {
      this.fromAddress(address);
    }

    this.setState({ address });
  };

  // shouldComponentUpdate(nextProps, nextState) {
  //   if (this.state.location[0] === nextState.location[0]) {
  //     return false
  //   } else {
  //     return true
  //   }
  // }

  render() {
    const MapWithASearchBox = compose(
      withProps({
        googleMapURL: `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAP_API}&v=3.exp&libraries=geometry,drawing,places`,
        loadingElement: <div style={{ height: `100%` }} />,
        containerElement: <div style={{ height: `400px` }} />,
        mapElement: <div style={{ height: `100%` }} />,
      }),
      lifecycle({
        componentWillMount() {
          const refs = {}
    
          this.setState({
            bounds: null,
            center: {
              lat: 41.9, lng: -87.624
            },
            markers: [],
            onMapMounted: ref => {
              refs.map = ref;
            },
            onBoundsChanged: () => {
              this.setState({
                bounds: refs.map.getBounds(),
                center: refs.map.getCenter(),
              })
            },
            onSearchBoxMounted: ref => {
              refs.searchBox = ref;
            },
            onPlacesChanged: () => {
              const places = refs.searchBox.getPlaces();
              const bounds = new google.maps.LatLngBounds();
    
              places.forEach(place => {
                if (place.geometry.viewport) {
                  bounds.union(place.geometry.viewport)
                } else {
                  bounds.extend(place.geometry.location)
                }
              });
              const nextMarkers = places.map(place => ({
                position: place.geometry.location,
              }));
              // eslint-disable-next-line react/no-access-state-in-setstate
              const nextCenter = _.get(nextMarkers, '0.position', this.state.center);
    
              this.setState({
                center: nextCenter,
                markers: nextMarkers,
              });
              // refs.map.fitBounds(bounds);
            },
          })
        },
      }),
      withScriptjs,
      withGoogleMap
    )(props => (
      <GoogleMap
        ref={props.onMapMounted}
        defaultZoom={15}
        center={props.center}
        onBoundsChanged={props.onBoundsChanged}
      >
        <SearchBox >
          {/* <input
            type="text"
            placeholder="Customized your placeholder"
            style={{
              boxSizing: `border-box`,
              border: `1px solid transparent`,
              width: `240px`,
              height: `32px`,
              marginTop: `27px`,
              padding: `0 12px`,
              borderRadius: `3px`,
              boxShadow: `0 2px 6px rgba(0, 0, 0, 0.3)`,
              fontSize: `14px`,
              outline: `none`,
              textOverflow: `ellipses`,
            }}
          /> */}
        </SearchBox>
        {props.markers.map((marker) => <Marker key={marker.position} position={marker.position} />)}
      </GoogleMap>
));
    // const MyMapComponent = compose(
    //   withProps({
    //     googleMapURL: `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAP_API}&v=3.exp&libraries=geometry,drawing,places`,
    //     loadingElement: <div style={{ height: `100%` }} />,
    //     containerElement: <div style={{ height: `400px` }} />,
    //     mapElement: <div style={{ height: `100%` }} />,
    //   }),
    //   withScriptjs,
    //   withGoogleMap
    // )((props) => (
    //   <GoogleMap
    //     defaultZoom={15}
    //     defaultCenter={{
    //       lat: props.markerPosition.lat,
    //       lng: props.markerPosition.lon,
    //     }}
    //     defaultOptions={defaultMapOptions}
    //   >
    //     <SearchBox
    //       ref={props.onSearchBoxMounted}
    //       bounds={props.bounds}
    //       controlPosition={google.maps.ControlPosition.TOP_LEFT}
    //       onPlacesChanged={props.onPlacesChanged}
    //     >
    //       <input
    //         type="text"
    //         placeholder="Customized your placeholder"
    //         style={{
    //           boxSizing: `border-box`,
    //           border: `1px solid transparent`,
    //           width: `240px`,
    //           height: `32px`,
    //           marginTop: `27px`,
    //           padding: `0 12px`,
    //           borderRadius: `3px`,
    //           boxShadow: `0 2px 6px rgba(0, 0, 0, 0.3)`,
    //           fontSize: `14px`,
    //           outline: `none`,
    //           textOverflow: `ellipses`,
    //         }}
    //       />
    //     </SearchBox>
    //     <Marker
    //       google={window.google}
    //       draggable
    //       onDragEnd={props.onDragEnd}
    //       position={{
    //         lat: props.markerPosition.lat,
    //         lng: props.markerPosition.lon,
    //       }}
    //       onPositionChanged={props.onPositionChanged}
    //     />
    //     <Marker />
    //   </GoogleMap>
    // ));

    const { address, location } = this.state;
    const { coordinates } = location;
    const { readOnly, setAddressInInput } = this.props;

    let inputProp = {};

    // if (type === mapType.work) {
    //   inputProp = { onKeyPress: this.addLocation };
    // }

    if (setAddressInInput) {
      inputProp.value = address;
    }

    if (readOnly) {
      inputProp.value = address;
    }

    return (
      <div>
        <div
          style={{
            height: "40%",
            // width: "90%",
            display: "block",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <div className="inputContainer">
            <h7 className="inputLabel">Place the pin for exact work location</h7>

            <div className="form-group">
              <div className="mapModalInput">
                {/* <Autocomplete
                  apiKey={GOOGLE_MAP_API}
                  id="autocompleteModal_id"
                  className="autocomplete"
                  defaultValue={address}
                  placeholder="Search address"
                  onPlaceSelected={(place) =>
                    this.getLocation(place.formatted_address, "MAPMODAL")
                  }
                  options={{
                    types: [],
                    componentRestrictions: { country: "in" },
                    fields: ["formatted_address"],
                  }}
                /> */}
              </div>
            </div>
            <div className="form-group" style={{ marginTop: '30px' }}>
              <MapWithASearchBox
                markerPosition={{ lat: coordinates[1], lon: coordinates[0] }}
                onDragEnd={this.onMarkerDragEnd}
                loadingElement={<div className="loadingElement" />}
                containerElement={<div className="containerElement" />}
                mapElement={<div className="mapElement" />}
              />
              <br />
              <div className="cancel_publish_btn">
                <NavLink to={`/custom-workflow/org/${this.props.orgId}/config/location?page=${this.props.next}`}>
                  <button
                    type="button"
                    className="fancy_btn"
                  >
                    Cancel
                  </button>
                </NavLink>
                <button
                  type="button"
                  className="fancy_btn active"
                  onClick={() => this.props.handleSubmit(this.state)}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default MapInput;
