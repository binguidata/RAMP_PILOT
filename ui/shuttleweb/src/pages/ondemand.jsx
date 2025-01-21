import React, { Component } from 'react';
import { GoogleApiWrapper, Map, Marker, Polyline } from "google-maps-react";
import PlacesAutocomplete, { geocodeByAddress, getLatLng } from "react-places-autocomplete";
import { 
    Card, CardActionArea, CardContent, Checkbox, Container, 
    FormControl, FormControlLabel, Grid, IconButton, Typography 
} from '@material-ui/core';
import { Box, Button, Paper, TextField } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import { faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";

import { fetchPost, fetchGet } from "./request";
import { Sidebar } from "../components/sidebar";
import '../styles/style.css';
import { greenePathData, morgantownPathData, washington1PathData, washington2PathData, washington3PathData } from './dataLoader';


const mapStyle = {
    height: '18em',
};


class OnDemandPage extends Component {

    constructor( props ) {
        super( props );
        this.state = {
            no_of_booking_to_be_done : 0,
            startAddress: '',
            endAddress: '',
            passengers: 1,
            date_time: formatDate(this.getToday().toLocaleString()) + "T" + new Date(this.getToday().getTime() + 5 * 60000).toTimeString().slice(0, 5),
            mapCenter: {
                lat: 39.8976341,
                lng: -80.1935485,
            },
            startLoc: {
                lat: 39.8976341,
                lng: -80.1935485,
            },
            endLoc: {
                lat: 39.8951361,
                lng: -80.1778938,
            },
            trip_start_loc: {
                lat: 39.8976341,
                lng: -80.1935485,
            },
            trip_end_loc:{
                lat: 39.8951361,
                lng: -80.1778938,
            },
            activeMarkerStart: {},
            selectedPlaceStart: {},
            activeMarkerEnd: {},
            selectedPlaceEnd: {},

            gridContent: [],

            showHideMap: false,
            buttonDisableforSaveHistory:false,

            routeCoords: [
            ],
            gridContentHistoryList: [],
            savedInHistory: false,
            buttonDisableState : {showRecommendation: false ,showRecommendationHistory: false, saveSearchHistory: false},
            first_name: '',
            balance:'',
            tel:'',
            customer:'',
            assistant: false,
            renderPopup:false,
            serviceArea: 'Greene',
            dataofRecommnedation : {},
            disableConfirmBooking: true,
            costForTrip: 0,
            costdataForTrip: '' 
        }
        this.newBooking = this.newBooking.bind(this);
    };
    holidayList = [
        new Date(2024, 0, 1),
        new Date(2024, 0, 15),
        new Date(2024, 2, 29),
        new Date(2024, 4, 27),
        new Date(2024, 5, 14),
        new Date(2024, 5, 19),
        new Date(2024, 6, 4),
        new Date(2024, 8, 2),
        new Date(2024, 10, 11),
        new Date(2024, 10, 28),
        new Date(2024, 10, 29),
        new Date(2024, 11, 24),
        new Date(2024, 11, 25)
    ];
    componentDidMount() {
        fetchGet("/api/account/profile", {}, this.accountCallback);
        
    };

    accountCallback = (data) => {
        this.setState({
            customer: data["username"],
            first_name: data["first_name"],
            balance: "$ " + Number(data['balance']).toFixed(2),
            tel: data["tel"],
        });
    };

    getToday = () => {
        const today = new Date()
        return today
    };

    getIn5Minutes = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 5);
        return now;
    };

    getTomorrow = () => {
        const today = new Date()
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1) 
        return tomorrow
    };

    handleChangeStart = startAddress => {
        this.setState({ startAddress });
    };

    handleChangeEnd = endAddress => {
        this.setState({ endAddress });
    };

    handleSelectStart = startAddress => {
        this.setState({ startAddress });
        geocodeByAddress( startAddress )
            .then(results => getLatLng( results[0] ))
            .then(latLng => {
                this.setState({startLoc: latLng, trip_start_loc: latLng});
            })
            .catch( error => console.error( 'Error', error ) );
    };

    handleSelectEnd = endAddress => {
        this.setState({ endAddress });
        geocodeByAddress( endAddress )
            .then(results => getLatLng( results[0] ))
            .then(latLng => {
                this.setState({endLoc: latLng, trip_end_loc: latLng});
            })
            .catch( error => console.error( 'Error', error ) );
    };

    reservationCallback = (data) => {
        if ('msg' in data) {
            window.alert(data['msg'])
            this.setState({buttonDisable: false})
        } else if ('id' in data) {
            if (true) {
                window.alert("Reservation made successfully, redirect to reservation page in a sec...")
                this.saveHistoryRecommendationsAfterBooking()
                setTimeout(() => {
                    this.props.history.push('../reservations')
                }, 1500)
            } else {
                let tmp = this.state.no_of_booking_to_be_done
                tmp = tmp - 1
                this.setState({no_of_booking_to_be_done: tmp})
            }           
        } else if ('non_field_errors' in data) {
            window.alert(data['non_field_errors'])
            this.setState({
                buttonDisable: false,
            })
        } else if ('error' in data) {
            window.alert(data['error'])
            this.setState({
                buttonDisable: false,
            })
        }
    };
    calculateCostCallback = (data)=>{
        if (data.cost != ""){
            console.log("Call back value is ")
            console.log(data)
            console.log(parseFloat(data.cost).toFixed(2))
            this.setState({costForTrip: parseFloat(data.cost).toFixed(2), costdataForTrip: data.data})
        }
        console.log("New cost is ",this.state.costForTrip, this.state.costdataForTrip)
    }
    calculateCost = ()=>{
        console.log("next action logic implemeneted here")
        const { startLoc, endLoc } = this.state;
            console.log(" winin ifl case ")
            const requestBody = {
                startLoc : startLoc,
                endLoc : endLoc
            }
            fetchPost("/api/reservation/calculate_cost_dist", requestBody, this.calculateCostCallback);
    }
    multiplereservationSubmit = (transactionDataList)=>{
        if (this.state.date_time.slice(11, 13) < 5 || this.state.date_time.slice(11, 13) >= 20) {
            window.alert("Reservation only valid for 5AM to 8PM");
        } else {
            this.setState({buttonDisable: true})
            fetchPost('/api/reservation/create_multiple', transactionDataList, this.reservationCallback);
        }
    };
    
    reservationSubmit = ( startAddress,endAddress,startLoc, endLoc )=>{
        const submitParams = {
            "username": localStorage.getItem("username"),
            'firstName': this.state.first_name,
            'passengers': this.state.passengers,
            'pickupDateTime': this.state.date_time,
            'assistant': this.state.assistant,
            'pickupAddress': startAddress,
            'dropoffAddress': endAddress,
            'pickupLatitude': startLoc.lat.toFixed(8),
            'pickupLongitude': startLoc.lng.toFixed(8),
            'dropoffLatitude': endLoc.lat.toFixed(8),
            'dropoffLongitude': endLoc.lng.toFixed(8),
            'pickupPOI': -1,
            'dropoffPOI': -1,
            'pickupPOITravelTime': 0,
            'dropoffPOITravelTime': 0,
            'phoneNumber': this.state.tel,
            'shuttle': "",
            'serviceArea': this.state.serviceArea,
            'isBoarded': false,
            'isAlighted': false,
            'isCanceled': false,
            'isMissed': false,
            'isPaid': true,
            'isBookedByUser': true,
            'isVirtualRider': false,
            'confirmationCode': require("randomstring").generate(3),
            'auth': localStorage.getItem("auth"),
            'waitSimTime': 0,
            'costData': this.state.costdataForTrip,
        };
        if (this.state.date_time.slice(11, 13) < 5 || this.state.date_time.slice(11, 13) >= 20) {
            window.alert("Reservation only valid for 5AM to 8PM");
        } else {
            this.setState({buttonDisable: true})
            fetchPost('/api/reservation/create', submitParams, this.reservationCallback);
        }
    };

    newBooking = () => {
        const gridContent = this.state.gridContent;
        const shuttleModes = gridContent.filter(mode => mode.props.title.includes('On-demand Van'));
        if (shuttleModes.length === 1) {
            const shuttleMode = shuttleModes[0];
            this.reservationSubmit(
                shuttleMode.props.startAddress, 
                shuttleMode.props.endAddress, 
                shuttleMode.props.startLoc, 
                shuttleMode.props.endLoc
            );
        } else if (shuttleModes.length > 1) {
            const transactionDataList = [];
        
            shuttleModes.forEach((mode, index) => {
                const transactionData = {
                    username: localStorage.getItem("username"),
                    firstName: this.state.first_name,
                    passengers: this.state.passengers,
                    pickupDateTime: mode.props.date_time,
                    assistant: this.state.assistant,
                    pickupAddress: mode.props.startAddress,
                    dropoffAddress: mode.props.endAddress,
                    pickupLatitude: mode.props.startLoc.lat.toFixed(8),
                    pickupLongitude: mode.props.startLoc.lng.toFixed(8),
                    dropoffLatitude: mode.props.endLoc.lat.toFixed(8),
                    dropoffLongitude: mode.props.endLoc.lng.toFixed(8),
                    phoneNumber: this.state.tel,
                    shuttle: "",
                    serviceArea: this.state.serviceArea,
                    isBoarded: false,
                    isAlighted: false,
                    isPaid: true,
                    isBookedByUser: true,
                    isVirtualRider: false,
                    confirmationCode: require("randomstring").generate(3),
                    auth: localStorage.getItem("auth"),
                    waitSimTime: 0,
                };
                transactionDataList.push(transactionData);
            });
            this.multiplereservationSubmit(transactionDataList);
        }
    };

    openPopup = (stateData) => {
        this.setState({renderPopup : true})
    };

    submitInfoCallback = (data) => {
        this.setState({
            dataofRecommnedation: data,
        })
        this.setState(prevState => ({
            buttonDisableState: {
              ...prevState.buttonDisableState,
              showRecommendation: false,
              saveSearchHistory: false
            }
          })) 
        if (data['riderInfo'] === 'Reject Rider') {
            this.setState({
                gridContent:[
                    ...this.state.gridContent,
                    <ResultGridItem key="No available service" color="#E49393" title="No available service" context="Your starting point or destination is beyond our service coverage area. Please feel free to reach out to the GCTP to arrange your trip." />
                ]
            })
        } else {
            this.calculateCost();
            const uniqueModes = data['mode']
            this.setState({disableConfirmBooking:true})
            for( let j=0; j< uniqueModes.length; j++){
                if(uniqueModes[j] == 1){
                        this.setState({disableConfirmBooking:false});
                }
            }
            let uniqueModesContext = ""
            if (JSON.stringify(uniqueModes) === JSON.stringify([1, 1, 1])) {
                uniqueModesContext += "Door-to-Door On-demand Van 🚐"
            } else {
                for (let i = 0; i < uniqueModes.length; i++) {
                    switch(uniqueModes[i]) {
                        case 0:
                            uniqueModesContext += "🚶 Walking"
                            break;
                        case 1:
                            uniqueModesContext += "🚐 On-demand Van"
                            break;
                        default:
                            uniqueModesContext += "🚌 Waynesburg-Carmichaels Shuttle"
                    }
                    if (i !== uniqueModes.length - 1) uniqueModesContext += " ➡ "
                }
            }
            this.setState({
                gridContent:[
                    ...this.state.gridContent,
                    <ResultGridItem key="Trip Summary" color="#BBD6B8" title="Trip Summary" context={uniqueModesContext} />
                ]
            })
            if (JSON.stringify(uniqueModes) === JSON.stringify([1, 1, 1])) {
                let tmp = this.state.no_of_booking_to_be_done;
                tmp = tmp + 1;
                this.setState({
                    gridContent:[
                        ...this.state.gridContent,
                        <ResultGridItem
                            key="door-to-door shuttle reservation"
                            color="white"
                            title="🚐 On-demand Van (FM)"
                            context="Make your door-to-door on-demand van reservation now!"
                            startAddress= {this.state.startAddress}
                            endAddress= {this.state.endAddress}
                            startLoc= {this.state.startLoc}
                            endLoc= {this.state.endLoc}
                            date_time= {this.state.date_time}
                            assistant = {this.state.assistant}
                            passengers = {this.state.passengers}
                        />
                    ],
                    routeCoords:[
                        ...this.state.routeCoords,
                        {lat:this.state.startLoc.lat, lng:this.state.startLoc.lng},
                        {lat:this.state.endLoc.lat, lng:this.state.endLoc.lng},
                    ],
                    no_of_booking_to_be_done:tmp,
                })
            } else {
                this.setState({
                    routeCoords:[
                        ...this.state.routeCoords,
                        {lat:this.state.startLoc.lat, lng:this.state.startLoc.lng},
                        {lat:data['fixedRoute_firstNode_lat'], lng:data['fixedRoute_firstNode_lng']},
                        {lat:data['fixedRoute_lastNode_lat'], lng:data['fixedRoute_lastNode_lng']},
                        {lat:this.state.endLoc.lat, lng:this.state.endLoc.lng},
                    ]
                })
                for (let i = 0; i < uniqueModes.length; i++) {
                    const currentMode = uniqueModes[i]
                    let currentContext = ""
                    if (i === 0) {
                        currentContext = this.state.startAddress.split(",")[0] + " ➡️ " + data["orig_FR"]
                    } else {
                        currentContext = data["dest_FR"] + " ➡️ " + this.state.endAddress.split(",")[0]
                    }
                    if (currentMode === 0) {
                        this.setState({
                            gridContent:[
                                ...this.state.gridContent,
                                <ResultGridItem key={currentContext} color="white" title="🚶Walking" context={currentContext} />
                            ]
                        })
                    }  else if (currentMode === 1) {
                        if (i === 0) {
                            let tmp = this.state.no_of_booking_to_be_done;
                            tmp = tmp + 1;
                            this.setState({
                                gridContent:[
                                    ...this.state.gridContent,
                                    <ResultGridItem
                                        key={currentContext}
                                        color="white"
                                        title="🚐 On-demand Van (FM)"
                                        context={currentContext}
                                        startAddress= {this.state.startAddress}
                                        endAddress= {data["orig_FR"]}
                                        startLoc= {this.state.startLoc}
                                        endLoc= {{ lat: data["fixedRoute_firstNode_lat"],lng: data["fixedRoute_firstNode_lng"] }}
                                        date_time= {this.state.date_time}
                                        assistant = {this.state.assistant}
                                        passengers = {this.state.passengers}
                                    />
                                ],
                                no_of_booking_to_be_done:tmp,
                            })
                        } else {
                            let tmp = this.state.no_of_booking_to_be_done;
                            tmp = tmp + 1;
                            let start_time = new Date(data['FR_arrTime'] * 1000).toISOString().slice(11, 16)
                            let start_time1 = new Date(data['FR_arrTime'] * 1000);
                            let hours = start_time1.getUTCHours();
                            let minutes = start_time1.getUTCMinutes();
                            let formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                            let dateString = this.state.date_time
                            let newDateString = dateString.replace(/T\d{2}:\d{2}/, `T${formattedTime}`);
                            this.setState({
                                gridContent:[
                                    ...this.state.gridContent,
                                    <ResultGridItem
                                        key={currentContext}
                                        color="white"
                                        title="🚐 On-demand Van (LM)"
                                        context={currentContext}
                                        startAddress={data["dest_FR"]}
                                        endAddress= {this.state.endAddress}
                                        startLoc= {{ lat: data["fixedRoute_lastNode_lat"],
                                            lng: data["fixedRoute_lastNode_lng"] }}
                                        endLoc= {this.state.endLoc}
                                        date_time= {newDateString}
                                        assistant = {this.state.assistant}
                                        passengers = {this.state.passengers}
                                    />
                                ],
                                no_of_booking_to_be_done:tmp,
                            })
                        }
                    } else {
                        let start_time = new Date(data['FR_deptTime'] * 1000);
                        let hours1 = start_time.getUTCHours();
                        let minutes1 = start_time.getUTCMinutes();
                        let formattedTime1 = `${hours1.toString().padStart(2, '0')}:${minutes1.toString().padStart(2, '0')}`;
                        let dateString1 = this.state.date_time
                        let newDateStringStart = dateString1.replace(/T\d{2}:\d{2}/, `T${formattedTime1}`);
                        let formatedtimeStart = new Date(newDateStringStart).toLocaleString();

                        let end_time = new Date(data['FR_arrTime'] * 1000);
                        let hours2 = end_time.getUTCHours();
                        let minutes2 = end_time.getUTCMinutes();
                        let formattedTime2 = `${hours2.toString().padStart(2, '0')}:${minutes2.toString().padStart(2, '0')}`;
                        let dateString2 = this.state.date_time
                        let newDateStringEnd = dateString2.replace(/T\d{2}:\d{2}/, `T${formattedTime2}`);
                        let formatedtimeEnd = new Date(newDateStringEnd).toLocaleString();
                        let currentTitle = "🚌 Waynesburg-Carmichaels Shuttle"
                        let currentContext =  data["orig_FR"] + " ➡️ " + data["dest_FR"]  
                        let pickupAddress = data["orig_FR"]
                        let dropoffAddress = data["dest_FR"]
                        this.setState({
                            gridContent:[
                                ...this.state.gridContent,
                                <ResultGridItem key={currentContext} color="white" title={currentTitle} context={currentContext} starttime={formatedtimeStart} startAddress={pickupAddress} endAddress={dropoffAddress} endtime={formatedtimeEnd} />
                            ]
                        })
                    }
                }
            }
        } 

        if (document.getElementById("option").style.display === "none") {
            document.getElementById("option").style.display = "block";
            document.getElementById("info").style.display = "none";
            this.setState({showHideMap: true})
        }
    };
    isHolidayfx = (selectedDate, holidayList) => {
        for (let holiday of holidayList) {
            if (selectedDate.getMonth() === holiday.getMonth() && 
                selectedDate.getDate() === holiday.getDate()) {
                return true;
            }
        }
        return false;
    };

    handleSubmitInfo = ( event ) => {
        event.preventDefault();
        const selectedDate = new Date(this.state.date_time);

        const selectedTimeHours = selectedDate.getHours();
        const selectedTimeMinutes = selectedDate.getMinutes();
        const dayOfWeek = selectedDate.getDay();

        const morningLimitHours = 8;
        const morningLimitMinutes = 0;
        const eveningLimitHours = 17;

        const isTimeValidWeek = (
            (selectedTimeHours > morningLimitHours || (selectedTimeHours === morningLimitHours && selectedTimeMinutes >= morningLimitMinutes)) &&
            selectedTimeHours < eveningLimitHours
        );
        
        const isHoliday = this.isHolidayfx(selectedDate,this.holidayList);
        const morningLimitHoursWeekEnd = 8;
        const morningLimitMinutesWeekEnd = 0;
        const eveningLimitHoursWeekEnd = 17;

        const isTimeValidWeekEnd = (
            (selectedTimeHours > morningLimitHoursWeekEnd || (selectedTimeHours === morningLimitHoursWeekEnd && selectedTimeMinutes >= morningLimitMinutesWeekEnd)) &&
            selectedTimeHours < eveningLimitHoursWeekEnd
        );

        const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

        if (isWeekday) {
            if (!isTimeValidWeek) {
                let message = 'Please select a time between 8 AM and 5 PM.';
                alert(message);
                return;
            } 
            else if(isHoliday){
                let message = 'Service unavailable on Selected Date.';
                alert(message);
                return;
            }
        } else {
            let message = 'Service only available during the weekdays';
            alert(message);
            return;
        }

        this.setState(prevState => ({
            buttonDisableState: {
                ...prevState.buttonDisableState,
                showRecommendation: true
            }
        })) 

        const submitParams = {
            'passengers': this.state.passengers,
            'date_time': this.state.date_time,
            'pickupLatitude': this.state.startLoc.lat.toFixed(8),
            'pickupLongitude': this.state.startLoc.lng.toFixed(8),
            'dropoffLatitude': this.state.endLoc.lat.toFixed(8),
            'dropoffLongitude': this.state.endLoc.lng.toFixed(8)
        };
        fetchPost('/api/reservation/recommend', submitParams, this.submitInfoCallback);        
    };

    handleSubmitInfo1 = ( ) => {
        this.setState(prevState => ({
            buttonDisableState: {
              ...prevState.buttonDisableState,
              showRecommendation: true
            }
          }))          
        const submitParams = {
            'passengers': this.state.passengers,
            'date_time': this.state.date_time,
            'pickupLatitude': this.state.startLoc.lat.toFixed(8),
            'pickupLongitude': this.state.startLoc.lng.toFixed(8),
            'dropoffLatitude': this.state.endLoc.lat.toFixed(8),
            'dropoffLongitude': this.state.endLoc.lng.toFixed(8)
        };
        fetchPost('/api/reservation/recommend', submitParams, this.submitInfoCallback);
    };

    handleBackToSearch = ( event ) => {
        event.preventDefault();
        if (document.getElementById("option").style.display !== "none") {
            document.getElementById("option").style.display = "none";
            document.getElementById("info").style.display = "block";
            this.setState({showHideMap: false})
            this.setState({gridContent: [], routeCoords: []})
            this.setState({no_of_booking_to_be_done:0})
        }
    };

    reverseGeocodeCoordinatesStart() {
        fetch("https://maps.googleapis.com/maps/api/geocode/json?latlng="+this.state.startLoc.lat+","+this.state.startLoc.lng+"&sensor=false&key="+process.env.REACT_APP_GOOGLE_MAPS_API_KEY)
            .then(response => response.json())
            .then(data => this.setState({
                startAddress: data.results[0].formatted_address,
            }))
            .catch(error => alert(error))
    };

    reverseGeocodeCoordinatesEnd() {
        fetch("https://maps.googleapis.com/maps/api/geocode/json?latlng="+this.state.endLoc.lat+","+this.state.endLoc.lng+"&sensor=false&key="+process.env.REACT_APP_GOOGLE_MAPS_API_KEY)
            .then(response => response.json())
            .then(data => this.setState({
                endAddress: data.results[0].formatted_address,
            }))
            .catch(error => alert(error))
    };

    onMarkerClickStart = ( props, marker) =>
        this.setState({
            selectedPlaceStart: props,
            activeMarkerStart: marker,
        });

    onMarkerDragStart = (coord) => {
        const {latLng} = coord;
        const lat = latLng.lat();
        const lng = latLng.lng();
        this.setState({
            startLoc: {
                lat: lat,
                lng: lng,
            },
            trip_start_loc:{
                lat: lat,
                lng: lng,
            }
        });
        this.reverseGeocodeCoordinatesStart();
    };

    onMarkerDragEnd = (coord) => {
        const {latLng} = coord;
        const lat = latLng.lat();
        const lng = latLng.lng();
        this.setState({
            endLoc: {
                lat: lat,
                lng: lng,
            },
            trip_end_loc:{
                lat: lat,
                lng: lng,
            }
        });
        this.reverseGeocodeCoordinatesEnd();
    };

    onMarkerClickEnd = ( props, marker) =>
        this.setState({
            selectedPlaceEnd: props,
            activeMarkerEnd: marker,
        });

    handleChange = ( event ) => {
        let nam = event.target.name;
        let val = event.target.value;
        if ( nam === 'passengers' && val > 5) {
            val = 5;
            alert("Number of passenger can not be more then five.");
            event.target.value = 5
        }
        this.setState({ [nam]: val });

    };
    
    // Function to save the history 
    submitHistoryCallback = (data) => {
        if ('username' in data) {
            this.setState(prevState => ({
                buttonDisableState: {
                  ...prevState.buttonDisableState,
                  showRecommendationHistory: false,
                  saveSearchHistory: true
                },
                gridContentHistoryList: []
              }));
        } else {
            this.setState(prevState => ({
                buttonDisableState: {
                  ...prevState.buttonDisableState,
                  saveSearchHistory: true
                }    
              }));

            if ( data[0] !== null && data[0] !== '' && data[0].search('UNIQUE') >= 0 ) {
                window.alert('The record for this combination already saved')
            } else {
                window.alert('Application Encountered Error Please contact admin')
            }
        }
    };

    // Start 
    saveHistoryRecommendations = () =>{
        const auth =  localStorage.getItem("auth");
        const username = localStorage.getItem("username")
        const saveParams = {
            'username':username,
            'passengers': this.state.passengers,
            'pickupDateTime': this.state.date_time,
            'pickupAddress':  this.state.startAddress,
            'dropoffAddress': this.state.endAddress,
            'assistant': false ,
            'firstName': '',
            'phoneNumber': ''
        };
        const {startAddress, endAddress, passengers,date_time,startLoc,endLoc} =this.state;
        fetchPost('/api/reservation/history_list_create', saveParams, this.submitHistoryCallback);
    };

    saveHistoryRecommendationsAfterBooking = () =>{
        const auth =  localStorage.getItem("auth");
        const username = localStorage.getItem("username")
        const saveParams = {
            'username':username,
            'passengers': this.state.passengers,
            'pickupDateTime': this.state.date_time,
            'pickupAddress':  this.state.startAddress,
            'dropoffAddress': this.state.endAddress,
            'assistant': this.state.assistant ,
            'firstName': this.state.first_name,
            'tripStartAddress': this.state.startAddress,
            'tripEndAddress': this.state.endAddress,
            'reservation':true,
            'trip_startLoc_lat': this.state.trip_start_loc.lat,
            'trip_startLoc_lng': this.state.trip_start_loc.lng,
            'trip_endLoc_lat' : this.state.trip_end_loc.lat,
            'trip_endLoc_lng' : this.state.trip_end_loc.lng,
            'recommendation_obj': this.state.dataofRecommnedation
        };
        const {startAddress, endAddress, passengers,date_time,startLoc,endLoc} =this.state;
        fetchPost('/api/reservation/history_list_create', saveParams, this.submitHistoryCallback);
    };

    onclickRecommendationHistoryCard = (obj) => {
        this.handleSelectStart(obj.pickupAddress);
        this.handleSelectEnd(obj.dropoffAddress);

        const inputDate = new Date(obj.pickupDateTime);
        const year = inputDate.getFullYear();
        const month = String(inputDate.getMonth() + 1).padStart(2, '0');
        const day = String(inputDate.getDate()).padStart(2, '0');
        const hours = String(inputDate.getHours()).padStart(2, '0');
        const minutes = String(inputDate.getMinutes()).padStart(2, '0');

        const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
        var oldstate = {...this.state}
        oldstate.date_time = formattedDateTime;
        oldstate.passengers = (obj.passengers).toString();
        oldstate.startAddress = obj.pickupAddress;
        oldstate.endAddress = obj.dropoffAddress;
        oldstate.savedInHistory = true;
        this.setState(oldstate,()=>{
            this.handleSubmitInfo1();
        });
    };

    tmpfx = ()=>{
    };

    showHistoryRecommendations = () => {
        let gridContentHistoryList = [];
        const renderRecommendationHistory = (data) => {
            data.forEach(obj => {
                const {firstName,passengers,pickupDateTime,assistant,pickupAddress,dropoffAddress,phoneNumber} = obj;
                const currentTitle = `${firstName} (${passengers}) `;        
                const address = `Start Loc : ${pickupAddress}  End Loc: ${dropoffAddress}`;
                const info = `Pick up Time : ${pickupDateTime}
                Require Assisstance ${assistant}`;
                const keyid = Math.random().toString();
                gridContentHistoryList.push(
                    <ResultGridItem1 key={keyid} color="#grey" {...obj} onClick={()=>this.onclickRecommendationHistoryCard(obj)}/>
                );
            });
            this.setState(prevState => ({
                gridContentHistoryList: [...gridContentHistoryList],
                buttonDisableState: {
                    ...prevState.buttonDisableState,
                    showRecommendationHistory: true
                }
            }));
        };
        fetchGet('/api/reservation/history_list', {}, renderRecommendationHistory);
    };

    handleChangeAssistant = () => {
        this.setState({ assistant: !this.state.assistant });
    };

    // End
    render() {
        return (
            <Container maxWidth="xl">
                <Sidebar username={localStorage.getItem("username")}/>
                <Grid container spacing={2} className="eta-grid">
                    <Grid item xs={12} sm={12} md={12} lg={12} >
                        <Box sx={{ width: '100%', maxWidth: 1850, mx: 'auto', mt: 2, mb: 2 }}>
                            <Map
                                id="gmap"
                                google={ this.props.google }
                                initialCenter={{
                                    lat: this.state.mapCenter.lat,
                                    lng: this.state.mapCenter.lng
                                }}
                                style={{
                                    height: "30vh",
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
                                { this.state.showHideMap ?
                                    (<Polyline
                                        display="none"
                                        path={this.state.routeCoords}
                                        strokeColor="#0000FF"
                                        strokeOpacity={0.5}
                                        strokeWeight={5}
                                    />) : null }
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
                                <Marker
                                    position={{
                                        lat: this.state.startLoc.lat,
                                        lng: this.state.startLoc.lng
                                    }}
                                    draggable={ true }
                                    onDragend={ (t, map, coord) => this.onMarkerDragStart(coord) }
                                    icon={{
                                        path: faMapMarkerAlt.icon[4],
                                        fillColor: 'blue',
                                        fillOpacity: 1,
                                        scale: 0.06,
                                        anchor: new this.props.google.maps.Point(
                                            faMapMarkerAlt.icon[0] / 2,
                                            faMapMarkerAlt.icon[1]
                                        ),
                                    }}
                                    onClick={ this.onMarkerClickStart }
                                />
                                <Marker
                                    position={{
                                        lat: this.state.endLoc.lat,
                                        lng: this.state.endLoc.lng
                                    }}
                                    draggable={ true }
                                    onDragend={ (t, map, coord) => this.onMarkerDragEnd(coord) }
                                    icon={{
                                        path: faMapMarkerAlt.icon[4],
                                        fillColor: 'red',
                                        fillOpacity: 1,
                                        scale: 0.06,
                                        anchor: new this.props.google.maps.Point(
                                            faMapMarkerAlt.icon[0] / 2,
                                            faMapMarkerAlt.icon[1]
                                        ),
                                    }}
                                    onClick={ this.onMarkerClickEnd }
                                />
                            </Map>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={12} md={12} lg={12}>
                        <Box sx={{ height: "30vh" }} />
                    </Grid>
                    <Grid item xs={12} sm={12} md={12} lg={12}>
                        <Container component="main" id="info" maxWidth="sm" sx={{ marginBottom: -2 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }} >
                                <Box
                                    component="form"
                                    sx={{ display: 'flex', alignItems: 'center', marginLeft: -2 }}
                                >
                                    <IconButton sx={{ p: '10px' }}>
                                        <SearchIcon style={{ fontSize: 40 }} />
                                    </IconButton>
                                    <Typography component="h1" variant="h4" color="black">
                                        Search for Your Ride
                                    </Typography>
                                </Box>
                                <Box component="form" sx={{ mt: 3, mb: 3, width: '80%', zIndex: 1200 }} onSubmit={ this.handleSubmitInfo }>
                                    <Typography color={"textSecondary"}>
                                        Trip Information
                                    </Typography>
                                    <PlacesAutocomplete
                                        value={ this.state.startAddress }
                                        onChange={ this.handleChangeStart }
                                        onSelect={ this.handleSelectStart }
                                    >
                                        {({ getInputProps, suggestions, getSuggestionItemProps, loading }) => (
                                            <div>
                                                <TextField
                                                    fullWidth
                                                    required
                                                    label="Starting Point"
                                                    margin="normal"
                                                    defaultValue="Current Position"
                                                    {...getInputProps({
                                                        placeholder: 'Set Your Starting Point',
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
                                    <PlacesAutocomplete
                                        value={ this.state.endAddress }
                                        onChange={ this.handleChangeEnd }
                                        onSelect={ this.handleSelectEnd }
                                    >
                                        {({ getInputProps, suggestions, getSuggestionItemProps, loading }) => (
                                            <div>
                                                <TextField
                                                    fullWidth
                                                    required
                                                    label="Destination"
                                                    margin="normal"
                                                    {...getInputProps({
                                                        placeholder: 'Set Your Destination',
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
                                    <TextField
                                        required
                                        margin="normal"
                                        fullWidth
                                        name="first_name"
                                        variant="outlined"
                                        label="First Name"
                                        placeholder="Enter Your Name"
                                        value={ this.state.first_name }
                                        onChange={ this.handleChange }
                                    />
                                    <TextField
                                        margin="normal"
                                        fullWidth
                                        name="passengers"
                                        variant="outlined"
                                        label="Number of Passengers"
                                        placeholder="Enter A Number"
                                        min="1"
                                        max="5"
                                        required
                                        defaultValue='1'
                                        onChange={ this.handleChange }
                                    />
                                    <TextField
                                        margin="normal"
                                        fullWidth
                                        variant="outlined"
                                        id="date_time"
                                        name="date_time"
                                        label="Pickup Time"
                                        type="datetime-local"
                                        required
                                        defaultValue={ formatDate(this.getIn5Minutes().toLocaleString()) + "T" + this.getIn5Minutes().toTimeString().slice(0, 5) }
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                        sx={{mb:3}}
                                        onChange={ this.handleChange }
                                    />
                                    <Typography color={"textSecondary"} sx={{ mb: 0.5, mt: -1.5 }} style={{ display: 'none' }}>
                                        Need Assistant?
                                    </Typography>
                                    <FormControl style={{ display: 'none' }}>
                                        <FormControlLabel
                                            control={<Checkbox />}
                                            label="Assistant (Wheelchair Access)"
                                            labelPlacement="end"
                                            onChange={ this.handleChangeAssistant }
                                            defaultChecked={ this.state.assistant }
                                        />
                                    </FormControl>
                                    <Button
                                        fullWidth
                                        type="submit"
                                        variant="contained"
                                        sx={{ mt: 1, mb: 2 }}
                                        disabled={this.state.buttonDisableState.showRecommendation}
                                    >
                                        Show Recommendation
                                    </Button>
                                    <Button
                                        fullWidth
                                        color="secondary"
                                        variant="contained"
                                        sx={{ mt: 2, mb: 4 }}
                                        onClick={ this.showHistoryRecommendations }
                                        disabled={this.state.buttonDisableState.showRecommendationHistory}
                                    >
                                        Show Recommendation History
                                    </Button>

                                    <Grid container id="historyList" spacing={2} alignItems="center" justifyContent="center">
                                        {this.state.gridContentHistoryList}
                                    </Grid>
                                </Box>
                            </Box>
                        </Container>

                        <Container component="main" maxWidth="xs" id="option" style={{ display: "none" }}>
                            <Button
                                fullWidth
                                type="submit"
                                variant="contained"
                                sx={{ mb: 4 }}
                                onClick={ this.handleBackToSearch }
                            >
                                Go Back to Search
                            </Button>
                            
                            <div>
                                {false ? (<div>True</div>): (<Grid container id="searchResult" spacing={2} alignItems="center" justifyContent="center">
                                    {this.state.gridContent}
                                </Grid>)}
                            </div>
                            {this.state.disableConfirmBooking ? (
                                <div></div>
                            ) : (
                                <div>
                                    <Paper 
                                        elevation={1} 
                                        sx={{ padding: 2, textAlign: 'center', marginTop: 2, marginBottom: 2 }}
                                    >
                                        <Box component="h5" sx={{ mt: 1, mb: 1 }}>
                                            Trip Cost : {this.state.costForTrip} per passenger
                                        </Box>
                                    </Paper>
                                </div>
                            )}

                            <Button
                                fullWidth
                                type="submit"
                                variant="contained"
                                sx={{ mt: 1,mb: 1 }}
                                onClick={ this.newBooking }
                                disabled={this.state.disableConfirmBooking}
                            >
                                Confirm Booking
                            </Button>

                            {this.state.savedInHistory ? '':
                            <Button
                                fullWidth
                                color="secondary"
                                type="submit"
                                variant="contained"
                                sx={{ mt: 2, mb: 4 }}
                                onClick={ this.saveHistoryRecommendations }
                                disabled={this.state.buttonDisableState.saveSearchHistory}
                            >
                                Save search to history
                            </Button>}
                            <br />
                        </Container>
                    </Grid>
                </Grid>
            </Container>
        )
    }
}


// The confirmation modal for submit actions
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


function ResultGridItem(props) {
    if (props.title.includes('On-demand Van')) {
    const formatedtime = new Date(props.date_time).toLocaleString();

        return(
        <Grid item xs={12}>
            <CardActionArea component="a" {...props}>
                <Card sx={{ backgroundColor: props.color, display: 'flex', width: '100%' }}>
                    <CardContent>
                        <Box sx={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                            <Typography variant="h5">
                                {props.title}
                            </Typography>
                            <Typography variant="subtitle1" color="textSecondary" sx={{ display: 'block' }}>
                                {props.context}
                            </Typography>
                            <Typography variant="body1">
                                At {formatedtime} for {props.passengers} individuals <br />
                                From: {props.startAddress} <br />
                                To: {props.endAddress}
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            </CardActionArea>
        </Grid>
        )
    } else if (props.title.includes('Bus')) {
        return (
           <Grid item xs={12}>
                <CardActionArea component="a" {...props}>
                    <Card sx={{ backgroundColor: props.color, display: 'flex', width: '100%' }}>
                        <CardContent>
                            <Box sx={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                <Typography variant="h5">
                                    {props.title}
                                </Typography>
                                <Typography variant="subtitle1" color="textSecondary" sx={{ display: 'block' }}>
                                    {props.context}
                                </Typography>
                                <Typography component="div" variant="body1">
                                At {props.starttime} <br />
                                From :{props.startAddress} <br />
                                To :{props.endAddress} by {props.endtime}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </CardActionArea>
            </Grid>
        );

    } else if (props.title.includes('Shuttle')) {
        return (
           <Grid item xs={12}>
                <CardActionArea component="a" {...props}>
                    <Card sx={{ backgroundColor: props.color, display: 'flex', width: '100%' }}>
                        <CardContent>
                            <Box sx={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                <Typography variant="h5">
                                    {props.title}
                                </Typography>
                                <Typography variant="subtitle1" color="textSecondary" sx={{ display: 'block' }}>
                                    {props.context}
                                </Typography>
                                <Typography component="div" variant="body1">
                                At {props.starttime} <br />
                                From :{props.startAddress} <br />
                                To :{props.endAddress} by {props.endtime}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </CardActionArea>
            </Grid>
        );

    } else {
        return (
            <Grid item xs={12}>
                <CardActionArea component="a" {...props}>
                    <Card sx={{ backgroundColor: props.color, display: 'flex', width: '100%' }}>
                        <CardContent>
                        <Box sx={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                            <Typography variant="h5">
                                {props.title}
                            </Typography>
                            <Typography variant="subtitle1" color="textSecondary" sx={{ display: 'block' }}>
                                {props.context}
                            </Typography>
                        </Box>
                        </CardContent>
                    </Card>
                </CardActionArea>
            </Grid>
        );
    }
}


function ResultGridItem1(props) {
    const formatedtime = new Date(props.pickupDateTime).toLocaleString();
    return (
        
        <Grid item xs={12}>
            <CardActionArea component="a" {...props}>
                <Card style={{backgroundColor: props.color}} sx={{ display: 'flex' }}>
                    <CardContent sx={{ flex: '1 0 auto' }}>
                        <Typography component="div" variant="body1">
                            At {formatedtime} for {props.passengers} indiviuals <br />
                            From :{props.pickupAddress} <br />
                            To :{props.dropoffAddress}
                        </Typography>
                        <Typography variant="div" color="text.secondary" component="div" >
                            {props.assistant}
                        </Typography>
                    </CardContent>
                </Card>
            </CardActionArea>
        </Grid>
    );
}


const onDemandInstance = new OnDemandPage();
export const tmpfx = onDemandInstance.tmpfx.bind(onDemandInstance);
export const handleSubmitInfo = onDemandInstance.handleSubmitInfo.bind(onDemandInstance);
// export { OnDemandPage };
export default GoogleApiWrapper({
    apiKey: ( process.env.REACT_APP_GOOGLE_MAPS_API_KEY )
})( OnDemandPage )
