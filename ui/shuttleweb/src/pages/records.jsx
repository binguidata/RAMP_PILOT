import React, { useEffect, useState } from "react";
import useCustomHistory from './useCustomHistory';
import { Form, Modal, Tab, Tabs } from 'react-bootstrap';
import { 
    Button, Card, CardActionArea, CardContent, Container, Grid, Paper, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, TextField, Typography
} from '@material-ui/core';

import { fetchGet, fetchPost } from "./request";
import { Sidebar } from "../components/sidebar";
import "../styles/style.css";


function ResultGridItem(props) {
    return (
        <Grid item xs={12}>
            <CardActionArea component="a" {...props}>
                <Card style={{backgroundColor: props.color}} sx={{ display: 'flex' }}>
                    <CardContent sx={{ flex: '1 0 auto' }}>
                        <Typography component="div" variant="h5">
                            {props.title}
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary" component="div">
                            {props.context}
                        </Typography>
                    </CardContent>
                </Card>
            </CardActionArea>
        </Grid>
    );
};


function formatDateAndTime(date) {
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


export function RecordPage () {

    const [didUpdate, setDidUpdate] = useState(false);
    const [activeTrans, setActiveTrans] = useState([]);
    const [upcomingTrans, setUpcomingTrans] = useState([]);
    const [pastTrans, setPastTrans] = useState([]);
    const [key, setKey] = useState("Upcoming");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [auth, setAuth] = useState(-1);

    const reservationHandle = () => {
        setDidUpdate(false)
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    const reservationCallback = (data) => {
        let activeTrans = []
        let upcomingTrans = []
        let pastTrans = []
        for (let i = 0; i < data.length; i++) {
            let record = {}
            record["id"] = data[i]["id"]
            record["first_name"] = data[i]["firstName"]
            record["passengers"] = data[i]["passengers"]
            let pickupDateTime = new Date(data[i]["pickupDateTime"])
            record['pickupDateTime'] = pickupDateTime
            record['date_time_12hr_format'] = formatDateAndTime(pickupDateTime)
            record["date_time"] = pickupDateTime.getMonth() + 1 + "/" + pickupDateTime.getDate()
                + "/" + pickupDateTime.getFullYear() + " " + formatNum(pickupDateTime.getHours()) + ":"
                + formatNum(pickupDateTime.getMinutes())
            record["date"] = pickupDateTime.getMonth() + 1 + "/" + pickupDateTime.getDate()
                + "/" + pickupDateTime.getFullYear()
            record["default_date_time"] = String(
                formatDate(pickupDateTime) + "T" + pickupDateTime.getHours() + ":"
                + pickupDateTime.getMinutes())
            record["assistant"] = data[i]["assistant"]
            if ( data[i]["pickupAddress"] === "2001 Park Manor Blvd, Pittsburgh, PA 15205" ) {
                record["pickup_address"] = "IKEA Station"
                record["label"] = "Please Set Your Drop-off Location"
            } else {
                record["pickup_address"] = data[i]["pickupAddress"]
            }
            if ( data[i]["dropoffAddress"] === "2001 Park Manor Blvd, Pittsburgh, PA 15205" ) {
                record["dropoff_address"] = "IKEA Station"
                record["label"] = "Please Set Your Pickup Location"
            } else {
                record["dropoff_address"] = data[i]["dropoffAddress"]
            }
            record["confirmation_code"] = data[i]["confirmationCode"]
            record["isBoarded"] = data[i]["isBoarded"]
            record["isAlighted"] = data[i]["isAlighted"]
            record["isCanceled"] = data[i]["isCanceled"]
            record["isMissed"] = data[i]["isMissed"]
            record["isBookedByUser"] = data[i]["isBookedByUser"]
            record["isBookedByDriver"] = data[i]["isBookedByDriver"]
            record["isBookedByManager"] = data[i]["isBookedByManager"]
            record['serviceArea'] = data[i]["serviceArea"];
            record['shuttleColor'] = data[i]["shuttleColor"];
            record['shuttleMake'] = data[i]["shuttleMake"];
            record['shuttleModel'] = data[i]["shuttleModel"];
            record['shuttlePlatenumber'] = data[i]["shuttlePlatenumber"];
            if ( data[i]["isPaid"] ) {
                record["balance_due"] = "Paid"
            } else {
                record["balance_due"] = 'Cash $'+(data[i]["passengers"]*0.25).toFixed(2).toString()
            }
            let currentDate = GetCurrentDate()
            if ( record["date"] === currentDate ) {
                record["isToday"] = 1
            } else {
                record["isToday"] = 0
            }
            if ( record["date"] < currentDate ) {
                record["isPast"] = 1
            } else {
                record["isPast"] = 0
            }
            if ( record["date"] > currentDate ) {
                record["isFuture"] = 1
            } else {
                record["isFuture"] = 0
            }
            record["timeDiff"] = record["pickupDateTime"] - Date.now()
            record["waitSimTime"] = data[i]["waitSimTime"]
            if ( record["timeDiff"] < 900000 ) {
                record["eta"] = Math.floor(record["waitSimTime"] / 60 + record["timeDiff"] / 60000)
            } else {
                record["eta"] = 'Not Available'
            }
            if ( record["isCanceled"] === true ) {
                record["status"] = "Canceled"
            } else if ( record["isAlighted"] === true ) {
                record["status"] = "Completed"
            } else if ( record["isMissed"] === true || record["timeDiff"] < -86400000 ) {
                record["status"] = "Missed"
            } else if  ( record["isBoarded"] === true && record["isAlighted"] === false ) {
                record["status"] = "Boarded"
            } else if ( record["isMissed"] === false && record["isCanceled"] === false && record["isBoarded"] === false && record["isAlighted"] === false ) {
                record["status"] = "Missed"
            }

            if ( record["isFuture"] === 1 && record["isCanceled"] === false && record["isMissed"] === false ) {
                upcomingTrans.push(record)
            } else if ( record["isToday"] === 1 && record["isCanceled"] === false && record["isMissed"] === false ) {
                upcomingTrans.push(record)
            } else if ( record["isToday"] === 1 && record["isBoarded"] === true && record["isAlighted"] === false ) {
                activeTrans.push(record)
            } else {
                pastTrans.push(record)
            }
        }
        setActiveTrans(activeTrans)
        setUpcomingTrans(upcomingTrans.reverse())
        setPastTrans(pastTrans)
        setDidUpdate(true)
    };

    useEffect(() => {
        if (didUpdate) {
            return
        }
        fetchGet('/api/reservation/view', {}, reservationCallback);

        setAuth(localStorage.getItem("auth"));
    }, [didUpdate]);

    return (
        <Container maxWidth="xl">
            <Sidebar username={localStorage.getItem( "username" )}/>
            <Grid container spacing={2} className="reservation-grid">
                <Grid item xs={12} sm={12} md={12} lg={12}>
                    <br/>
                    <Typography
                        component="h1"
                        variant="h4"
                        align="center"
                        color="text.primary"
                        gutterBottom
                    >
                        Reservations
                    </Typography>
                </Grid>

                <Grid item xs={12} sm={12} md={12} lg={12}>
                    <Tabs activeKey={key} onSelect={(k) => setKey(k)}>

                        <Tab eventKey="Active" title="Active">
                            <Paper>
                                <TableContainer className="ride-tableContainer">
                                    <Table stickyHeader aria-label="sticky table">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell align="center"><strong>First Name</strong></TableCell>
                                                <TableCell align="center"><strong>Number of Passengers</strong></TableCell>
                                                <TableCell align="center"><strong>Pickup Location</strong></TableCell>
                                                <TableCell align="center"><strong>Drop-off Location</strong></TableCell>
                                                <TableCell align="center"><strong>Pickup Time</strong></TableCell>
                                                <TableCell align="center"><strong>Confirmation Code</strong></TableCell>
                                                <TableCell align="center"><strong>Shuttle</strong></TableCell>
                                                <TableCell align="center"><strong>Information</strong></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            { activeTrans.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item, index) => (
                                                <TableRow key={ "active" + index }>
                                                    <TableCell align="center">{ item.first_name }</TableCell>
                                                    <TableCell align="center">{ item.passengers }</TableCell>
                                                    <TableCell align="center" style={{ display: 'none' }}>{ item.assistant ? "Yes" : "No"}</TableCell>
                                                    <TableCell align="center">{ item.pickup_address }</TableCell>
                                                    <TableCell align="center">{ item.dropoff_address }</TableCell>
                                                    <TableCell align="center">{ item.date_time_12hr_format }</TableCell>
                                                    <TableCell align="center">{ item.confirmation_code }</TableCell>
                                                    <TableCell align="center">{ item.shuttle }</TableCell>
                                                    <TableCell align="center">
                                                        { <ReservationOperation
                                                                id={ item.id }
                                                                date_time={ item.pickupDateTime }
                                                                shuttle={ item.shuttle }
                                                                isBoarded={ item.isBoarded }
                                                                isBookedByUser={ item.isBookedByUser }
                                                                auth={ auth }
                                                                operation={ 'information' }
                                                                updateHandle={ reservationHandle }
                                                                shuttlePickupAddress = {item.pickup_address}
                                                                shuttleDropOffAddress = {item.dropoff_address}
                                                                firstName = {item.first_name}
                                                                passengers = {item.passengers}
                                                                tab = {key}
                                                            />
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
                                    count={activeTrans.length}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    onPageChange={handleChangePage}
                                    onRowsPerPageChange={handleChangeRowsPerPage}
                                />
                            </Paper>
                        </Tab>

                        <Tab eventKey="Upcoming" title="Upcoming">
                            <Paper>
                                <TableContainer className="ride-tableContainer">
                                    <Table stickyHeader aria-label="sticky table">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell align="center"><strong>Vehicle Description</strong></TableCell>
                                                <TableCell align="center"><strong>First Name</strong></TableCell>
                                                <TableCell align="center"><strong>Number of Passengers</strong></TableCell>
                                                <TableCell align="center"><strong>Pickup Location</strong></TableCell>
                                                <TableCell align="center"><strong>Drop-off Location</strong></TableCell>
                                                <TableCell align="center"><strong>Pickup Time</strong></TableCell>
                                                <TableCell align="center"><strong>Confirmation Code</strong></TableCell>
                                                <TableCell align="center"><strong>Estimated Time of Arrival</strong></TableCell>
                                                <TableCell align="center"><strong>Rebook</strong></TableCell>
                                                <TableCell align="center"><strong>Cancel</strong></TableCell>
                                                <TableCell align="center"><strong>Information</strong></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            { upcomingTrans.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item, index) => (
                                                <TableRow key={ 'upcoming' + index }>
                                                    <TableCell align="center">{item.shuttlePlatenumber ? item.shuttleColor + " " + item.shuttleMake + " " + item.shuttleModel + " Plate No. " + item.shuttlePlatenumber : "NA"}</TableCell>
                                                    <TableCell align="center">{ item.first_name }</TableCell>
                                                    <TableCell align="center">{ item.passengers }</TableCell>
                                                    <TableCell align="center">{ item.pickup_address }</TableCell>
                                                    <TableCell align="center">{ item.dropoff_address }</TableCell>
                                                    <TableCell align="center">{ item.date_time_12hr_format }</TableCell>
                                                    <TableCell align="center">{ item.confirmation_code }</TableCell>
                                                    <TableCell align="center">{ item.eta }</TableCell>
                                                    <TableCell align="center">
                                                        { item.timeDiff > 900000 ?
                                                            <ReservationOperation
                                                                id={ item.id }
                                                                first_name={ item.first_name }
                                                                passengers={ item.passengers }
                                                                assistant={ item.assistant }
                                                                pickup_address={ item.pickup_address }
                                                                dropoff_address={ item.dropoff_address }
                                                                direction_label={ item.label }
                                                                date_time={ item.pickupDateTime }
                                                                default_date_time={ item.default_date_time }
                                                                shuttle={ item.shuttle }
                                                                confirmation_code={ item.confirmation_code }
                                                                isBoarded={ item.isBoarded }
                                                                isBookedByUser={ item.isBookedByUser }
                                                                auth={ auth }
                                                                operation={ 'rebook' }
                                                                updateHandle={ reservationHandle }
                                                            />
                                                            :
                                                            'Not Available'
                                                        }
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        { item.timeDiff > 900000 ?
                                                            <ReservationOperation
                                                                id={ item.id }
                                                                date_time={ item.pickupDateTime }
                                                                shuttle={ item.shuttle }
                                                                isBoarded={ item.isBoarded }
                                                                isBookedByUser={ item.isBookedByUser }
                                                                auth={ auth }
                                                                operation={ 'cancel' }
                                                                updateHandle={ reservationHandle }
                                                            />
                                                            :
                                                            'Not Available'
                                                        }
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        { <ReservationOperation
                                                                id={ item.id }
                                                                date_time={ item.pickupDateTime }
                                                                shuttle={ item.shuttle }
                                                                isBoarded={ item.isBoarded }
                                                                isBookedByUser={ item.isBookedByUser }
                                                                auth={ auth }
                                                                operation={ 'information' }
                                                                updateHandle={ reservationHandle }
                                                                shuttlePickupAddress = {item.pickup_address}
                                                                shuttleDropOffAddress = {item.dropoff_address}
                                                                firstName = {item.first_name}
                                                                passengers = {item.passengers}
                                                                tab = {key}
                                                            />
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
                                    count={upcomingTrans.length}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    onPageChange={handleChangePage}
                                    onRowsPerPageChange={handleChangeRowsPerPage}
                                />
                            </Paper>
                        </Tab>

                        <Tab eventKey="Past" title="Past">
                            <Paper>
                                <TableContainer>
                                    <Table stickyHeader aria-label="sticky table">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell align="center"><strong>First Name</strong></TableCell>
                                                <TableCell align="center"><strong>Number of Passengers</strong></TableCell>
                                                <TableCell align="center" style={{ display: 'none' }}><strong>Assistant <br/>(wheelchair Access)</strong></TableCell>
                                                <TableCell align="center"><strong>Pickup Location</strong></TableCell>
                                                <TableCell align="center"><strong>Drop-off Location</strong></TableCell>
                                                <TableCell align="center"><strong>Pickup Time</strong></TableCell>
                                                <TableCell align="center"><strong>Status</strong></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            { pastTrans.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item, index) => (
                                                <TableRow key={ "past" + index }>
                                                    <TableCell align="center">{ item.first_name }</TableCell>
                                                    <TableCell align="center">{ item.passengers }</TableCell>
                                                    <TableCell align="center" style={{ display: 'none' }}>{ item.assistant ? "Yes" : "No"}</TableCell>
                                                    <TableCell align="center">{ item.pickup_address }</TableCell>
                                                    <TableCell align="center">{ item.dropoff_address }</TableCell>
                                                    <TableCell align="center">{ item.date_time_12hr_format }</TableCell>
                                                    <TableCell align="center">{ item.status }</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <TablePagination
                                    rowsPerPageOptions={[5, 10, 20]}
                                    component="div"
                                    count={pastTrans.length}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    onPageChange={handleChangePage}
                                    onRowsPerPageChange={handleChangeRowsPerPage}
                                />
                            </Paper>
                        </Tab>
                    </Tabs>
                </Grid>
            </Grid>
        </Container>
    )
};


// prompt modal for modify and cancel actions
export function ReservationOperation ( props ) 
{
    const [passengers, setPassengers] = useState(1);
    const [dateTime, setDateTime] = useState('');
    const [modifyModalShow, setModifyModalShow] = useState(false);
    const [, setModifyOptions] = useState([]);
    const [modifyPrompt, setModifyPrompt] = useState(null);
    const [actionModalShow, setActionModalShow] = useState(false);
    const [actionPrompt, setActionPrompt] = useState(null);
    const [gridContent, setGridContent] = useState([]);
    const [isGridContentSet, setIsGridContentSet] = useState(false);
    const [, updateState] = React.useState();
    const forceUpdate = React.useCallback(() => updateState({}), []);
    var tripStartAddress = ''
    var tripEndAddress = ''

    const handleModifyShow = () => {
        // event.preventDefault();
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
        setActionModalShow(false)
        setActionPrompt(<p/>)
        setTimeout(() => {
            props.updateHandle()
        }, 800)
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
                setModifyPrompt(<p>Modify successfully, page will be refreshed in a sec...</p>)
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
    }

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
    
    const handleRebook = () => {
        
        const params = {
            'username': localStorage.getItem('username'),
            'tranId': props.id,
            'isBoarded': props.isBoarded,
            'shuttle': props.shuttle,
            'action': 'cancel',
            'pickupDateTime': props.date_time,
            'auth': props.auth,
        }

        const rebookCallback = (data) => {
            if ('error' in data) {
                setActionPrompt(<p>{data['error']}</p>)
                handleActionShow()
            } else {
                setActionPrompt(<p>You successfully canceled a reservation!</p>)
                handleActionShow()
                const redirectTimeout = setTimeout(() => {
                    window.location.href = '../ondemand';
                  }, 1500);
                
            }
        }

        fetchPost('/api/reservation/action', params, rebookCallback)
    };

    const [confirmModalShow, setConfirmModalShow] = useState(false)
    const [confirmPrompt, setConfirmPropmt] = useState(<p/>)

    const handleConfirmShow = () => {
        setConfirmModalShow(true)
    };

    const handleConfirmClose = () => {
        setConfirmModalShow(false)
    };

    const handleRebookClick = (event) => {
        event.preventDefault();
        setConfirmPropmt(<p>Rebook the Reservation ?</p>)
        handleConfirmShow()
    };

    const handleCancelClick = (event) => {
        event.preventDefault();
        setConfirmPropmt(<p>Cancel the Reservation?</p>)
        handleConfirmShow()
    };

    const handleInformationClick = (event) => 
    {
        event.preventDefault(); 
        const params = {
            'username': localStorage.getItem('username'),
            'passengers': props.passengers,
            'pickupDateTime': dateTime,
            'pickupAddress': props.shuttlePickupAddress,
            'dropoffAddress' : props.shuttleDropOffAddress,
            'firstName' : props.firstName,
            'reservation': true
        }
        var updatedGridContent = []
        const submitInfoCallback = (data) => 
        {
            if ('error' in data) {
                setActionPrompt(<p>{data['error']}</p>)
                handleActionShow()
            } else {              
                if (data['riderInfo'] === 'Reject Rider') {
                    updatedGridContent = [ ...updatedGridContent,
                        <ResultGridItem key="No available service" color="#E49393" title="No available service" context="Starting point or destination out of service area" />
                    ]
                } else {                    
                    const uniqueModes = data['mode']
                    let uniqueModesContext = ""
                    if (JSON.stringify(uniqueModes) === JSON.stringify([1, 1, 1])) {
                        uniqueModesContext += "Door-to-Door On-demand Van🚐"
                    } else {
                        for (let i = 0; i < uniqueModes.length; i++) {
                            switch(uniqueModes[i]) {
                                case 0:
                                    uniqueModesContext += "🚶Walking"
                                    break;
                                case 1:
                                    uniqueModesContext += "🚐 On-demand Van"
                                    break;
                                default:
                                    uniqueModesContext += "🚌 Waynesburg - Carmichaels Shuttle"
                            }
                            if (i !== uniqueModes.length - 1) uniqueModesContext += " ➡ "
                        }
                    }
                    updatedGridContent = [ ...updatedGridContent,
                        <ResultGridItem key="Trip Summary" color="#BBD6B8" title="Trip Summary" context={uniqueModesContext} />
                    ]
                    if (JSON.stringify(uniqueModes) === JSON.stringify([1, 1, 1])) {
                        updatedGridContent = [ ...updatedGridContent,
                            <ResultGridItem
                                    key="door-to-door shuttle reservation"
                                    color="white"
                                    title="🚐 On-demand Van"
                                    context = {tripStartAddress + " ➡️ " + tripEndAddress}
                                />
                        ]
                    } else {
                        for (let i = 0; i < uniqueModes.length; i++) 
                        {
                            const currentMode = uniqueModes[i]
                            let currentContext = ""
                            if (i === 0) {
                                currentContext = tripStartAddress + " ➡️ " + data["orig_FR"]
                                
                            } else {
                                currentContext = data["dest_FR"] + " ➡️ " + tripEndAddress
                            }
                            if (currentMode === 0) {
                                updatedGridContent = [ ...updatedGridContent,
                                    <ResultGridItem key={currentContext} color="white" title="🚶Walking" context={currentContext} />
                                ]

                            }  else if (currentMode === 1) {
                                if (i === 0) {
                                    updatedGridContent = [ ...updatedGridContent,
                                        <ResultGridItem
                                                key={currentContext}
                                                color="white"
                                                title="🚐 On-demand Van" 
                                                context={currentContext}
                                            />
                                    ]
                                } else {
                                    updatedGridContent = [ ...updatedGridContent,
                                        <ResultGridItem
                                            key={currentContext}
                                            color="white"
                                            title="🚐 On-demand Van"
                                            context={currentContext}
                                        />
                                    ]
                                }
                            } else {
                                let currentTitle = "🚌 Waynesburg - Carmichaels Shuttle"
                                currentContext = data["orig_FR"] + " (" + new Date(data['FR_deptTime'] * 1000).toISOString().slice(11, 16) + ") ➡️ " + data["dest_FR"] + " (" + new Date(data['FR_arrTime'] * 1000).toISOString().slice(11, 16) + ")"
                                updatedGridContent = [ ...updatedGridContent,
                                    <ResultGridItem key={currentContext} color="white" title={currentTitle} context={currentContext} />
                                ]
                            }
                        }
                    }
                    setGridContent([...updatedGridContent]); 
                    forceUpdate();  
                }
                setActionPrompt(
                    <div>
                    <Grid container id="searchResult" spacing={2} alignItems="center" justifyContent="center">
                                {updatedGridContent}
                        </Grid>
                    </div>
                    
                )
                handleActionShow()
            }
        }

        const informationCallback = (data) => {
            setGridContent(prevGridContent => [])
            if ('error' in data || data == null) {
                setActionPrompt(<p>{data['error']}</p>)
                handleActionShow()
            } else {                
                const historyrec = data[0]
                tripStartAddress = historyrec.tripStartAddress
                tripEndAddress = historyrec.tripEndAddress
                const inputDatetime = historyrec.pickupDateTime;

                const dateObj = new Date(inputDatetime);

                const localDatetime = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000));

                const year = localDatetime.getFullYear();
                const month = String(localDatetime.getMonth() + 1).padStart(2, "0");
                const day = String(localDatetime.getDate()).padStart(2, "0");
                const hours = String(localDatetime.getHours()).padStart(2, "0");
                const minutes = String(localDatetime.getMinutes()).padStart(2, "0");

                const formattedDatetime = `${year}-${month}-${day}T${hours}:${minutes}`;
                
                if (props.tab === "Upcoming") {
                    const submitParams = {
                        'passengers': historyrec.passengers,
                        'date_time': formattedDatetime,
                        'pickupLatitude': historyrec.trip_startLoc_lat.toFixed(8),
                        'pickupLongitude': historyrec.trip_startLoc_lng.toFixed(8),
                        'dropoffLatitude': historyrec.trip_endLoc_lat.toFixed(8),
                        'dropoffLongitude': historyrec.trip_endLoc_lng.toFixed(8)
                    };
                    fetchPost('/api/reservation/recommend', submitParams, submitInfoCallback);
                } else {
                    submitInfoCallback(historyrec.recommendation_obj)
                }
                
            }
        }
        fetchGet('/api/reservation/history_record', params, informationCallback) 
    };

    return (<div>
        { 
        props.operation === 'modify'  &&
            <div>
                <Button color="primary" variant="outlined" onClick={handleModifyShow}>
                    Modify
                </Button>
                <Modal
                    show={modifyModalShow}
                    onHide={handleModifyClose}
                    onShow={getModifyOptions}
                    centered
                >
                    <Modal.Body>
                        <Form>
                            <Form.Row>
                                <Form.Label>Modify your reservation: </Form.Label>
                                <br/><br/>
                            </Form.Row>

                            <Form.Row>
                                <TextField
                                    margin="normal"
                                    name="passengers"
                                    variant="outlined"
                                    label="Number of Passengers"
                                    placeholder="Enter A Number"
                                    min="1"
                                    max="10"
                                    required
                                    defaultValue={props.passengers}
                                    onChange={(event => setPassengers(event.target.value))}
                                    sx = {{mr: 2}}
                                />
                                <TextField
                                    margin="normal"
                                    variant="outlined"
                                    id="date_time"
                                    name="date_time"
                                    label="Pickup Time"
                                    type="datetime-local"
                                    required
                                    min={ formatDate(new Date().toLocaleString()) + "T" + new Date().toTimeString().slice(0, 5) }
                                    onChange={(event => setDateTime(event.target.value))}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    sx={{mb:3}}
                                />
                                <br/>
                            </Form.Row>

                        </Form>
                        <div>{modifyPrompt}</div>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button color="primary" onClick={handleModify}>
                            Submit
                        </Button>
                        <Button color="primary" onClick={handleModifyClose}>
                            Close
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        }
        {
           props.operation === 'rebook' &&    <div>
           <Modal
               show={actionModalShow}
               onHide={handleActionClose}
               centered
           >
               <Modal.Body>
                   {actionPrompt}
               </Modal.Body>
               <Modal.Footer>
                   <Button color="primary" onClick={handleActionClose}>
                       Close
                   </Button>
               </Modal.Footer>
           </Modal>

           <ConfirmModal
               show={confirmModalShow}
               handleClose={handleConfirmClose}
               prompt={confirmPrompt}
               action={handleRebook}
           />
           <Button color="primary" variant="outlined" onClick={handleRebookClick}>
               Rebook
           </Button>
       </div> 
        }            
        {
        props.operation === 'cancel' &&    <div>
                <Modal
                    show={actionModalShow}
                    onHide={handleActionClose}
                    centered
                >
                    <Modal.Body>
                        {actionPrompt}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button color="primary" onClick={handleActionClose}>
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
                <Button color="primary" variant="outlined" onClick={handleCancelClick}>
                    Cancel
                </Button>
            </div>
        }
        {
            props.operation === 'information' &&    <div>
            <Modal
                show={actionModalShow}
                onHide={handleActionClose}
                centered
            >
                <Modal.Body>
                    {actionPrompt}
                </Modal.Body>
                <Modal.Footer>
                    <Button color="primary" onClick={handleActionClose}>
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
            <Button color="primary" variant="outlined" onClick={handleInformationClick}>
                Information
            </Button>
        </div>

        }
    </div>
    )
};


export function ConfirmModal ( props ) {
    const handleProceed = () => {
        props.handleClose()
        setTimeout(props.action, 1000)
    };

    return (
        <div>
            <Modal
                show={props.show}
                onHide={props.handleClose}
                centered
            >
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
        </div>
    );
};


export function HistoryModal ( props ) {
    return 
        <div>
            <h1>Hello This is the model for the </h1>
        </div> 
};


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
};


const formatNum = (num) => {
    if (num < 10) {
        return "0" + num
    } else {
        return num.toString()
    }
};


const GetCurrentDate = () => {
    const date = new Date();
    return date.getMonth() + 1 + "/" + date.getDate() + "/" + date.getFullYear()
};


const RedirectHandeler = () => {
    const history = useCustomHistory();
    history.push('/ondemand')
};
