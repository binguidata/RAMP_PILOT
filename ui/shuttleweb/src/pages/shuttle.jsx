import React, { Component, useState } from 'react';
import { GoogleApiWrapper } from 'google-maps-react';
import PlacesAutocomplete, { geocodeByAddress, getLatLng } from 'react-places-autocomplete';
import { Form, Modal } from 'react-bootstrap';
import { 
    Box, Button, Container, Grid, Paper, 
    Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, Typography
} from '@material-ui/core';

import { fetchPost } from "./request";
import { Sidebar } from "../components/sidebar";
import '../styles/style.css';


class ShuttlePage extends Component {

    constructor( props ) {
        super( props );
        const refs = {};
        this.state = {

            // fetching fields
            first_name: '',
            passengers: 1,
            date_time: '',
            assistant: '',
            direction: '',
            serviceArea: 'IKEA',

            upcomingTrans: [],

            // for google map markers
            showingInfoWindowNext: false,
            activeMarkerNext: {},
            selectedPlaceNext: {},

            showingInfoWindowShtl: false,
            activeMarkerShtl: {},
            selectedPlaceShtl: {},

            shtlLoc: {
                lat: 0,
                lng: 0,
            },

            nextLoc: {
                lat: 39.8976341,
                lng: -80.1935485,
            },

            shtlAddress: '',
            nextAddress: 'Not Available',
            nextIsPickup: true,
            nextCode: 'Not Available',

            didUpdate: false,
            modalShow: false,

            page: 0,
            rowsPerPage: 10,

            uploadPrompt: '',
            onMapMounted: ref => {
                refs.map = ref;
            },
            onBoundsChanged: () => {
                this.setState({
                    bounds: refs.map.getBounds(),
                    center: refs.map.getCenter()
                });
            },
            nextDriverAction: "",
            shuttleDepoInfo: {},
        };
        this.getLocation = this.getLocation.bind(this);
        this.getCoordinates = this.getCoordinates.bind(this);
        this.updateNextStop = this.updateNextStop.bind(this);
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
            shtlLoc: {
                lat: position.coords.latitude.toFixed(8),
                lng: position.coords.longitude.toFixed(8),
            },
        });
    };

    getDepoInfoCallBack= (data)=>{
        this.setState({
            shuttleDepoInfo: data[0]
        })
    }
    getDepoInfo = () => {
        const userParam = {
            'username': localStorage.getItem( "username" ),
        }
        fetchPost("/api/reservation/getDepoInfo", {userParam}, this.getDepoInfoCallBack);
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

    handleChange = ( event ) => {
        let nam = event.target.name;
        let val = event.target.value;
        this.setState({ [nam]: val });
    };

    handleModalShow = () => {
        this.setState({ modalShow: !this.state.modalShow })
    };

    showNavigate = () => {
        var url = 'https://www.google.com/maps/dir/?api=1&destination='
            + this.state.nextAddress.replaceAll(" ", '+')
            + '&travelmode=driving'
        if (this.state.nextDriverAction == "Return to Depot")
            url = 'https://www.google.com/maps/dir/?api=1&destination='
            + this.state.shuttleDepoInfo.address.replaceAll(" ", '+')
            + '&travelmode=driving'
        window.open(url,'_blank').focus();
    };
    showNavigateCoordinates = (lat,lng) => {
        var nextAddress = lat+','+lng;
        var url = 'https://www.google.com/maps/dir/?api=1&destination='
            + nextAddress
            + '&travelmode=driving'
        window.open(url,'_blank').focus();
    };

    handleModalClose = () => {
        this.setState({ modalShow: false })
    };

    handleReservation = () => {
        this.setState({ didUpdate: !this.state.didUpdate })
    };

    handleChangePage = (event, newPage) => {
        this.setState({ page: newPage });
    };

    handleChangeRowsPerPage = (event) => {
        this.setState({
            rowsPerPage: event.target.value,
            page: 0
        });
    };
    formatDateAndTime(date) {
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
    
        const twelveHour = hours % 12 || 12;
        const paddedMinutes = minutes < 10 ? '0' + minutes : minutes;
    
        return `${month}/${day}/${year} ${twelveHour}:${paddedMinutes} ${ampm}`;
    }
    reservationCallback = (data) => {
        this.setState({
            upcomingTrans: [],
        })
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let extendedData = [];
        data.forEach(item => {
            var comparisonDate = new Date(item.pickupDateTime);
            comparisonDate.setHours(0, 0, 0, 0);
            if (comparisonDate >= today) {
                let pickupRecord = { ...item, operation: 'pickup', time_Sim_pickup: item.pickup_Sim, time_Sim_dropoff: item.dropoff_Sim  };
                extendedData.push(pickupRecord);
            }
        });
        extendedData.sort((a, b) => {
            const keyA = a.isBoarded === false ? a.time_Sim_pickup : a.time_Sim_dropoff;
            const keyB = b.isBoarded === false ? b.time_Sim_pickup : b.time_Sim_dropoff;
        
            if (keyA < keyB) return -1;
            if (keyA > keyB) return 1;
            return 0;
        });
        data = extendedData
        for (let i = 0; i < data.length; i++) {
            let record = {}
            record["id"] = data[i]["id"]
            record["first_name"] = data[i]["firstName"]
            record["shuttle"] = null
            record["shuttleColor"] = null
            record["shuttleMake"] = null
            record["shuttleModel"] = null
            record["shuttlePlatenumber"] = null
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
            record['operation'] = data[i]["operation"]
            record['dropoffLatitude'] = data[i]["dropoffLatitude"];
            record['dropoffLongitude'] = data[i]["dropoffLongitude"];
            record['pickupLatitude'] = data[i]["pickupLatitude"];
            record['pickupLongitude'] = data[i]["pickupLongitude"];

            record["shuttle"] = "shuttle 101"
            record['serviceArea'] = data[i]["serviceArea"];
            record['shuttleColor'] = data[i]["shuttleColor"];
            record['shuttleMake'] = data[i]["shuttleMake"];
            record['shuttleModel'] = data[i]["shuttleModel"];
            record['shuttlePlatenumber'] = data[i]["shuttlePlatenumber"];
            record["confirmation_code"] = data[i]["confirmationCode"]
            record["isBoarded"] = data[i]["isBoarded"]
            record["isAlighted"] = data[i]["isAlighted"]
            record["isCanceled"] = data[i]["isCanceled"]
            record["isMissed"] = data[i]["isMissed"]
            record["phoneNumber"] = data[i]["phoneNumber"]
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

            record['timeDiff'] = record["pickupDateTime"] - Date.now()
            record['waitSimTime'] = data[i]["waitSimTime"]
            record["show"] = false
            record["time_Sim_pickup"] = data[i]["time_Sim_pickup"]
            record["time_Sim_dropoff"] = data[i]["time_Sim_dropoff"]

            if ( record['timeDiff'] < 900000 ) {
                record['eta'] = Math.floor(record['waitSimTime'] / 60 + record['timeDiff'] / 60000)
            } else {
                record['eta'] = 'NA'
            }

            if (
                record['isToday'] === 1
                && record["isAlighted"] === false
                && record["isCanceled"] === false
                && record["isMissed"] === false
            ) {
                this.setState({
                    upcomingTrans: this.state.upcomingTrans.concat(record),
                })
            }
            if (
                record['isToday'] === 1
                && record["isAlighted"] === false
                && record["isCanceled"] === false
                && record["isMissed"] === false
                && record['timeDiff'] < -120000
            ) {
            }

        }
        this.setState({ didUpdate: true })
    };

    updateNextStop() {
        if (this.state.upcomingTrans.length > 0) {
            if (this.state.upcomingTrans[0]["isBoarded"] === false) {
                this.setState({
                    nextAddress: this.state.upcomingTrans[0].pickup_address,
                    nextCode: this.state.upcomingTrans[0].confirmation_code,
                    nextIsPickup: true,
                    nextLoc: {
                        lat: this.state.upcomingTrans[0].pickupLatitude,
                        lng: this.state.upcomingTrans[0].pickupLongitude,
                    },
                })
            } else if (this.state.upcomingTrans[0]["isBoarded"] === true) {
                this.setState({
                    nextAddress: this.state.upcomingTrans[0].dropoff_address,
                    nextCode: this.state.upcomingTrans[0].confirmation_code,
                    nextIsPickup: false,
                    nextLoc: {
                        lat: this.state.upcomingTrans[0].dropoffLatitude,
                        lng: this.state.upcomingTrans[0].dropoffLongitude,
                    },
                })
            }
        }
    }

    uploadCallback = (data) => {
        if ('id' in data) {
            this.setState({ uploadPrompt: "Upload coordinates successfully," })
        } else if ('non_field_errors' in data) {
            this.setState({ uploadPrompt: data['non_field_errors'] })
        } else if ('error' in data) {
            this.setState({ uploadPrompt: data['error'] })
        }
    };

    handleLocationUpload = () => {
        this.getLocation();
        let auth = localStorage.getItem("auth")
        const uploadParams = {
            "username": localStorage.getItem("username"),
            'timeStamp': formatDate(new Date().toLocaleString()) + "T" + new Date().toTimeString().slice(0, 5),
            'latitude': this.state.shtlLoc.lat,
            'longitude': this.state.shtlLoc.lng,
        };

        if ( this.state.shtlLoc.lat !== 0 && this.state.shtlLoc.lng !== 0 ) {
            if ( auth === "1" ) {
                fetchPost('/api/shuttle/uploadShuttleLocation', uploadParams, this.uploadCallback);
            }
        }
    };

    refreshPage() {
        window.location.reload(false);
    }

    reportCallback = (data) => {
        alert(data.msg)
    }

    updateUpcomingTrans = () => {
        let extendedData = [...this.state.upcomingTrans]
        extendedData.sort((a, b) => {
            const keyA = a.isBoarded === false ? a.time_Sim_pickup : a.time_Sim_dropoff;
            const keyB = b.isBoarded === false ? b.time_Sim_pickup : b.time_Sim_dropoff;
        
            if (keyA < keyB) return -1;
            if (keyA > keyB) return 1;
            return 0;
        });
        this.setState({
            upcomingTrans: extendedData
        });
    };

    handleReport = (e) => {
        e.preventDefault();

        if (this.state.upcomingTrans.length > 0) {
            const shuttleParam = {
                'driver_name': localStorage.getItem('username'),
                'first_name': this.state.upcomingTrans[0].first_name,
                'passengers': this.state.upcomingTrans[0].passengers,
                'shuttlePlatenumber': this.state.upcomingTrans[0].shuttlePlatenumber,
                'lat': this.state.shtlLoc.lat,
                'lng': this.state.shtlLoc.lng
            }
            fetchPost("/api/shuttle/generateShuttleEmergencyMessage", shuttleParam, this.reportCallback)
        } else {
            const shuttleParam = {
                'driver_name': localStorage.getItem('username'),
                'first_name': 'NA',
                'passengers': 0,
                'shuttlePlatenumber': 0,
                'lat': this.state.shtlLoc.lat,
                'lng': this.state.shtlLoc.lng
            }
            fetchPost("/api/shuttle/generateShuttleEmergencyMessage", shuttleParam, this.reportCallback)
        }
    }
    
    authoref = () =>{
        const userParam = {
            'username': localStorage.getItem( "username" ),
        }
        fetchPost("/api/reservation/viewShuttle", userParam, this.reservationCallback);
    }

    componentDidMount() {
        const userParam = {
            'username': localStorage.getItem( "username" ),
        }
        fetchPost("/api/reservation/viewShuttle", userParam, this.reservationCallback);
        this.getDepoInfo();

        setInterval(this.handleLocationUpload, 60000);
        setInterval(this.updateNextStop, 60000);
        setInterval(this.calculateNextDriverAction, 15000)
        setInterval(this.authoref, 30000)
    };

    render() {
        return (
            <Container maxWidth="xl">
                <Sidebar username={localStorage.getItem( "username" )}/>
                <Grid container spacing={2} className="feedback-grid">
                    <Grid item xs={12} sm={12} md={12} lg={12}>
                        <Form style={{ marginTop: 20 }}>
                            <div className='ride-options'>
                                <div className='ride-text'>
                                    <h4>
                                        <strong>
                                        {this.state.nextDriverAction == "Return to Depot" ? 
                                            "Return Depot: "+ this.state.shuttleDepoInfo.address: 
                                            this.state.nextIsPickup === true ?
                                                "Next Stop: [Pickup] " + this.state.nextAddress :
                                                "Next Stop: [Dropoff] " + this.state.nextAddress
                                        }
                                        </strong>
                                    </h4>
                                </div>
                                <div className='ride-button-group' > 
                                    <Button color="primary" variant="contained" onClick={this.showNavigate}>
                                        Navigate
                                    </Button>
                                </div>
                            </div>
                            
                            <div>
                                <h4><strong>Confirmation Code: {this.state.nextDriverAction == "Return to Depot"?"Not Avilable":this.state.nextCode}</strong></h4>
                            </div>
                            <div className="ride-divider"/>
                            <Box
                            textAlign="center"
                            style={{
                                margin: '4px',
                                border: '2px solid #007BFF',
                                borderRadius: '5px',
                                backgroundColor: '#F0F8FF',
                                color: '#007BFF',
                                userSelect: 'none',
                                cursor: 'default'
                            }}
                            >
                            <h4>
                                    <strong>
                                        {"Next Action : "+ this.state.nextDriverAction}
                                    </strong>
                                </h4>
                            </Box>
                            <Box textAlign="center">
                                <Button color="primary" variant="contained" onClick={this.refreshPage} fullWidth>
                                    Refresh for new update
                                </Button>
                            </Box>
                            <div className="ride-divider"/>
                            <Box textAlign="center" display="none">
                                <Button color="primary" variant="outlined" onClick={this.handleModalShow} fullWidth>
                                    Add new walk-up order
                                </Button>
                                <ReservationModal
                                    show={this.state.modalShow}
                                    closeHandle={this.handleModalClose}
                                    updateHandle={this.handleReservation}
                                />
                            </Box>
                            <div className="ride-divider"/>
                        </Form>
                    </Grid>

                    <Grid item xs={12} sm={12} md={12} lg={12}>
                        <Paper>
                            <TableContainer className="ride-tableContainer">
                                <Table stickyHeader aria-label="sticky table">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell align="center"><strong>Operation</strong></TableCell>
                                            <TableCell align="center"><strong>Confirmation Code</strong></TableCell>
                                            <TableCell align="center"><strong>First Name</strong></TableCell>
                                            <TableCell align="center"><strong>Balance due</strong></TableCell>
                                            <TableCell align="center"><strong>Number of Passengers</strong></TableCell>
                                            <TableCell align="center"><strong>Phone Number</strong></TableCell>
                                            <TableCell align="center" style={{ display: 'none' }} ><strong>Assistant <br/>(wheelchair Access)</strong></TableCell>
                                            <TableCell align="center"><strong>Pickup Location</strong></TableCell>
                                            <TableCell align="center"><strong>Drop-off Location</strong></TableCell>
                                            <TableCell align="center"><strong>Pickup Time</strong></TableCell>
                                            <TableCell align="center"><strong>Estimated Time of Arrival</strong></TableCell>
                                            <TableCell align="center"><strong>Missed</strong></TableCell>
                                            <TableCell align="center"><strong>Pickup</strong></TableCell>
                                            <TableCell align="center"><strong>Drop Off</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        { this.state.upcomingTrans.slice()
                                            .slice(
                                                this.state.page * this.state.rowsPerPage,
                                                this.state.page * this.state.rowsPerPage + this.state.rowsPerPage
                                            )
                                            .map((item, index) => ((
                                                <TableRow 
                                                    key={ 'upcoming' + index }
                                                    style={{ 
                                                        backgroundColor: index === 0 ? (item.isBoarded ? 'rgba(255, 165, 0, 0.5)' : 'lightgreen') : 'inherit'
                                                    }}
                                                >
                                                    <TableCell align="center">
                                                        {true ? (
                                                            item.isBoarded ? (
                                                                <ReservationOperation
                                                                    id={item.id}
                                                                    date_time={item.pickupDateTime}
                                                                    isBoarded={item.isBoarded}
                                                                    upcomingTrans={this.state.upcomingTrans}
                                                                    shuttle={item.shuttle}
                                                                    operation={'alight'}
                                                                    updateHandle={this.handleReservation}
                                                                />
                                                            ) : (
                                                                <ReservationOperation
                                                                    id={item.id}
                                                                    date_time={item.pickupDateTime}
                                                                    isBoarded={item.isBoarded}
                                                                    upcomingTrans={this.state.upcomingTrans}
                                                                    shuttle={item.shuttle}
                                                                    operation={'board'}
                                                                    updateHandle={this.handleReservation}
                                                                    updateUpcomingTrans={this.updateUpcomingTrans}
                                                                />
                                                            )
                                                        ) : (
                                                            "NA"
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="center">{ item.confirmation_code }</TableCell>
                                                    
                                                    <TableCell align="center">{ item.first_name }</TableCell>
                                                    <TableCell align="center">{ item.balance_due }</TableCell>
                                                    <TableCell align="center">{ item.passengers }</TableCell>
                                                    <TableCell align="center">{ item.phoneNumber }</TableCell>
                                                    <TableCell align="center" style={{ display: 'none' }}>{ item.assistant ? "Yes" : "No" }</TableCell>
                                                    <TableCell align="center">{ item.pickup_address }</TableCell>
                                                    <TableCell align="center">{ item.dropoff_address }</TableCell>
                                                    <TableCell align="center">{ item.date_time_12hr_format }</TableCell>
                                                    <TableCell align="center">{ item.eta }</TableCell>

                                                    <TableCell align="center">
                                                        {item.isBoarded === false ? (
                                                            <ReservationOperation
                                                                id={item.id}
                                                                date_time={item.pickupDateTime}
                                                                isBoarded={item.isBoarded}
                                                                upcomingTrans={this.state.upcomingTrans}
                                                                shuttle={item.shuttle}
                                                                operation={'missed'}
                                                                updateHandle={this.handleReservation}
                                                            />
                                                        ) : (
                                                            <span>Not Available</span>
                                                        )}
                                                </TableCell>
                                                <TableCell>
                                                    <Button color="primary" variant="contained" onClick={() => this.showNavigateCoordinates(item.pickupLatitude,item.pickupLongitude)}>
                                                        Navigate Pickup
                                                    </Button>
                                                </TableCell>
                                                <TableCell>
                                                    <Button color="secondry" variant="contained" onClick={() => this.showNavigateCoordinates(item.dropoffLatitude,item.dropoffLongitude)}>
                                                        Navigate Dropoff
                                                    </Button>
                                                </TableCell>
                                                </TableRow>
                                            )))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <TablePagination
                                rowsPerPageOptions={[5, 10, 20]}
                                component="div"
                                count={this.state.upcomingTrans.length}
                                rowsPerPage={this.state.rowsPerPage}
                                page={this.state.page}
                                onPageChange={this.handleChangePage}
                                onRowsPerPageChange={this.handleChangeRowsPerPage}
                            />
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={12} md={12} lg={12}>
                        <Box textAlign="center" position="absolute" bottom="0px">
                            <Button color="secondary" variant="contained" onClick={this.handleReport} fullWidth>
                                Emergency Report
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </Container>
        )
    }

    calculateNextDriverActionCallback = (data) =>{
          
        const tt_sp = data.data.tt_sp;
        const tt_sd = data.data.tt_sd;
        const tt_dp = data.data.tt_dp;
        const td_sd = data.data.td_sd;

        const pickupDateTime = new Date(this.state.upcomingTrans[0].pickupDateTime);

        const currentTime = new Date();

        const t_delta = pickupDateTime - currentTime;
        const t_delta_sec = t_delta / 1000;

        let nextAction = this.state.nextDriverAction
        if (td_sd <= 5) {
        nextAction = 'Idle: shuttle stays at the current location';
        } else if (t_delta_sec - tt_sp <= (10 * 60) ) {
        nextAction = 'Drive to the next pickup location';
        } else if (tt_sd + tt_dp > t_delta_sec) {
        nextAction = 'Idle: shuttle stays at the current location';
        } else {
            nextAction = 'Return to Depot';
        }
        this.setState({ nextDriverAction: nextAction });
    }
    
    calculateNextDriverAction= ()=>{
        const { upcomingTrans, shtlLoc, tt_dp } = this.state;
    
        let nextAction = this.state.nextDriverAction;
        if (upcomingTrans.length > 0) {
          const nextTrip = upcomingTrans[0];
          if (nextTrip.isBoarded) {
            nextAction = 'Drive to Drop-off';
          } else {
                const requestBody = {
                    "currentLat": this.state.shtlLoc.lat,
                    "currentLng": this.state.shtlLoc.lng,
                    "nextTrip": {
                        "pickupLatitude": this.state.upcomingTrans[0].pickupLatitude,
                        "pickupLongitude": this.state.upcomingTrans[0].pickupLongitude
                    },
                    "username": localStorage.getItem( "username" )
                }
                fetchPost("/api/reservation/req_calculation", requestBody, this.calculateNextDriverActionCallback);
          }
        } else {
            nextAction = 'Return to Depot'
        }
        this.setState({ nextDriverAction: nextAction });
      }
}


export default GoogleApiWrapper({
    apiKey: ( process.env.REACT_APP_GOOGLE_MAPS_API_KEY )
})( ShuttlePage )


export function ReservationOperation ( props ) {

    const [actionModalShow, setActionModalShow] = useState(false)
    const [actionPrompt, setActionPrompt] = useState(<p/>)

    const handleActionShow = () => {
        setActionModalShow(true)
    }

    const handleActionClose = () => {
        setActionModalShow(false)
        setActionPrompt(<p/>)
        setTimeout(() => {
            props.updateHandle()
        }, 800)
        window.location.reload(false);
    }

    const handleBoard = () => {
        const params = {
            'username': localStorage.getItem('username'),
            'tranId': props.id,
            'isBoarded': props.isBoarded,
            'shuttle': props.shuttle,
            'action': props.operation,
            'pickupDateTime': props.date_time,
            'realPickupDateTime': getFormatDateNow(),
            'auth': localStorage.getItem('auth'),
        }

        const boardCallback = (data) => {
            if ('error' in data) {
                setActionPrompt(<p>{data['error']}</p>)
                handleActionShow()
            } else {
                setActionPrompt(<p>Boarding is confirmed!</p>)
                handleActionShow()
                props.upcomingTrans.forEach(e => {
                    if (e.id === props.id) {
                        e.isBoarded = true
                    }
                })
                props.updateUpcomingTrans()
            }
        }

        fetchPost('/api/reservation/action', params, boardCallback)
    }

    const handleMiss = () => {
        const params = {
            'username': localStorage.getItem('username'),
            'tranId': props.id,
            'isBoarded': props.isBoarded,
            'shuttle': props.shuttle,
            'action': props.operation,
            'pickupDateTime': props.date_time,
            'auth': localStorage.getItem('auth'),
        }

        const cancelCallback = (data) => {
            if ('error' in data) {
                setActionPrompt(<p>{data['error']}</p>)
                handleActionShow()
            } else {
                setActionPrompt(<p>You successfully canceled a reservation!</p>)
                handleActionShow()
            }
        }

        fetchPost('/api/reservation/action', params, cancelCallback)
    }

    const handleAlight = () => {
        const params = {
            'username': localStorage.getItem('username'),
            'tranId': props.id,
            'isBoarded': props.isBoarded,
            'shuttle': props.shuttle,
            'action': props.operation,
            'pickupDateTime': props.date_time,
            'realDropoffDateTime': getFormatDateNow(),
            'auth' : localStorage.getItem('auth'),
        }

        const alightCallback = (data) => {
            if ('error' in data) {
                setActionPrompt(<p>{data['error']}</p>)
                handleActionShow()
            } else {
                setActionPrompt(<p>Getting off is confirmed!</p>)
                handleActionShow()
                props.upcomingTrans.forEach(e => {
                    if (e.id === props.id) {
                        e.isAlighted = true
                    }
                })
            }
        }

        fetchPost('/api/reservation/action', params, alightCallback)
    }

    const [confirmModalShow, setConfirmModalShow] = useState(false)
    const [confirmPrompt, setConfirmPropmt] = useState(<p/>)

    const handleConfirmShow = () => {
        setConfirmModalShow(true)
    }

    const handleConfirmClose = () => {
        setConfirmModalShow(false)
    }

    const handleBoardClick = (event) => {
        event.preventDefault();
        setConfirmPropmt(<p>Passengers are boarding?</p>)
        handleConfirmShow()
    }

    const handleAlightClick = (event) => {
        event.preventDefault();
        setConfirmPropmt(<p>Passengers are getting off?</p>)
        handleConfirmShow()
    }

    const handleCancelClick = (event) => {
        event.preventDefault();
        setConfirmPropmt(<p>Cancel the Reservation?</p>)
        handleConfirmShow()
    }
    const handleMissClick = (event) => {
        event.preventDefault();
        setConfirmPropmt(<p>Mark this Reservation Missed?</p>)
        handleConfirmShow()
    }


    return <div>
        {
            (() => {
                if (props.operation === 'board')
                    return <div className='offset-1 col-lg-3'>
                            <Modal show={actionModalShow} onHide={handleActionClose} centered>
                                <Modal.Body>
                                    {actionPrompt}
                                </Modal.Body>
                                <Modal.Footer>
                                    <Button color="primary" variant="outlined" onClick={handleActionClose}>
                                        Close
                                    </Button>
                                </Modal.Footer>
                            </Modal>

                            <ConfirmModal
                                show={confirmModalShow}
                                handleClose={handleConfirmClose}
                                prompt={confirmPrompt}
                                action={handleBoard}
                            />
                            <Button color="primary" variant="outlined" onClick={handleBoardClick}>
                                Boarding Confirm
                            </Button>
                        </div>
                else if (props.operation === 'alight')
                    return <div className='offset-1 col-lg-3'>
                        <Modal show={actionModalShow} onHide={handleActionClose} centered>
                            <Modal.Body>
                                {actionPrompt}
                            </Modal.Body>
                            <Modal.Footer>
                                <Button color="primary" variant="outlined" onClick={handleActionClose}>
                                    Close
                                </Button>
                            </Modal.Footer>
                        </Modal>

                        <ConfirmModal
                            show={confirmModalShow}
                            handleClose={handleConfirmClose}
                            prompt={confirmPrompt}
                            action={handleAlight}
                        />
                        <Button color="primary" variant="outlined" onClick={handleAlightClick}>
                            Getting off Confirm
                        </Button>
                    </div>
                else
                    return <div className='offset-1 col-lg-3'>
                        <Modal show={actionModalShow} onHide={handleActionClose} centered>
                            <Modal.Body>
                                {actionPrompt}
                            </Modal.Body>
                            <Modal.Footer>
                                <Button color="primary" variant="outlined" onClick={handleActionClose}>
                                    Close
                                </Button>
                            </Modal.Footer>
                        </Modal>

                        <ConfirmModal
                            show={confirmModalShow}
                            handleClose={handleConfirmClose}
                            prompt={confirmPrompt}
                            action={handleMiss}
                        />
                        <Button color="primary" variant="outlined" onClick={handleMissClick}>
                            Missed Confirm
                        </Button>
                    </div>
            })()
        }
    </div>

}


export function ConfirmModal ( props ) {
    const handleProceed = () => {
        props.handleClose()
        setTimeout(props.action, 1000)
    }

    return <Modal show={props.show} onHide={props.handleClose} centered>
        <Modal.Body>
            {props.prompt}
        </Modal.Body>
        <Modal.Footer>
            <Button color="primary" onClick={handleProceed}>
                Proceed
            </Button>
            <Button color="primary" onClick={props.handleClose}>
                Close
            </Button>
        </Modal.Footer>
    </Modal>
}


class ReservationModal extends Component {

    constructor ( props ) {
        super ( props );
        this.state = {

            customer: '',
            first_name: '',
            passengers: 1,
            assistant: false,
            direction: '',
            serviceArea: 'IKEA',

            addressWalkup: '2001 Park Manor Blvd, Pittsburgh, PA 15205',
            coordWalkup: {
                lat: 40.4522,
                lng: -80.1676,
            },

            addressDropoff: '',
            coordDropoff: {
                lat: 40.4523192482335,
                lng: -80.16798303065549,
            },

            bookingPrompt: "",

            buttonDisable: false,
        };
    }

    handleChange = ( event ) => {
        let nam = event.target.name;
        let val = event.target.value;
        this.setState({ [nam]: val });
    };

    handleChangeAssistant = () => {
        this.setState({ assistant: !this.state.assistant });
    };

    handleChangeGOOGLE = addressDropoff => {
        this.setState({ addressDropoff });
    };

    handleSelectGOOGLE = addressDropoff => {
        this.setState({ addressDropoff });
        geocodeByAddress( addressDropoff )
            .then(results => getLatLng( results[0] ))
            .then(latLng => {
                this.setState({ coordDropoff: latLng });
            })
            .catch( error => console.error( 'Error', error ) );
    };

    handleShow = () => {
        this.setState({ bookingPrompt: <p/> });
    }

    handleClose = () => {
        this.props.closeHandle();
        window.location.reload(false);
    }

    componentDidMount() {
    }

    submitCallback = (data) => {
        if ('msg' in data) {
            window.alert(data['msg'])
            this.setState({buttonDisable: false})
        } else if ('id' in data) {
            this.setState({
                bookingPrompt: "Reservation made successfully",
            })
            setTimeout(() => {
                this.props.updateHandle()
                this.handleClose()
            }, 2500)
        } else if ('non_field_errors' in data) {
            this.setState({
                bookingPrompt: data['non_field_errors'],
                buttonDisable: false,
            })
        } else if ('error' in data) {
            this.setState({
                bookingPrompt: data['error'],
                buttonDisable: false,
            })
        }
    };

    handleSubmit = ( event ) => {
        event.preventDefault();
        this.setState({buttonDisable: true})
        let randomstring = require("randomstring");
        const submitParams = {
            "username": localStorage.getItem("username"),
            'firstName': "driver",
            'passengers': this.state.passengers,
            'pickupDateTime': formatDate(new Date().toLocaleString()) + "T" + new Date().toTimeString().slice(0, 5),
            'assistant': this.state.assistant,
            'pickupAddress': this.state.addressWalkup,
            'dropoffAddress': this.state.addressDropoff,
            'pickupLatitude': this.state.coordWalkup.lat.toFixed(8),
            'pickupLongitude': this.state.coordWalkup.lng.toFixed(8),
            'dropoffLatitude': this.state.coordDropoff.lat.toFixed(8),
            'dropoffLongitude': this.state.coordDropoff.lng.toFixed(8),
            'pickupPOI': 3,
            'dropoffPOI': -1,
            'pickupPOITravelTime': 0,
            'dropoffPOITravelTime': 60,
            'phoneNumber': 412123456789,
            'shuttle': "",
            'serviceArea': this.state.serviceArea,
            'isBoarded': true,
            'isAlighted': false,
            'isCanceled': false,
            'isPaid': false,
            'isBookedByUser': false,
            'isBookedByDriver': true,
            'isVirtualRider': false,
            'confirmationCode': randomstring.generate(3),
            'auth': localStorage.getItem("auth"),
            'realPickupDateTime': getFormatDateNow(),
        };
        fetchPost('/api/reservation/create', submitParams, this.submitCallback);
    };

    render () {
        return <div>

            <Modal show={this.props.show} onHide={this.props.closeHandle} onShow={this.handleShow} size="lg" centered>
                <Modal.Header>
                    <div>
                        <h5 className="modal-title" id="exampleModalLabel">New Walk-up Reservation</h5>
                    </div>
                    <Button color="primary" onClick={this.handleClose}>
                        <span aria-hidden="true">&times;</span>
                    </Button>
                </Modal.Header>

                <Modal.Body>
                    <label className="ride-label"> Number of Passengers
                        <input
                            type="number"
                            name="passengers"
                            className="form-control"
                            min="1"
                            max="10"
                            required={ true }
                            defaultValue='1'
                            onChange={ this.handleChange }
                        />
                    </label>
                    <br/>

                    <label className="ride-label"> Assistant (Wheelchair Access)
                        <input
                            type="checkbox"
                            name="assistant"
                            className="form-control"
                            onChange={ this.handleChangeAssistant }
                            defaultChecked={ this.state.assistant }
                        />
                    </label>
                    <br/>

                    <label className="ride-label"> Destination
                        <PlacesAutocomplete
                            value={ this.state.addressDropoff }
                            onChange={ this.handleChangeGOOGLE }
                            onSelect={ this.handleSelectGOOGLE }
                        >
                            {({ getInputProps, suggestions, getSuggestionItemProps, loading }) => (
                                <div>
                                    <input
                                        size='50'
                                        {...getInputProps({
                                            placeholder: 'Search Places ...',
                                            className: 'form-control',
                                        })}
                                    />
                                    <div className="autocomplete-dropdown-container">
                                        {loading && <div> Loading... </div>}
                                        {suggestions.map(suggestion => {
                                            const className = suggestion.active
                                                ? 'suggestion-item--active'
                                                : 'suggestion-item';
                                            return (
                                                <div {...getSuggestionItemProps( suggestion, { className } )}>
                                                    <span>{ suggestion.description }</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </PlacesAutocomplete>
                    </label>
                    <br/>
                </Modal.Body>

                <Modal.Footer bsPrefix="modal-footer justify-content-between">
                    <div className='row'>
                        <div className='col-md-6'>
                            <Button color="primary"
                                    disabled={this.state.buttonDisable}
                                    onClick={this.handleSubmit}>Book!</Button>
                        </div>
                        <div className='col-md-6'>
                            <Button color="primary" onClick={this.handleClose}>Cancel</Button>
                        </div>
                    </div>
                    <div>{this.state.bookingPrompt}</div>
                </Modal.Footer>

            </Modal>

        </div>
    }

}


const formatNum = (num) => {
    if (num < 10) {
        return "0" + num
    } else {
        return num.toString()
    }
}


const GetCurrentDate = () => {
    const date = new Date();
    return date.getMonth() + 1 + "/" + date.getDate() + "/" + date.getFullYear()
}


function getFormatDateNow() {
    let today = new Date()
    return String(formatDate(today) + "T" + today.getHours() + ":"
                + today.getMinutes() + ":" + today.getSeconds())
}


function formatDate(date) {
    let d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;

    return [year, month, day].join('-');
}
