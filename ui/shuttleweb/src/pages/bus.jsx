import React, { Component } from 'react';
import { Box, Button, Card, CardContent, Container, Grid, Typography } from "@material-ui/core";
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import RemoveOutlinedIcon from '@mui/icons-material/RemoveOutlined';

import { fetchPost } from "./request";
import { Sidebar } from "../components/sidebar";
import '../styles/style.css';


class busPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            onboardcount: 0,
            offboardcount: 0,
            currentTime: new Date(),
            busLoc: {
                lat: 0,
                lng: 0,
            },
            showConfirmation: false,
        };
    };

    componentDidMount() {
        // update the clock every second
        this.interval = setInterval(() => {
          this.setState({ currentTime: new Date() });
        }, 1000);
        
        // upload the location every minute
        setInterval(this.handleLocationUpload, 60000);
    };

    componentWillUnmount() {
        clearInterval(this.interval);
    };

    getLocation = () => {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                position => {
                    const busLoc = {
                    lat: position.coords.latitude.toFixed(8),
                    lng: position.coords.longitude.toFixed(8),
                    };
                    resolve(busLoc);
                },
                error => reject(error)
                );
            } else {
                reject(new Error("Geolocation is not supported by this browser."));
            }
        });
    };
    
    handleLocationUpload = () => {
        this.getLocation().then((busLoc) => {
            let auth = localStorage.getItem("auth")
            const uploadParams = {
                "username": localStorage.getItem("username"),
                'timeStamp': formatDate(new Date().toLocaleString()) + "T" + new Date().toTimeString().slice(0, 5),
                'latitude': busLoc.lat,
                'longitude': busLoc.lng,
                'bus_number': 1
            };
        
            // only bus driver accounts will record location info to the database
            if ( busLoc.lat !== 0 && busLoc.lng !== 0 ) {
                if ( auth === "3" ) {
                    fetchPost('/api/bus/uploadBusLocation', uploadParams, this.uploadCallback);
                }
            }
        }).catch((error) => {
            console.error(error);
        });
    };

    resetCount  = () => {
        this.setState((prevState)=> ({onboardcount: 0, offboardcount: 0}));
    };

    onBoardIncrement = () => {
    this.setState((prevState)=>({ onboardcount: prevState.onboardcount + 1 }));
    };

    onBoardDecrement = () => {
        this.setState((prevState)=>({ onboardcount: prevState.onboardcount - 1 }));
    };
    offBoardIncrement = () => {
        this.setState((prevState)=>({ offboardcount: prevState.offboardcount + 1 }));
    };
    
    offBoardDecrement = () => {
        this.setState((prevState)=>({ offboardcount: prevState.offboardcount - 1 }));
    };

    handleSubmit = async () => {
        try {
            const busLoc = await this.getLocation();
            this.setState((prevState)=> ( { busLoc: busLoc })); // Update the state with the bus location
          } catch (error) {
            console.error('Error getting location:', error);
          }
        const { offboardcount, onboardcount, busLoc} = this.state;
        const bus_number = 1;
        const uploadParams = {
            username: localStorage.getItem("username"),
            onboard_count: onboardcount,
            offboard_count: offboardcount,
            bus_number: bus_number,
            timeStamp: formatDate(new Date().toLocaleString()) + "T" + new Date().toTimeString().slice(0, 5),
            longitude: busLoc.lng,
            latitude: busLoc.lat

        }
        fetchPost('/api/bus/createCount', uploadParams, this.uploadCallback);
        this.resetCount();
        this.setState({ showConfirmation: true });
        setTimeout(() => {
            this.setState({ showConfirmation: false });
        }, 3000);
    };

    uploadCallback = (data) => {
    };

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

    reportCallback = (data) => {
        alert(data.msg)
    };

    handleReport = (e) => {
        e.preventDefault();

        this.getLocation().then((busLoc) => {
            const busParam = {
                'driver_name': localStorage.getItem('username'),
                'lat': busLoc.lat,
                'lng': busLoc.lng
            }
            fetchPost("/api/bus/generateBusEmergencyMessage", busParam, this.reportCallback)
          });
    };

    render() {
        const formattedTime = this.state.currentTime.toLocaleTimeString();
        const { offboardcount, onboardcount } = this.state;

        return (
            <Container maxWidth="xl">
                <Sidebar username={localStorage.getItem("username")} />
                <br/>
                <Typography
                    component="h1"
                    variant="h4"
                    align="center"
                    color="text.primary"
                    gutterBottom
                >
                    Passenger Counter
                </Typography>
                <br/>
                <Container maxWidth="md">
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <h5>Current Time: <strong>{formattedTime}</strong></h5>
                        </Grid>
                        <Grid item xs={12} sm={12} md={12} lg={12}>
                            <Grid container spacing={2} justifyContent="space-between">
                                <Grid item xs={6} sm={6} md={6} lg={6}>
                                    <h5>Passengers Onboard</h5>
                                    <Box display="flex" alignItems="center">
                                        <Button
                                            variant="contained"
                                            color="secondary"
                                            onClick={this.onBoardDecrement}
                                            disabled={onboardcount === 0}
                                        >
                                            <RemoveOutlinedIcon fontSize="medium" />
                                        </Button>
                                        <Typography variant="h5" sx={{ mx: 2 }}>
                                            &nbsp;{onboardcount}&nbsp;
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={this.onBoardIncrement}
                                        >
                                            <AddOutlinedIcon fontSize="medium" />
                                        </Button>
                                    </Box>
                                </Grid>
                                <Grid item xs={6} sm={6} md={6} lg={6}>
                                    <h5>Passengers Offloaded</h5>
                                    <Box display="flex" alignItems="center">
                                        <Button
                                            variant="contained"
                                            color="secondary"
                                            onClick={this.offBoardDecrement}
                                            disabled={offboardcount === 0}
                                        >
                                            <RemoveOutlinedIcon fontSize="medium" />
                                        </Button>
                                        <Typography variant="h5" sx={{ mx: 2 }}>
                                            &nbsp;{offboardcount}&nbsp;
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={this.offBoardIncrement}
                                        >
                                            <AddOutlinedIcon fontSize="medium" />
                                        </Button>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Grid>

                        <Grid item xs={12} container>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={this.handleSubmit}
                                disabled={offboardcount === 0 && onboardcount === 0}
                            >
                                Submit
                            </Button>
                        </Grid>
                        {this.state.showConfirmation && (
                            <Grid item xs={12}>
                                <Card>
                                <CardContent>
                                    <Typography variant="h5">Success!</Typography>
                                    <Typography variant="body1">
                                    Your passenger count has been submitted successfully.
                                    </Typography>
                                </CardContent>
                                </Card>
                            </Grid>
                        )}
                        <Grid item xs={12} container mt={4} mb={4}>
                            <Box textAlign="center" position="absolute" bottom="2%">
                                <Button color="secondary" variant="contained" onClick={this.handleReport} fullWidth>
                                    Emergency Report
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Container>
            </Container>
        )
    };
}


export default busPage;


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
