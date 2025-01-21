import React, { useEffect, useState } from "react";
import { 
    Button, Card, CardActionArea, CardContent, Container, 
    Dialog, DialogActions, DialogContent, DialogTitle, Grid, makeStyles, Paper, 
    Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, 
    TextField, Typography
} from "@material-ui/core";

import { fetchGet, fetchPost } from "./request";
import { Sidebar } from "../components/sidebar";
import "../styles/style.css";


const initialFormData = {
    vehicleMaker: '',
    vehicleModel: '',
    vehicleColor: '',
    vehiclePlateNumber: '',
    capacity: '',
    startTime: '',
    endTime: ''
};


const useStyles = makeStyles((theme) => ({
    greenBackground: {
        backgroundColor: 'green',
    },
    redBackground: {
        backgroundColor: 'red',
    },
}));


function ResultGridItem(props) {
    return (
        <Grid item xs={12}>
            <CardActionArea component="a" {...props}>
                <Card style={{ backgroundColor: props.color }} sx={{ display: 'flex' }}>
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
}


export function ShuttleManagementPage() {

    const [didUpdate, setDidUpdate] = useState(false);
    const [shuttlesList, setShuttlesList] = useState([]);
    const [shuttlesAvailList, setShuttlesAvailList] = useState([]);
    const [shuttlesInServList, setShuttlesInServList] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [auth, setAuth] = useState(-1);
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState(initialFormData);
    const [deallocateDialogOpen, setDeallocateDialogOpen] = useState(false);
    const [selectedShuttle, setSelectedShuttle] = useState(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editableShuttle, setEditableShuttle] = useState(initialFormData);

    const classes = useStyles();

    const shuttleHandle = () => {
        setDidUpdate(false)
    }

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    // process the reservation records acquired from the backend
    const shuttlesCallback = (data) => {
        let shuttlesList = []
        let newShuttlesAvailList = [];
        let newShuttlesInServList = [];
        setShuttlesList(shuttlesList)
        for (let i = 0; i < data.length; i++) {
            let record = {}
            record["id"] = data[i]["id"]
            record["Name"] = data[i]["name"]
            record["ServiceArea"] = data[i]["serviceArea"]
            record["Allocated"] = data[i]["allocated"]
            record["Platenumber"] = data[i]["platenumber"]
            record["Shuttle_id_virtual"] = data[i]["shuttle_id_virtual"]
            record["Capacity"] = data[i]["capacity"]
            record["Depot_id"] = data[i]["depot_id"]
            record["Depot_lookup_id"] = data[i]["depot_lookup_id"]
            record["Starttime"] = data[i]["starttime"]
            record["Endtime"] = data[i]["endtime"]
            record["Inservice"] = data[i]["inservice"]
            record["color"]=data[i]["color"]
            record["model"]=data[i]["model"]
            record["make"]=data[i]["make"]

            shuttlesList.push(record)

            if (record.Inservice === false) {
                newShuttlesAvailList.push(record);
            } else {
                newShuttlesInServList.push(record);
            }
        }

        setShuttlesList(shuttlesList)
        setShuttlesAvailList(newShuttlesAvailList);
        setShuttlesInServList(newShuttlesInServList);
        setDidUpdate(true)
    }

    useEffect(() => {
        if (didUpdate) {
            return
        }
        fetchGet('/api/reservation/getShuttleAll', {}, shuttlesCallback);
        setAuth(localStorage.getItem("auth"));
    }, [didUpdate])

    const handleEdit = (shuttle) => {
        setEditableShuttle({
            id: shuttle.id,
            name: shuttle.Name,
            make: shuttle.make,
            model: shuttle.model,
            color: shuttle.color,
            Platenumber: shuttle.Platenumber,
            capacity: shuttle.Capacity
        });
        setEditDialogOpen(true);
    };
    const handleUpdateShuttle = () => {
        const uploadParams = { ...editableShuttle };
        fetchPost("/api/reservation/setShuttlebyId", uploadParams, updateCallback);  
    };
    
    const updateCallback = (data) => {
        setEditDialogOpen(false);
        setDidUpdate(false);
    }; 

    const handleDeallocate = (item) => {
        setSelectedShuttle(item);
        setDeallocateDialogOpen(true);
    };
    
    const handleConfirmDeallocate = () => {
        if (selectedShuttle) {
        const uploadParams = {
            id: selectedShuttle.id,
            allocated : false,
        }
        fetchPost("/api/reservation/setShuttleAvailability", uploadParams, callBackHandlerDe);
        } else {
            alert("Error in deallocating the shuttle")
            setDeallocateDialogOpen(false);
        }
    };

    const callBackHandlerDe = (data)=>{
        setDidUpdate(false)
        handleCloseDeallocateDialog();
    };

    const handleCloseDeallocateDialog = () => {
        setDeallocateDialogOpen(false);
    };

    return (
        <Container maxWidth="xl">
            <Sidebar username={localStorage.getItem("username")} />
            <Grid container spacing={2} className="feedback-grid">
                <Grid item xs={12} sm={12} md={12} lg={12}>
                    <br/>
                    <Typography
                        component="h1"
                        variant="h4"
                        align="center"
                        color="text.primary"
                        gutterBottom
                    >
                        On-demand Vans
                    </Typography>
                </Grid>

                <Grid item xs={12} sm={12} md={12} lg={12}>
                    <Paper >
                        <TableContainer className="ride-tableContainer">
                            <Table stickyHeader aria-label="sticky table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell align="center"><strong>Name</strong></TableCell>
                                        <TableCell align="center"><strong>Allocated</strong></TableCell>
                                        <TableCell align="center"><strong>Plate Number</strong></TableCell>
                                        <TableCell align="center"><strong>Capacity</strong></TableCell>
                                        <TableCell align="center"><strong>Start Time</strong></TableCell>
                                        <TableCell align="center"><strong>End Time</strong></TableCell>
                                        <TableCell align="center"><strong>Edit</strong></TableCell>
                                        <TableCell align="center"><strong>Deallocate</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {shuttlesAvailList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item, index) => (
                                        <TableRow key={'avail' + index}>
                                            <TableCell align="center">{item.Name}</TableCell>
                                            <TableCell
                                                align="center"
                                                className={item.Allocated ? classes.greenBackground : classes.redBackground}
                                            >
                                                {item.Allocated ? "Yes" : "No"}
                                            </TableCell>
                                            <TableCell align="center">{item.Platenumber}</TableCell>
                                            <TableCell align="center">{item.Capacity}</TableCell>
                                            <TableCell align="center">{item.Starttime}</TableCell>
                                            <TableCell align="center">{item.Endtime}</TableCell>
                                            <TableCell align="center">
                                                <Button 
                                                    color='primary'
                                                    variant="contained" 
                                                    onClick={() => handleEdit(item)}
                                                >
                                                    Edit
                                                </Button>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Button 
                                                    color='secondary'
                                                    variant="contained" 
                                                    onClick={() => handleDeallocate(item)}
                                                >
                                                    Deallocate
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 20]}
                            component="div"
                            count={shuttlesAvailList.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={12} md={12} lg={12}>
                    <div className='home-text'>
                        <Typography variant="body1" component="p" gutterBottom>
                            The <b>DEALLOCATE</b> function is to be utilized exclusively in the event of a malfunction with the driver's iPad. 
                            This occurs when the driver is unable to log out of the iPad, 
                            thereby preventing the vehicle from being released from the allocated status.
                        </Typography>
                    </div>
                </Grid>
            </Grid>

            <Dialog open={deallocateDialogOpen} onClose={handleCloseDeallocateDialog}>
                <DialogTitle>Confirm Deallocation</DialogTitle>
                <DialogContent>
                    Are you sure you want to deallocate the selected vehicle?
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeallocateDialog}>Cancel</Button>
                    <Button onClick={handleConfirmDeallocate} color="error">Proceed</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
                <DialogTitle>Edit {editableShuttle.name}</DialogTitle>
                <DialogContent>
                    <form>
                        <TextField
                            margin="dense"
                            label="Maker"
                            type="text"
                            fullWidth
                            variant="outlined"
                            value={editableShuttle.make}
                            onChange={e => setEditableShuttle({...editableShuttle, make: e.target.value})}
                        />
                        <TextField
                            margin="dense"
                            label="Model"
                            type="text"
                            fullWidth
                            variant="outlined"
                            value={editableShuttle.model}
                            onChange={e => setEditableShuttle({...editableShuttle, model: e.target.value})}
                        />
                        <TextField
                            margin="dense"
                            label="Color"
                            type="text"
                            fullWidth
                            variant="outlined"
                            value={editableShuttle.color}
                            onChange={e => setEditableShuttle({...editableShuttle, color: e.target.value})}
                        />
                        <TextField
                            margin="dense"
                            label="Plate Number"
                            type="text"
                            fullWidth
                            variant="outlined"
                            value={editableShuttle.Platenumber}
                            onChange={e => setEditableShuttle({...editableShuttle, Platenumber: e.target.value})}
                        />
                        <TextField
                            margin="dense"
                            label="Capacity"
                            type="number"
                            fullWidth
                            variant="outlined"
                            value={editableShuttle.capacity}
                            onChange={e => setEditableShuttle({...editableShuttle, capacity: e.target.value})}
                        />
                    </form>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleUpdateShuttle} color="primary">Update</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
