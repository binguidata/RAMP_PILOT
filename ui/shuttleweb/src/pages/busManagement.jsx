import React, { useEffect, useState } from "react";
import { 
    Button, Container, Dialog, DialogActions, DialogContent, DialogTitle, Grid, makeStyles, Paper, 
    Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography
} from "@material-ui/core";

import { fetchGet, fetchPut } from "./request";
import { Sidebar } from "../components/sidebar";
import "../styles/style.css";


const initialFormData = {
    vehicleMake: '',
    vehicleModel: '',
    vehicleColor: '',
    vehiclePlateNumber: '',
    capacity: '',
};


const useStyles = makeStyles((theme) => ({
    greenBackground: {
        backgroundColor: 'green',
    },
    redBackground: {
        backgroundColor: 'red',
    },
}));


export function BusManagementPage() {

    const [didUpdate, setDidUpdate] = useState(false);
    const [busesList, setbusesList] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [auth, setAuth] = useState(-1);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editableBus, setEditableBus] = useState(initialFormData);

    const classes = useStyles();

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    const busesCallback = (data) => {
        let busesList = []
        for (let i = 0; i < data.length; i++) {
            let record = {}
            record["id"] = data[i]["id"]
            record["name"] = data[i]["name"]
            record["allocated"] = data[i]["allocated"]
            record["platenumber"] = data[i]["platenumber"]
            record["capacity"] = data[i]["capacity"]
            record["color"]=data[i]["color"]
            record["model"]=data[i]["model"]
            record["make"]=data[i]["make"]

            busesList.push(record)
        }
        setbusesList(busesList)
        setDidUpdate(true)
    };

    useEffect(() => {
        if (didUpdate) {
            return
        }
        fetchGet('/api/bus/viewAll/', {}, busesCallback);
        setAuth(localStorage.getItem("auth"));
    }, [didUpdate]);

    const handleEdit = (bus) => {
        setEditableBus({
            id: bus.id,
            name: bus.name,
            make: bus.make,
            model: bus.model,
            color: bus.color,
            platenumber: bus.platenumber,
            capacity: bus.capacity
        });
        setEditDialogOpen(true);
    };

    const handleUpdateBus = () => {
        const uploadParams = { ...editableBus };
        fetchPut('/api/bus/' + editableBus.id + '/update/', uploadParams, updateCallback);
    };

    const updateCallback = (data) => {
        setEditDialogOpen(false);
        setDidUpdate(false);
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
                        Waynesburg - Carmichaels Fixed-Route Shuttles
                    </Typography>
                </Grid>

                <Grid item xs={12} sm={12} md={12} lg={12}>
                    <Paper >
                        <TableContainer className="ride-tableContainer">
                            <Table stickyHeader aria-label="sticky table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell align="center"><strong>Name</strong></TableCell>
                                        <TableCell align="center"><strong>Plate Number</strong></TableCell>
                                        <TableCell align="center"><strong>Capacity</strong></TableCell>
                                        <TableCell align="center"><strong>Edit</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {busesList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item, index) => (
                                        <TableRow key={'avail' + index}>
                                            <TableCell align="center">{item.name}</TableCell>
                                            <TableCell align="center">{item.platenumber}</TableCell>
                                            <TableCell align="center">{item.capacity}</TableCell>
                                            <TableCell align="center">
                                                <Button 
                                                    variant="contained" 
                                                    color="primary"
                                                    onClick={() => handleEdit(item)}
                                                >
                                                    Edit
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
                            count={busesList.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={12} md={12} lg={12}>
                    <a className='home-image'>
                        <img
                        alt="Service Area"
                        src="/Greene_Fixed_Route_Schedule_rev5.png"
                        width={'100%'}
                        />
                    </a>
                </Grid>
                <Grid item xs={12} sm={12} md={12} lg={12}>
                    <div className='home-text'>
                        <Typography variant="body1" component="p" gutterBottom>
                            Afternoon times are shown in <b>BOLD</b>.
                        </Typography>
                    </div>
                </Grid>
            </Grid>
            <br/><br/><br/>

            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
                <DialogTitle>Edit {editableBus.name}</DialogTitle>
                <DialogContent>
                    <form>
                        <TextField
                            margin="dense"
                            label="Make"
                            type="text"
                            fullWidth
                            variant="outlined"
                            value={editableBus.make}
                            onChange={e => setEditableBus({...editableBus, make: e.target.value})}
                        />
                        <TextField
                            margin="dense"
                            label="Model"
                            type="text"
                            fullWidth
                            variant="outlined"
                            value={editableBus.model}
                            onChange={e => setEditableBus({...editableBus, model: e.target.value})}
                        />
                        <TextField
                            margin="dense"
                            label="Color"
                            type="text"
                            fullWidth
                            variant="outlined"
                            value={editableBus.color}
                            onChange={e => setEditableBus({...editableBus, color: e.target.value})}
                        />
                        <TextField
                            margin="dense"
                            label="Plate Number"
                            type="text"
                            fullWidth
                            variant="outlined"
                            value={editableBus.platenumber}
                            onChange={e => setEditableBus({...editableBus, platenumber: e.target.value})}
                        />
                        <TextField
                            margin="dense"
                            label="capacity"
                            type="number"
                            fullWidth
                            variant="outlined"
                            value={editableBus.capacity}
                            onChange={e => setEditableBus({...editableBus, capacity: e.target.value})}
                        />
                    </form>
                </DialogContent>
                <DialogActions>
                    <Button variant="contained" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleUpdateBus} color="primary">Update</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
