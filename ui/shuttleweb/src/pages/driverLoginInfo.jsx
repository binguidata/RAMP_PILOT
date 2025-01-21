import React, { Component } from 'react';
import { Box, Button, Container, TextField, InputLabel, Select, MenuItem, Typography } from "@material-ui/core";

import { fetchGet, fetchPost } from "./request";
import { Sidebar } from "../components/sidebar";
import '../styles/style.css';


class shuttleSigninForm extends Component {
    constructor(props) {
        super(props);
        this.state = {
          currentTime: new Date(),
          busLoc: {
            lat: 39.8976341,
            lng: -80.1935485,
          },
          busavailable: [],
          selectedShuttle: {},
          driverName: '',
        };
         this.getLocation = this.getLocation.bind(this);
    };

    componentDidMount() {
        this.requestShuttleStatus() 
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

    handleDriverInformationUpload = () =>{
        let auth = localStorage.getItem("auth");
        const uploadParams ={
            "username": localStorage.getItem("username"),
            "datetimestamp": formatDate(new Date().toLocaleString()) + "T" + new Date().toTimeString().slice(0, 5),
            'latitude': this.state.busLoc.lat,
            'longitude': this.state.busLoc.lng,
            'shuttle_id': this.state.selectedShuttle.id,
            'name': this.state.driverName,
            'plate_number': this.state.selectedShuttle.platenumber,
        }
        if ( auth === "1" ) {
            fetchPost('/api/shuttle/driverlogincreate', uploadParams, this.uploadCallback);
        }
    };

    uploadCallback = (data) => {
        this.setupShuttleAllocation();
        this.props.history.push('/shuttle');
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

    handleSubmit = (event) => {
        event.preventDefault();
        if (this.state.driverName.trim() === '') {
            alert('Please enter a name before submitting.');
        } else if (this.state.selectedShuttle.platenumber.trim() === '') {
            alert('Please select a plate number of vehicel before submitting.');
        } else if (this.state.selectedShuttle.id === 0) {
            alert('Please select a valid shuttle');
        } else {
            this.handleDriverInformationUpload();
        }
    };

    handleChangeBusVal = (event) => {
        this.setState({ selectedShuttle: event.target.value });
    };

    handleNameChange = (event) => {
        this.setState({ driverName: event.target.value });
    };

    fetchShuttleStatusCallback = (data) => {
        const newArr = data.map(obj => ({ id: obj.id, platenumber: obj.platenumber }));
        this.setState({busavailable:newArr});
    };

    requestShuttleStatus = () => {
        fetchGet("/api/reservation/getShuttleAvailability", {}, this.fetchShuttleStatusCallback);
    };

    fetchPostShuttleAllocationStatusCallback = (data) => {
        localStorage.setItem("shuttleAllocatedId",this.state.selectedShuttle.id)
    };

    setupShuttleAllocation = () => {
        const uploadParams = {
            id: this.state.selectedShuttle.id,
            allocated : true,
        }
        fetchPost("/api/reservation/setShuttleAvailability", uploadParams, this.fetchPostShuttleAllocationStatusCallback);
    };
    
    render() {
        const formattedTime = this.state.currentTime.toLocaleTimeString();
        const { offboardcount, onboardcount} = this.state;
        return(
            <Container maxWidth="xl">
                <Sidebar username={localStorage.getItem( "username" )}/>
                <Container component="main" id="info" maxWidth="sm" sx={{ marginBottom: -2 }}>
                    <Box component="form" sx={{ mt: 3 }} onSubmit={ this.handleSubmit }>
                        <Typography color={"textSecondary"} sx={{ mb: 0.5 }}>
                            Driver Information
                        </Typography>
                        <TextField
                            margin="normal"
                            fullWidth
                            name="first_name"
                            variant="outlined"
                            label="First Name"
                            placeholder="Enter Your Name"
                            value={ this.state.driverName }
                            onChange={ this.handleNameChange }
                        />
                        <InputLabel style={{ marginTop: '30px' }}>Choose an On-demand Van</InputLabel>
                        <Select
                            value={this.state.selectedShuttle.id}
                            onChange={this.handleChangeBusVal}
                        >
                            <MenuItem value="0">None</MenuItem>
                            {this.state.busavailable.map((busObj) => (
                                <MenuItem key={busObj.id} value={busObj}>
                                    Shuttle {busObj.id} / {busObj.platenumber}
                                </MenuItem>
                            ))}
                        </Select>
                        <Typography color={"textSecondary"} sx={{ mb: 0.5 }} style={{ marginTop: '30px' }}>
                            Plate Number
                        </Typography>
                        <TextField
                            margin="normal"
                            fullWidth
                            name="plate_number"
                            variant="outlined"
                            value={ this.state.selectedShuttle.platenumber }
                            disable = "true"
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            sx={{ mt: 1, mb: 2 }}
                        >
                            Submit
                        </Button>
                    </Box>
                </Container>
            </Container>
        )
    };
}


export default shuttleSigninForm;


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
