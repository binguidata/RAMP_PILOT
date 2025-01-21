import React, { Component } from 'react';
import { GoogleApiWrapper, InfoWindow, Map, Marker, Polyline } from 'google-maps-react';
import { faMapMarkerAlt, faShuttleVan, faMapPin, faBus } from "@fortawesome/free-solid-svg-icons";
import { 
    Box, Container, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography
} from '@material-ui/core';

import { fetchGet } from "./request";
import { Sidebar } from "../components/sidebar";
import '../styles/style.css';
import { greenePathData, morgantownPathData, washington1PathData, washington2PathData, washington3PathData } from './dataLoader';


const marker_colors = [ 'blue', 'red', 'green' ]


class ETAPage extends Component {

    constructor(props) {
        super(props);
        this.state = {
            latitude: null,
            longitude: null,
            userAddress: null,

            // for google map places autocomplete
            address: '',

            showingInfoWindow: false,
            activeMarker: {},
            selectedPlace: {},

            userLoc: {
                lat: 39.8876341,
                lng: -80.2035485,
            },

            showingShuttleInfoWindow: false,
            activeShuttleMarker: {},
            selectedShuttlePlace: {},
            shuttleLocations: [],
            busLocations:[],
            shuttleLoc: {
                lat: 39.8976341,
                lng: -80.1935485,
            },

            modalShow: false,
            walkIn: false,
            didUpdate: false,

            upcomingTrans: [],

            mapCenter: {
                lat: 39.8976341,
                lng: -80.1935485,
            },

        };
        this.getLocation = this.getLocation.bind(this);
        this.getCoordinates = this.getCoordinates.bind(this);
        this.reverseGeocodeCoordinates = this.reverseGeocodeCoordinates.bind(this);
    };

    getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(this.getCoordinates, this.handleLocationError);
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    };

    getCoordinates(position) {
        this.setState({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            userLoc: {lat: position.coords.latitude, lng: position.coords.longitude},
        });
        this.reverseGeocodeCoordinates();
    };

    reverseGeocodeCoordinates() {
        fetch("https://maps.googleapis.com/maps/api/geocode/json?latlng="+this.state.latitude+","+this.state.longitude+"&sensor=false&key="+process.env.REACT_APP_GOOGLE_MAPS_API_KEY)
            .then(response => response.json())
            .then(data => this.setState({
                userAddress: data.results[0].formatted_address,
            }))
            .catch(error => alert(error))
    }

    handleLocationError(error) {
        switch(error.code) {
            case error.PERMISSION_DENIED:
                alert("User denied the request for Geolocation.")
                break;
            case error.POSITION_UNAVAILABLE:
                alert("Location information is unavailable.")
                break;
            case error.TIMEOUT:
                alert("The request to get user location timed out.")
                break;
            case error.UNKNOWN_ERROR:
                alert("An unknown error occurred.")
                break;
            default:
                alert("An unknown error occurred.")
        }
    };

    onMarkerClick = (props, marker) =>
        this.setState({
            selectedPlace: props,
            activeMarker: marker,
            showingInfoWindow: true
        });

    onShuttleMarkerClick = (props, marker) =>
        this.setState({
            selectedShuttlePlace: props,
            activeShuttleMarker: marker,
            showingShuttleInfoWindow: true
        });

    onMapClicked = () => {
        if (this.state.showingInfoWindow || this.state.showingShuttleInfoWindow ) {
            this.setState({
                showingInfoWindow: false,
                activeMarker: null,
                showingShuttleInfoWindow: false,
                activeShuttleMarker: null,
            })
        }
    };

    handleWalkInShow = () => {
        this.setState({
            walkIn: true,
            modalShow: true,
        })
    };

    handleReserveShow = () => {
        this.setState({
            walkIn: false,
            modalShow: true,
        })
    };

    handleModalClose = () => {
        this.setState({
            modalShow: false,
        })
    };

    // Handle pass to child components to trigger rerender of this component
    updateListHandle = () => {
        this.setState({
            didUpdate: false,
        })
    };
    formatDateAndTime(date) {
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
    
        // Convert hour from 24-hour time to 12-hour time
        const twelveHour = hours % 12 || 12; // Convert 0 hour to 12 for 12 AM
    
        // Pad minutes with leading zero if needed
        const paddedMinutes = minutes < 10 ? '0' + minutes : minutes;
    
        // Format the date and time into a single string
        return `${month}/${day}/${year} ${twelveHour}:${paddedMinutes} ${ampm}`;
    }
    reservationCallback = (data) => {
        this.setState({ upcomingTrans: [] }); // Clear the existing array
        for (let i = 0; i < data.length; i++) {
            let record = {}
            record["id"] = data[i]["id"]
            record["first_name"] = data[i]["firstName"]
            record["shuttle"] = null
            record["passengers"] = data[i]["passengers"]
            let pickupDateTime = new Date(data[i]["pickupDateTime"])
            record['pickupDateTime'] = pickupDateTime
            record['date_time_12hr_format'] = this.formatDateAndTime(pickupDateTime)
            record["date_time"] = pickupDateTime.getMonth() + 1 + "/" + pickupDateTime.getDate()
                + "/" + pickupDateTime.getFullYear() + " " + formatNum(pickupDateTime.getHours()) + ":"
                + formatNum(pickupDateTime.getMinutes())
            record["date"] = pickupDateTime.getMonth() + 1 + "/" + pickupDateTime.getDate()
                + "/" + pickupDateTime.getFullYear()
            record["assistant"] = data[i]["assistant"]
            if ( data[i]["pickupAddress"] === "2001 Park Manor Blvd, Pittsburgh, PA 15205" ) {
                record["pickup_address"] = "IKEA Station"
            } else {
                record["pickup_address"] = data[i]["pickupAddress"]
            }
            if ( data[i]["dropoffAddress"] === "2001 Park Manor Blvd, Pittsburgh, PA 15205" ) {
                record["dropoff_address"] = "IKEA Station"
            } else {
                record["dropoff_address"] = data[i]["dropoffAddress"]
            }
            record["shuttle"] = "shuttle 101"
            record["confirmation_code"] = data[i]["confirmationCode"]
            record["isBoarded"] = data[i]["isBoarded"]
            record["isAlighted"] = data[i]["isAlighted"]
            record["isCanceled"] = data[i]["isCanceled"]
            record["isMissed"] = data[i]["isMissed"]
            if ( data[i]["isPaid"] ) {
                record['balance_due'] = 'Paid'
            } else {
                record['balance_due'] = 'Cash $'+(data[i]["passengers"]*0.25).toFixed(2).toString()
            }
            let currentDate = GetCurrentDate()
            if ( record['date'] === currentDate ) {
                record['isToday'] = 1
            } else {
                record['isToday'] = 0
            }
            record['eta'] = data[i]['etaTime']
            record['timeDiff'] = record["pickupDateTime"] - Date.now()
            record['waitSimTime'] = data[i]["waitSimTime"]
            if (
                record['isToday'] === 1
                && record['isCanceled'] === false
                && record['isMissed'] === false
                && record['isAlighted'] === false
                && record['isBoarded'] === false
            ) {
                this.setState({
                    upcomingTrans: this.state.upcomingTrans.concat(record)
                })
            }
        }
        this.setState({ didUpdate: true })
    };

    getShuttleLocationCallback = (data) => {
        this.setState({
            shuttleLocations: JSON.parse(data),
        })
    };

    getBusLocationCallback = (data) => {
        this.setState({
            busLocations: JSON.parse(data),
        })
    };

    handleUpdate = () => {
        fetchGet("/api/shuttle/getDriverInfo", {}, this.getShuttleLocationCallback);
        fetchGet("/api/bus/getDriverInfo", {}, this.getBusLocationCallback);
    };

    handleEtaUpdate = () => {
        fetchGet("/api/reservation/view", {}, this.reservationCallback);
    }

    componentDidMount() {
        // read location automatically
        this.getLocation();
        fetchGet("/api/reservation/view", {}, this.reservationCallback);
        // get location of shuttles 
        this.handleUpdate()
        setInterval(this.handleUpdate, 30000); 
        setInterval(this.handleEtaUpdate, 60000);       
    };

    render() {
        return (
            <Container maxWidth="xl">
                <Sidebar username={localStorage.getItem("username")}/>
                <Grid container spacing={2} className="eta-grid">
                    <Grid item xs={12} sm={12} md={12} lg={12}>
                        <br/>
                        <Typography
                            component="h1"
                            variant="h4"
                            align="center"
                            color="text.primary"
                            gutterBottom
                        >
                            Estimated Time of Arrival
                        </Typography>
                    </Grid>

                    <Grid item xs={12} sm={12} md={12} lg={12}>
                        <div className="ride-ETA">
                            <h5>
                                <strong>The shuttle will arrive in </strong>
                                <input
                                    type="text"
                                    disabled="true"
                                    size="5"
                                    className="ride-ETA-text-input"
                                    value={
                                        this.state.upcomingTrans.length > 0 ?
                                            parseInt(this.state.upcomingTrans[this.state.upcomingTrans.length - 1].eta) >= -1 ?
                                                Math.floor(this.state.upcomingTrans[this.state.upcomingTrans.length - 1].eta / 60)
                                                :
                                                ' NA'
                                            :
                                            ' NA'
                                    } 
                                />
                                <strong> minutes.</strong>
                            </h5>
                        </div>
                        <h5>
                            Please have your <b>confirmation code</b> ready when you get on board.
                        </h5>
                        <br/>
                    </Grid>

                    <Grid item xs={12} sm={12} md={12} lg={12}>
                        <Paper>
                            <TableContainer className="ride-tableContainer">
                                <Table aria-label="simple table">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell align="center"><strong>Confirmation Code</strong></TableCell>
                                            <TableCell align="center"><strong>First Name</strong></TableCell>
                                            <TableCell align="center"><strong>Number of Passengers</strong></TableCell>
                                            <TableCell align="center"><strong>Assistant <br/>(wheelchair Access)</strong></TableCell>
                                            <TableCell align="center"><strong>Pickup Location</strong></TableCell>
                                            <TableCell align="center"><strong>Drop-off Location</strong></TableCell>
                                            <TableCell align="center"><strong>Pickup Time</strong></TableCell>
                                            <TableCell align="center"><strong>Balance due</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        { this.state.upcomingTrans.slice().reverse()
                                            .map((item, index) => (
                                                <TableRow key={ 'upcoming' + index }>
                                                    <TableCell align="center">{ item.confirmation_code }</TableCell>
                                                    <TableCell align="center">{ item.first_name }</TableCell>
                                                    <TableCell align="center">{ item.passengers }</TableCell>
                                                    <TableCell align="center">{ item.assistant ? "Yes" : "No" }</TableCell>
                                                    <TableCell align="center">{ item.pickup_address }</TableCell>
                                                    <TableCell align="center">{ item.dropoff_address }</TableCell>
                                                    <TableCell align="center">{ item.date_time_12hr_format }</TableCell>
                                                    <TableCell align="center">{ item.balance_due }</TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                        <br/>
                    </Grid>

                    <Grid item xs={12} sm={12} md={12} lg={12}>
                        <Box sx={{ width: '100%', maxWidth: 1850, mx: 'auto', mt: 2, mb: 2 }}>
                            <Map
                                google={this.props.google}
                                initialCenter={{
                                    lat: this.state.mapCenter.lat,
                                    lng: this.state.mapCenter.lng
                                }}
                                style={{
                                    height: "50vh",
                                    width: "95%",
                                    maxWidth: 1850,
                                    borderRadius: "10px",
                                    boxShadow: "0px 0px 10px rgba(0,0,0,0.2)"
                                }}
                                zoom={13}
                                minZoom={10}
                                maxZoom={20}
                                gestureHandling={"greedy"}
                            >

                                {
                                    [
                                        greenePathData,
                                        morgantownPathData,
                                        washington1PathData,
                                        washington2PathData,
                                        washington3PathData,
                                    ].map((pathData, index) => (
                                        <Polyline
                                            key={index}
                                            geodesic={true}
                                            options={{
                                                path: pathData,
                                                strokeColor: '#ff0000',
                                                strokeOpacity: 1,
                                                strokeWeight: 3,
                                                icons: [{
                                                    offset: '0',
                                                    repeat: '10px'
                                                }],
                                            }}
                                        />
                                    ))
                                }

                                {this.state.shuttleLocations.map((item, index) => {
                                    return <Marker
                                        key={index}
                                        label={{
                                            className: "pin-label",
                                            text: item.username,
                                            fontSize: "20px",
                                            fontWeight: "bold",
                                            color: 'red',
                                        }}
                                        position={{
                                            lat: item.lat,
                                            lng: item.log
                                        }}
                                        draggable={false}
                                        title={item.username}
                                        icon={{
                                            path: faShuttleVan.icon[4],
                                            fillColor: 'red',
                                            fillOpacity: 1,
                                            scale: 0.06,
                                            anchor: new this.props.google.maps.Point(
                                                faMapPin.icon[0] / 2,
                                                faMapPin.icon[1]
                                            ),
                                        }}
                                        name={ item.username }
                                    />
                                })}

                                {this.state.busLocations.map((item, index) => {
                                    return <Marker
                                        key={index}
                                        label={{
                                            className: "pin-label",
                                            text: "Waynesburg-Carmichaels shuttle",
                                            fontSize: "20px",
                                            fontWeight: "bold",
                                            color: 'black',
                                        }}
                                        position={{
                                            lat: item.lat,
                                            lng: item.log
                                        }}
                                        title={item.username}
                                        icon={{
                                            path: faBus.icon[4],
                                            fillColor: 'black',
                                            fillOpacity: 1,
                                            scale: 0.06,
                                            anchor: new this.props.google.maps.Point(
                                                faMapPin.icon[0] / 2,
                                                faMapPin.icon[1]
                                            ),
                                        }}
                                        name={ item.username }
                                    />
                                })}

                                <Marker
                                    position={{
                                        lat: this.state.latitude,
                                        lng: this.state.longitude,
                                    }}
                                    icon={{
                                        path: faMapMarkerAlt.icon[4],
                                        fillColor: 'black',
                                        fillOpacity: 1,
                                        scale: 0.06,
                                        anchor: new this.props.google.maps.Point(
                                            faMapMarkerAlt.icon[0] / 2,
                                            faMapMarkerAlt.icon[1]
                                        ),
                                    }}
                                    onClick={ this.onMarkerClick }
                                    name={ 'Your current location:' }
                                />
                                <InfoWindow
                                    marker={this.state.activeMarker}
                                    visible={this.state.showingInfoWindow}
                                >
                                    <div>
                                        <h5>{ this.state.selectedPlace.name }</h5>
                                        <h5>{ this.state.userAddress }</h5>
                                    </div>
                                </InfoWindow>
                            </Map>
                        </Box>
                    </Grid>
                </Grid>
            </Container>
        )
    }
}


const formatNum = (num) => {
    if (num < 10) {
        return "0" + num
    } else {
        return num.toString()
    }
}


export default GoogleApiWrapper({
    apiKey: (process.env.REACT_APP_GOOGLE_MAPS_API_KEY)
})(ETAPage)


const GetCurrentDate = () => {
    const date = new Date();
    return date.getMonth() + 1 + "/" + date.getDate() + "/" + date.getFullYear()
}
