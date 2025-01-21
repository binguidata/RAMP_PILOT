import React, { Component, useState } from 'react';
import { Form, Modal, Tabs, Tab } from 'react-bootstrap';
import PlacesAutocomplete, { geocodeByAddress, getLatLng } from 'react-places-autocomplete';
import { 
    Box, Button, Container, Grid, Paper, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, 
    TextField, Typography
} from '@material-ui/core';

import { fetchGet, fetchPost } from "./request";
import { Sidebar } from "../components/sidebar";
import '../styles/style.css';


const statusToColor = {
    Canceled: 'grey',
    Missed: 'grey',
    Waiting: 'rgba(255, 165, 0, 0.5)',
    Boarded: 'lightgreen',
    Finished: 'lightblue'
};


const tabToDataSetMap = {
    Past : 'pastTrans',
    Upcoming: 'upcomingTrans',
    Future: 'futureTrans',
    All: 'allTrans'
};


class ManageAllRecords extends Component {

    constructor( props ) {
        super( props );
        this.state = {

            // fetching fields
            first_name: '',
            passengers: 1,
            date_time: '',
            assistant: '',
            direction: '',

            shuttleLocations: [],
            busLocations:[],
            upcomingTrans: [],
            pastTrans:[],
            futureTrans: [],
            allTrans:[],
            statToday: [],
            filteredData:[],
            searchQuery: '',
            showingInfoWindow_blue: false,
            activeMarker_blue: {},
            selectedPlace_blue: {},

            showingInfoWindow_red: false,
            activeMarker_red: {},
            selectedPlace_red: {},

            mapCenter: {
                lat: 39.8976341,
                lng: -80.1935485,
            },

            shtlAddress_blue: null,
            shtlAddress_red: null,

            didUpdate: false,
            modalShow: false,

            page: 0,
            rowsPerPage: 10,
            key: "Upcoming",

        };
    };

    handleChange = ( event ) => {
        let nam = event.target.name;
        let val = event.target.value;
        this.setState({ [nam]: val });
    };

    handleModalShow = () => {
        this.setState({ modalShow: !this.state.modalShow })
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

    onMapClicked = () => {
        if ( this.state.showingInfoWindow_blue || this.state.showingInfoWindow_red ) {
            this.setState({
                showingInfoWindow_blue: false,
                activeMarker_blue: null,
                showingInfoWindow_red: false,
                activeMarker_red: null,
            })
        }
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
    };

    reservationCallback = (data) => {
        this.setState({ upcomingTrans: [], pastTrans:[], futureTrans:[], allTrans:[] });
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
            record["pickup_address"] = data[i]["pickupAddress"]
            record["dropoff_address"] = data[i]["dropoffAddress"]
            record["confirmation_code"] = data[i]["confirmationCode"]
            record["isBoarded"] = data[i]["isBoarded"]
            record["isAlighted"] = data[i]["isAlighted"]
            record["isCanceled"] = data[i]["isCanceled"]
            record["isMissed"] = data[i]["isMissed"]
            record["phoneNumber"] = data[i]["phoneNumber"]
            record['shuttlePlatenumber'] = data[i]["shuttlePlatenumber"]
            if ( data[i]["isPaid"] ) {
                record['balance_due'] = 'Paid'
            } else {
                record['balance_due'] = 'Cash $' + (data[i]["passengers"] * 0.25).toFixed(2).toString()
            }
            let currentDate = GetCurrentDate()
            if ( record['date'] === currentDate ) {
                record['isToday'] = 1
            } else {
                record['isToday'] = 0
            }
            record['eta'] = Math.floor(data[i]['etaTime'] / 60)
            record['shuttle'] = data[i]['shuttleAllocation']
            record['timeDiff'] = record["pickupDateTime"] - Date.now()
            if(record['isCanceled'] === true){
                record['status'] = 'Canceled'
            } else if(record['isMissed'] === true){
                record['status'] = 'Missed'
            } else if(record['isBoarded'] === false){
                record['status'] = 'Waiting'
            } else if(record['isBoarded'] === true && record['isAlighted'] === false){
                record['status'] = 'Boarded'
            } else if(record['isAlighted'] === true){
                record['status'] = 'Finished'
            }
            if (
                record['isToday'] === 1
            ) {
                this.setState({
                    upcomingTrans: this.state.upcomingTrans.concat(record),
                    allTrans: this.state.allTrans.concat(record)
                })
            }
            let recordDate = new Date(record['date']);
            let currentDate_new = new Date(); 
            recordDate.setHours(0, 0, 0, 0);
            currentDate_new.setHours(0, 0, 0, 0);

            if (recordDate < currentDate_new) {

                this.setState(prevState => ({
                    pastTrans: [...prevState.pastTrans, record],
                    allTrans: [...prevState.allTrans, record]
                }));
            } else if (recordDate  > currentDate_new) {
                this.setState(prevState => ({
                    futureTrans: [...prevState.futureTrans, record],
                    allTrans: [...prevState.allTrans, record]
                }));
            }
        }
        this.setState({ didUpdate: true })
    };

    handleUpcommingTansUpdate = () => {
        fetchGet("/api/reservation/viewAll", {}, this.reservationCallback);
    };

    componentDidMount() {
        fetchGet("/api/reservation/viewAll", {}, this.reservationCallback);
        setInterval(this.handleUpcommingTansUpdate, 60000);
    };

    handleSearchChange = event => {
        console.log(this.state.key+" "+event.target.value);
        this.setState({ searchQuery: event.target.value });
        if(event.target.value.length < 3 ){
            this.setState({ filteredData:[] });
        }
        else{
            console.log(this.state.searchQuery);
            this.filterData(event.target.value);
        }
    };

    convertDateFormat(dateStr) {
        const [year, month, day] = dateStr.split('-');
    
        const monthInt = parseInt(month, 10);
        const dayInt = parseInt(day, 10);
        return `${monthInt}/${dayInt}/${year}`;
    };

    handleSearchChangeDate = event => {
        const date = this.convertDateFormat(event.target.value)

        if(event.target.value.length < 3 ){
            this.setState({ filteredData:[] });
        }
        else{
            this.setState({ searchQuery: date });
            this.filterDataDate(date);
        }
    };

    filterDataDate(searchQuery) {
        if(searchQuery == null || searchQuery == ''){
            this.setState({ filteredData:[] });
        }
        const searchLower = searchQuery.toLowerCase();
        const currentTab = this.state.key
        const dataSetName = tabToDataSetMap[currentTab]
        const data = this.state[dataSetName] 
        
        const filteredData = data.filter(item => { 
            return  item.date == searchQuery
        });
        this.setState({ filteredData });
    };

    filterData(searchQuery) {
        if(searchQuery == null || searchQuery == ''){
            this.setState({ filteredData:[] });
        }

        const searchLower = searchQuery.toLowerCase();
        const currentTab = this.state.key
        const dataSetName = tabToDataSetMap[currentTab]
        const data = this.state[dataSetName] 
        console.log(data)
        
        const filteredData = data.filter(item => { 
            return item.first_name.toLowerCase().includes(searchLower) ||
                item.pickup_address.toLowerCase().includes(searchLower) ||
                item.dropoff_address.toLowerCase().includes(searchLower) ||
                item.status.toLowerCase().includes(searchLower) ||
                item.phoneNumber.includes(searchLower)
        });
    
        console.log(filteredData);
        this.setState({ filteredData });
    };

    clearSearch = ()=>{
        this.setState({ filteredData:[], searchQuery:''}); 
    };
    getOneDayPastDate() {
        const today = new Date();
        today.setDate(today.getDate() - 1);
        return today.toISOString().split('T')[0];
    }
    render() {
        return (
            <Container maxWidth="xl">
                <Sidebar username={localStorage.getItem( "username" )}/>
                <Grid container spacing={2} className="manager-grid">
                    <Grid item xs={12} sm={12} md={12} lg={12}>
                        <br/>
                        <Typography
                            component="h1"
                            variant="h4"
                            align="center"
                            color="text.primary"
                            gutterBottom
                        >
                            Management Center
                        </Typography>
                    </Grid>

                    <Grid item xs={12} sm={12} md={12} lg={12}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs>
                                <TextField
                                    fullWidth
                                    margin="normal"
                                    label="Search"
                                    variant="outlined"
                                    onChange={this.handleSearchChange}
                                    value={this.state.searchQuery}
                                    type="text"
                                />
                            </Grid>
                            <Grid item xs>
                                <TextField
                                    fullWidth
                                    margin="normal"
                                    variant="outlined"
                                    id="date_time"
                                    name="date_time"
                                    label="Pickup Date"
                                    type="date"
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    onChange={this.handleSearchChangeDate}
                                    value={this.state.searchQuery}
                                />
                            </Grid>
                            <Grid item>
                                <Button 
                                    color="primary" 
                                    variant="contained" 
                                    sx={{ mt: 3, mb: 2 }}
                                    onClick={this.clearSearch} 
                                >
                                    Clear Search
                                </Button>
                            </Grid>
                        </Grid>
                    </Grid>

                    { this.state.filteredData.length < 1 ? <div></div> : 
                        <Grid item xs={12} sm={12} md={12} lg={12}>
                            <TableContainer className="ride-tableContainer">
                                <Table aria-label="simple table">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell align="center"><strong>First Name</strong></TableCell>
                                            <TableCell align="center"><strong>Number of Passengers</strong></TableCell>
                                            <TableCell align="center"><strong>Pickup Location</strong></TableCell>
                                            <TableCell align="center"><strong>Drop-off Location</strong></TableCell>
                                            <TableCell align="center"><strong>Pickup Time</strong></TableCell>
                                            <TableCell align="center"><strong>Confirmation Code</strong></TableCell>
                                            <TableCell align="center"><strong>Phone Number</strong></TableCell>
                                            <TableCell align="center"><strong>On-demand Vehicle</strong></TableCell>
                                            <TableCell align="center"><strong>Estimated Time of Arrival</strong></TableCell>
                                            <TableCell align="center"><strong>Status</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        { this.state.filteredData.slice()
                                            .slice(
                                                this.state.page * this.state.rowsPerPage,
                                                this.state.page * this.state.rowsPerPage + this.state.rowsPerPage
                                            )
                                            .map((item, index) => (
                                                <TableRow 
                                                    key={ 'past' + index }
                                                    style={{backgroundColor: statusToColor[item.status] || 'transparent'}}
                                                >
                                                    <TableCell align="center">{ item.first_name }</TableCell>
                                                    <TableCell align="center">{ item.passengers }</TableCell>
                                                    <TableCell align="center">{ item.pickup_address }</TableCell>
                                                    <TableCell align="center">{ item.dropoff_address }</TableCell>
                                                    <TableCell align="center">{ item.date_time_12hr_format }</TableCell>
                                                    <TableCell align="center">{ item.confirmation_code }</TableCell>
                                                    <TableCell align="center">{ item.phoneNumber }</TableCell>
                                                    <TableCell align="center">{ item.shuttlePlatenumber }</TableCell>
                                                    <TableCell align="center">{ item.eta }</TableCell>
                                                    <TableCell align="center">{ item.status }</TableCell>                        
                                                </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <TablePagination
                                rowsPerPageOptions={[5, 10, 20]}
                                component="div"
                                count={this.state.filteredData.length}
                                rowsPerPage={this.state.rowsPerPage}
                                page={this.state.page}
                                onPageChange={this.handleChangePage}
                                onRowsPerPageChange={this.handleChangeRowsPerPage}
                            />
                        </Grid>
                    }

                    <Grid item xs={12} sm={12} md={12} lg={12}>
                        <Tabs activeKey={this.state.key} onSelect={(k) => this.setState({key: k})}>
                            <Tab eventKey="Past" title="Past">
                                <Paper>
                                    <TableContainer className="ride-tableContainer">
                                        <Table aria-label="simple table">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell align="center"><strong>First Name</strong></TableCell>
                                                    <TableCell align="center"><strong>Number of Passengers</strong></TableCell>
                                                    <TableCell align="center"><strong>Pickup Location</strong></TableCell>
                                                    <TableCell align="center"><strong>Drop-off Location</strong></TableCell>
                                                    <TableCell align="center"><strong>Pickup Time</strong></TableCell>
                                                    <TableCell align="center"><strong>Confirmation Code</strong></TableCell>
                                                    <TableCell align="center"><strong>Phone Number</strong></TableCell>
                                                    <TableCell align="center"><strong>Status</strong></TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                { this.state.pastTrans.slice()
                                                    .slice(
                                                        this.state.page * this.state.rowsPerPage,
                                                        this.state.page * this.state.rowsPerPage + this.state.rowsPerPage
                                                    )
                                                    .map((item, index) => (
                                                        <TableRow 
                                                            key={ 'past' + index }
                                                            style={{backgroundColor: statusToColor[item.status] || 'transparent'}}
                                                        >
                                                            <TableCell align="center">{ item.first_name }</TableCell>
                                                            <TableCell align="center">{ item.passengers }</TableCell>
                                                            <TableCell align="center">{ item.pickup_address }</TableCell>
                                                            <TableCell align="center">{ item.dropoff_address }</TableCell>
                                                            <TableCell align="center">{ item.date_time_12hr_format }</TableCell>
                                                            <TableCell align="center">{ item.confirmation_code }</TableCell>
                                                            <TableCell align="center">{ item.phoneNumber }</TableCell>
                                                            <TableCell align="center">{ item.status }</TableCell>
                                                        </TableRow>
                                                    ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                    <TablePagination
                                        rowsPerPageOptions={[5, 10, 20]}
                                        component="div"
                                        count={this.state.pastTrans.length}
                                        rowsPerPage={this.state.rowsPerPage}
                                        page={this.state.page}
                                        onPageChange={this.handleChangePage}
                                        onRowsPerPageChange={this.handleChangeRowsPerPage}
                                    />
                                </Paper>
                            </Tab>
                    
                            <Tab eventKey="Upcoming" title="Today">
                                <Paper>
                                    <TableContainer className="ride-tableContainer">
                                        <Table aria-label="simple table">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell align="center"><strong>First Name</strong></TableCell>
                                                    <TableCell align="center"><strong>Number of Passengers</strong></TableCell>
                                                    <TableCell align="center"><strong>Pickup Location</strong></TableCell>
                                                    <TableCell align="center"><strong>Drop-off Location</strong></TableCell>
                                                    <TableCell align="center"><strong>Pickup Time</strong></TableCell>
                                                    <TableCell align="center"><strong>Confirmation Code</strong></TableCell>
                                                    <TableCell align="center"><strong>Phone Number</strong></TableCell>
                                                    <TableCell align="center"><strong>On-demand Vehicle</strong></TableCell>
                                                    <TableCell align="center"><strong>Estimated Time of Arrival</strong></TableCell>
                                                    <TableCell align="center"><strong>Status</strong></TableCell>
                                                    <TableCell align="center"><strong>Cancel</strong></TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                { this.state.upcomingTrans.slice().reverse()
                                                    .slice(
                                                        this.state.page * this.state.rowsPerPage,
                                                        this.state.page * this.state.rowsPerPage + this.state.rowsPerPage
                                                    )
                                                    .map((item, index) => (
                                                        <TableRow key={ 'upcoming' + index } 
                                                        style={{backgroundColor: statusToColor[item.status] || 'transparent'}}
                                                        >
                                                            <TableCell align="center">{ item.first_name }</TableCell>
                                                            <TableCell align="center">{ item.passengers }</TableCell>
                                                            <TableCell align="center">{ item.pickup_address }</TableCell>
                                                            <TableCell align="center">{ item.dropoff_address }</TableCell>
                                                            <TableCell align="center">{ item.date_time_12hr_format }</TableCell>
                                                            <TableCell align="center">{ item.confirmation_code }</TableCell>
                                                            <TableCell align="center">{ item.phoneNumber }</TableCell>
                                                            <TableCell align="center">{ item.shuttlePlatenumber }</TableCell>
                                                            <TableCell align="center">
                                                                { (item.status === "Waiting") ?
                                                                    item.eta
                                                                    :
                                                                    'NA'
                                                                }
                                                            </TableCell>
                                                            <TableCell align="center">{ item.status }</TableCell>
                                                            <TableCell align="center">
                                                                { (item.timeDiff > 900000 & item.status === "Waiting") ?
                                                                    <ReservationOperation
                                                                        id={ item.id }
                                                                        date_time={ item.pickupDateTime }
                                                                        shuttle={ item.shuttle }
                                                                        isBoarded={ item.isBoarded }
                                                                        isBookedByUser={ item.isBookedByUser }
                                                                        auth={ localStorage.getItem("auth") }
                                                                        operation={ 'cancel' }
                                                                        updateHandle={ this.handleReservation }
                                                                    />
                                                                    :
                                                                    'NA'
                                                                }
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
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
                            </Tab>

                            <Tab eventKey="Future" title="Future">
                                <Paper>
                                    <TableContainer className="ride-tableContainer">
                                        <Table aria-label="simple table">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell align="center"><strong>First Name</strong></TableCell>
                                                    <TableCell align="center"><strong>Number of Passengers</strong></TableCell>
                                                    <TableCell align="center"><strong>Pickup Location</strong></TableCell>
                                                    <TableCell align="center"><strong>Drop-off Location</strong></TableCell>
                                                    <TableCell align="center"><strong>Pickup Time</strong></TableCell>
                                                    <TableCell align="center"><strong>Confirmation Code</strong></TableCell>
                                                    <TableCell align="center"><strong>Phone Number</strong></TableCell>
                                                    <TableCell align="center"><strong>Status</strong></TableCell>
                                                    <TableCell align="center"><strong>Cancel</strong></TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                { this.state.futureTrans.slice()
                                                    .slice(
                                                        this.state.page * this.state.rowsPerPage,
                                                        this.state.page * this.state.rowsPerPage + this.state.rowsPerPage
                                                    )
                                                    .map((item, index) => (
                                                        <TableRow 
                                                            key={ 'future' + index }
                                                            style={{backgroundColor: statusToColor[item.status] || 'transparent'}}
                                                        >
                                                            <TableCell align="center">{ item.first_name }</TableCell>
                                                            <TableCell align="center">{ item.passengers }</TableCell>
                                                            <TableCell align="center">{ item.pickup_address }</TableCell>
                                                            <TableCell align="center">{ item.dropoff_address }</TableCell>
                                                            <TableCell align="center">{ item.date_time_12hr_format }</TableCell>
                                                            <TableCell align="center">{ item.confirmation_code }</TableCell>
                                                            <TableCell align="center">{ item.phoneNumber }</TableCell>
                                                            <TableCell align="center">{ item.status }</TableCell>
                                                            <TableCell align="center">
                                                                { (item.timeDiff > 900000 & item.status === "Waiting") ?
                                                                    <ReservationOperation
                                                                        id={ item.id }
                                                                        date_time={ item.pickupDateTime }
                                                                        shuttle={ item.shuttle }
                                                                        isBoarded={ item.isBoarded }
                                                                        isBookedByUser={ item.isBookedByUser }
                                                                        auth={ localStorage.getItem("auth") }
                                                                        operation={ 'cancel' }
                                                                        updateHandle={ this.handleReservation }
                                                                    />
                                                                    :
                                                                    'NA'
                                                                }
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                    <TablePagination
                                        rowsPerPageOptions={[5, 10, 20]}
                                        component="div"
                                        count={this.state.futureTrans.length}
                                        rowsPerPage={this.state.rowsPerPage}
                                        page={this.state.page}
                                        onPageChange={this.handleChangePage}
                                        onRowsPerPageChange={this.handleChangeRowsPerPage}
                                    />
                                </Paper>
                            </Tab>

                            <Tab eventKey="All" title="All">
                                <Paper>
                                    <TableContainer className="ride-tableContainer">
                                        <Table aria-label="simple table">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell align="center"><strong>First Name</strong></TableCell>
                                                    <TableCell align="center"><strong>Number of Passengers</strong></TableCell>
                                                    <TableCell align="center"><strong>Pickup Location</strong></TableCell>
                                                    <TableCell align="center"><strong>Drop-off Location</strong></TableCell>
                                                    <TableCell align="center"><strong>Pickup Time</strong></TableCell>
                                                    <TableCell align="center"><strong>Confirmation Code</strong></TableCell>
                                                    <TableCell align="center"><strong>Phone Number</strong></TableCell>
                                                    <TableCell align="center"><strong>Status</strong></TableCell>
                                                    <TableCell align="center"><strong>Cancel</strong></TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                { this.state.allTrans.slice()
                                                    .slice(
                                                        this.state.page * this.state.rowsPerPage,
                                                        this.state.page * this.state.rowsPerPage + this.state.rowsPerPage
                                                    )
                                                    .map((item, index) => (
                                                        <TableRow 
                                                            key={ 'all' + index }
                                                            style={{backgroundColor: statusToColor[item.status] || 'transparent'}}
                                                        >
                                                            <TableCell align="center">{ item.first_name }</TableCell>
                                                            <TableCell align="center">{ item.passengers }</TableCell>
                                                            <TableCell align="center">{ item.pickup_address }</TableCell>
                                                            <TableCell align="center">{ item.dropoff_address }</TableCell>
                                                            <TableCell align="center">{ item.date_time_12hr_format }</TableCell>
                                                            <TableCell align="center">{ item.confirmation_code }</TableCell>
                                                            <TableCell align="center">{ item.phoneNumber }</TableCell>
                                                            <TableCell align="center">{ item.status }</TableCell>
                                                            <TableCell align="center">
                                                                { (item.timeDiff > 900000 & item.status === "Waiting") ?
                                                                    <ReservationOperation
                                                                        id={ item.id }
                                                                        date_time={ item.pickupDateTime }
                                                                        shuttle={ item.shuttle }
                                                                        isBoarded={ item.isBoarded }
                                                                        isBookedByUser={ item.isBookedByUser }
                                                                        auth={ localStorage.getItem("auth") }
                                                                        operation={ 'cancel' }
                                                                        updateHandle={ this.handleReservation }
                                                                    />
                                                                    :
                                                                    'NA'
                                                                }
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                    <TablePagination
                                        rowsPerPageOptions={[5, 10, 20]}
                                        component="div"
                                        count={this.state.allTrans.length}
                                        rowsPerPage={this.state.rowsPerPage}
                                        page={this.state.page}
                                        onPageChange={this.handleChangePage}
                                        onRowsPerPageChange={this.handleChangeRowsPerPage}
                                    />
                                </Paper>
                            </Tab>
                        </Tabs>
                    </Grid>
                </Grid>
            </Container>
        )
    }
}
export default ( ManageAllRecords )


// The reservation modal
class ReservationModal extends Component {

    constructor ( props ) {
        super ( props );
        this.state = {

            customer: '',
            first_name: '',
            phone_number: '',
            passengers: 1,
            date_time: '',
            assistant: false,
            direction: '',
            serviceArea: 'Greene',

            addressGOOGLEpickup: '',
            addressGOOGLEdropoff: '',
            coordGOOGLEpickup: {
                lat: 40.4523192482335,
                lng: -80.16798303065549,
            },
            coordGOOGLEdropoff: {
                lat: 40.4523192482335,
                lng: -80.16798303065549,
            },

            bookingPrompt: "",

            balance: '',
        };
    };

    handleChange = ( event ) => {
        let nam = event.target.name;
        let val = event.target.value;
        this.setState({ [nam]: val });
    };

    handleChangeAssistant = () => {
        this.setState({ assistant: !this.state.assistant });
    };

    handleChangeGOOGLEpickup = addressGOOGLEpickup => {
        this.setState({ addressGOOGLEpickup });
    };

    handleChangeGOOGLEdropoff = addressGOOGLEdropoff => {
        this.setState({ addressGOOGLEdropoff });
    };

    handleSelectGOOGLEpickup = addressGOOGLEpickup => {
        this.setState({ addressGOOGLEpickup });
        geocodeByAddress( addressGOOGLEpickup )
            .then(results => getLatLng( results[0] ))
            .then(latLng => {
                this.setState({ coordGOOGLEpickup: latLng });
            })
            .catch( error => console.error( 'Error', error ) );
    };

    handleSelectGOOGLEdropoff = addressGOOGLEdropoff => {
        this.setState({ addressGOOGLEdropoff });
        geocodeByAddress( addressGOOGLEdropoff )
            .then(results => getLatLng( results[0] ))
            .then(latLng => {
                this.setState({ coordGOOGLEdropoff: latLng });
            })
            .catch( error => console.error( 'Error', error ) );
    };

    handleShow = () => {
        this.setState({ bookingPrompt: <p/> });
    };

    handleClose = () => {
        this.props.closeHandle();
        window.location.reload();
    };

    submitCallback = (data) => {
        if ('msg' in data) {
            window.alert(data['msg'])
            this.setState({buttonDisable: false})
        } else if ('id' in data) {
            this.setState({
                bookingPrompt: "Reservation made successfully, a text message with details will be sent to the customer.",
            })
            setTimeout(() => {
                this.props.updateHandle()
                this.handleClose()
            }, 2500);
        } else if ('non_field_errors' in data) {
            this.setState({
                bookingPrompt: data['non_field_errors'],
                buttonDisable: false,
            })
        } else if ('error' in data) {
            this.setState({
                bookingPrompt: data['error'],
                buttonDisable: false
            })
        }
    };

    handleSubmit = ( event ) => {
        event.preventDefault();
        this.setState({buttonDisable: true})
        let randomstring = require("randomstring");
        const submitParams = {
            "username": localStorage.getItem("username"),
            'firstName': this.state.first_name,
            'passengers': this.state.passengers,
            'pickupDateTime': this.state.date_time,
            'assistant': false,
            'pickupAddress': this.state.addressGOOGLEpickup,
            'dropoffAddress': this.state.addressGOOGLEdropoff,
            'pickupLatitude': this.state.coordGOOGLEpickup.lat.toFixed(8),
            'pickupLongitude': this.state.coordGOOGLEpickup.lng.toFixed(8),
            'dropoffLatitude': this.state.coordGOOGLEdropoff.lat.toFixed(8),
            'dropoffLongitude': this.state.coordGOOGLEdropoff.lng.toFixed(8),
            'pickupPOI': -1,
            'dropoffPOI': -1,
            'pickupPOITravelTime': 0,
            'dropoffPOITravelTime':  0,
            'phoneNumber': this.state.phone_number,
            'shuttle': "",
            'serviceArea': this.state.serviceArea,
            'isBoarded': false,
            'isAlighted': false,
            'isCanceled': false,
            'isPaid': false,
            'isBookedByUser': false,
            'isBookedByManager': true,
            'isVirtualRider': false,
            'confirmationCode': randomstring.generate(3),
            'auth': localStorage.getItem("auth"),
        };
        fetchPost('/api/reservation/create', submitParams, this.submitCallback);
    };

    render () {
        return <div>

            <Modal show={this.props.show} onHide={this.props.closeHandle} onShow={this.handleShow} size="lg" centered>
                <Modal.Header>
                    <h5 className="modal-title" id="exampleModalLabel">New Reservation</h5>
                    <Button type="button" className="close" onClick={this.handleClose}>
                        <span aria-hidden="true">&times;</span>
                    </Button>
                </Modal.Header>

                <Modal.Body>
                    <label className="ride-label"> First Name
                        <input
                            type="text"
                            name="first_name"
                            className="form-control"
                            placeholder="Enter Your Name"
                            required={ true }
                            onChange={ this.handleChange }
                        />
                    </label>

                    <label className="ride-label"> Phone #
                        <input
                            type="tel"
                            name="phone_number"
                            className="form-control"
                            placeholder="Enter Phone #"
                            required={ true }
                            onChange={ this.handleChange }
                        />
                    </label>

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

                    <label className="ride-label"> Pickup Time
                        <input
                            type="datetime-local"
                            id="date_time"
                            name="date_time"
                            className="form-control"
                            min={ formatDate(new Date().toLocaleString()) + "T" + new Date().toTimeString().slice(0, 5) }
                            required={ true }
                            onChange={ this.handleChange }
                        />
                    </label>
                    <br/>

                    <br/>

                    <label className="ride-label"> Origin
                    <PlacesAutocomplete
                            value={ this.state.addressGOOGLEpickup }
                            onChange={ this.handleChangeGOOGLEpickup }
                            onSelect={ this.handleSelectGOOGLEpickup }
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

                    <label className="ride-label"> Destination
                        <PlacesAutocomplete
                            value={ this.state.addressGOOGLEdropoff }
                            onChange={ this.handleChangeGOOGLEdropoff }
                            onSelect={ this.handleSelectGOOGLEdropoff }
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
                            <Button type="button"
                                    className="btn btn-secondary"
                                    disabled={this.state.buttonDisable}
                                    onClick={this.handleSubmit}>Book!</Button>
                        </div>
                        <div className='col-md-6'>
                            <Button type="button" className="btn btn-secondary" onClick={this.handleClose}>Cancel</Button>
                        </div>
                    </div>
                    <div>{this.state.bookingPrompt}</div>
                </Modal.Footer>

            </Modal>

        </div>
    }

}



export function ReservationOperation ( props ) {

    const [passengers, setPassengers] = useState(1)
    const [dateTime, setDateTime] = useState('')
    const [modifyModalShow, setModifyModalShow] = useState(false)
    const [, setModifyOptions] = useState([])
    const [modifyPrompt, setModifyPrompt] = useState(null)
    const [actionModalShow, setActionModalShow] = useState(false)
    const [actionPrompt, setActionPrompt] = useState(<p/>)

    const handleModifyShow = () => {
        setModifyModalShow(true)
    };

    const handleModifyClose = () => {
        setModifyModalShow(false)
        setModifyPrompt(null)
    };

    const handleActionShow = () => {
        setActionModalShow(true)
    };

    const handleActionClose = () => {
        setActionModalShow(false);
        setActionPrompt(<p/>);
        setTimeout(() => {
            props.updateHandle()
        }, 800);
        window.location.reload();
    };

    
    const getModifyOptionsCallback = (data) => {
        let allOptions = []
        if ('error' in data) {
            setModifyPrompt(data['error'])
            setModifyOptions(allOptions)
        }
    };

    const getModifyOptions = () => {
        fetchGet('/api/reservation/checkModify', {'tranId': props.id}, getModifyOptionsCallback)
    };

    const handleModify = () => {
        const params = {
            'username': localStorage.getItem('username'),
            'tranId': props.id,
            'action': 'modify',
            'passengers': passengers,
            'pickupDateTime': dateTime,
            'isBoarded': props.isBoarded,
            'auth': props.auth,
        }

        const modifyCallback = (data) => {
            if ('id' in data) {
                setModifyPrompt(<p>Successfully modify your reservation, page will be refreshed in a sec...</p>)
                setTimeout(() => {
                    props.updateHandle()
                    handleModifyClose()
                }, 1500)
            } else if ('non_field_errors' in data) {
                setModifyPrompt(<p>{data['non_field_errors']}</p>)
            } else if ('error' in data) {
                setModifyPrompt(<p>{data['error']}</p>)
            }
        }

        fetchPost('/api/reservation/action', params, modifyCallback)
    };

    const handleCancel = () => {
        const params = {
            'username': localStorage.getItem('username'),
            'tranId': props.id,
            'isBoarded': props.isBoarded,
            'shuttle': props.shuttle,
            'action': props.operation,
            'pickupDateTime': props.date_time,
            'auth': props.auth,
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
    };

    
    const [confirmModalShow, setConfirmModalShow] = useState(false)
    const [confirmPrompt, setConfirmPropmt] = useState(<p/>)

    const handleConfirmShow = () => {
        setConfirmModalShow(true)
    };

    const handleConfirmClose = () => {
        setConfirmModalShow(false)
    };

    const handleCancelClick = (event) => {
        event.preventDefault();
        setConfirmPropmt(<p>Cancel the Reservation?</p>)
        handleConfirmShow()
    };

    return <div className='m-4 pt-1 row'>
        { props.operation === 'modify' ?
            <div>
                <Button className='btn btn-secondary btn-responsive' onClick={handleModifyShow}>
                    Modify
                </Button>
                <Modal show={modifyModalShow} onHide={handleModifyClose} onShow={getModifyOptions} centered>
                    <Modal.Body>
                        <Form>
                            <Form.Row>
                                <Form.Label>Modify your reservation: </Form.Label>
                                <br/><br/>
                            </Form.Row>

                            <Form.Row>
                                <label className="ride-label"> Number of Passengers
                                    <input
                                        type="number"
                                        name="passengers"
                                        className="form-control"
                                        defaultValue={props.passengers}
                                        min="1"
                                        max="10"
                                        required={ true }
                                        onChange={(event => setPassengers(event.target.value))}
                                    />
                                </label>
                                <br/>

                                <label className="ride-label"> Pickup Time
                                    <input
                                        type="datetime-local"
                                        id="date_time"
                                        name="date_time"
                                        className="form-control"
                                        min={ formatDate(new Date().toLocaleString()) + "T" + new Date().toTimeString().slice(0, 5) }
                                        required={ true }
                                        onChange={(event => setDateTime(event.target.value))}
                                    />
                                </label>
                                <br/>
                            </Form.Row>

                        </Form>
                        <div>{modifyPrompt}</div>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button className='btn btn-secondary btn-responsive' onClick={handleModify}>
                            Submit
                        </Button>
                        <Button className='btn btn-secondary btn-responsive' onClick={handleModifyClose}>
                            Close
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
            :
            <div className='offset-1 col-lg-3'>
                <Modal show={actionModalShow} onHide={handleActionClose} centered>
                    <Modal.Body>
                        {actionPrompt}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button className='btn btn-secondary btn-responsive' onClick={handleActionClose}>
                            Close
                        </Button>
                    </Modal.Footer>
                </Modal>

                <ConfirmModal
                    show={confirmModalShow}
                    handleClose={handleConfirmClose}
                    prompt={confirmPrompt}
                    action={handleCancel}
                />
                <Button 
                    variant="contained" 
                    color="primary"
                    className='btn btn-secondary btn-responsive' 
                    onClick={handleCancelClick}
                >
                    Cancel
                </Button>
            </div>
        }
    </div>

}


export function ConfirmModal ( props ) {
    const handleProceed = () => {
        props.handleClose()
        setTimeout(props.action, 1000)
    };

    return <Modal show={props.show} onHide={props.handleClose} centered>
        <Modal.Body>
            {props.prompt}
        </Modal.Body>
        <Modal.Footer>
            <Button className='btn btn-secondary btn-responsive' onClick={handleProceed}>
                Proceed
            </Button>
            <Button className='btn btn-secondary btn-responsive' onClick={props.handleClose}>
                Close
            </Button>
        </Modal.Footer>
    </Modal>
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
