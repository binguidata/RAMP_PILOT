import React, { useState, useEffect } from 'react';
import { 
    Container, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, 
    Grid, MenuItem, Paper, Select,
    Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography 
} from "@material-ui/core";

import { fetchGet, fetchPost } from './request';
import { Sidebar } from "../components/sidebar";
import "../styles/style.css";


function ViewDrivers() {
    const [drivers, setDrivers] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [open, setOpen] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [newRole, setNewRole] = useState('');

    useEffect(() => {
        fetchGet('/api/view_drivers', {}, (data) => {
            setDrivers(data);
        });
    }, []);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleSearch = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleOpen = (driver) => {
        setOpen(true);
        setSelectedDriver(driver);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleRoleChange = (event) => {
        setNewRole(event.target.value);
    };

    const handleConfirm = () => {
        const params = {
            username: selectedDriver.username,
            new_role: newRole
        };
        fetchPost('/api/modify_driver_role', params, (data) => {
            if (data.msg === 'Role modified successfully') {
                const updatedDrivers = drivers.map((driver) => {
                    if (driver.username === selectedDriver.username) {
                        driver.role = newRole;
                    }
                    return driver;
                });
                setDrivers(updatedDrivers);
                setOpen(false);
                window.location.reload();
            } else {
                console.error('Error modifying driver role:', data);
            }
        });
    };

    const filteredDrivers = drivers.filter((driver) => {
        const { username, first_name, last_name, email, tel } = driver;
        const search = searchTerm.toLowerCase();
        return (
            username.toLowerCase().includes(search) ||
            first_name.toLowerCase().includes(search) ||
            last_name.toLowerCase().includes(search) ||
            email.toLowerCase().includes(search) ||
            tel.toLowerCase().includes(search)
        );
    });  

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
                        Registered Drivers
                    </Typography>
                </Grid>

                <Grid item xs={12} sm={12} md={12} lg={12} style={{ textAlign: 'right' }}>
                <TextField
                    variant="outlined"
                    margin="normal"
                    required
                    fullWidth={false}
                    id="search"
                    label="Search"
                    name="search"
                    autoComplete="search"
                    autoFocus
                    value={searchTerm}
                    onChange={handleSearch}
                    style={{ maxWidth: 300 }}
                />
                </Grid>

                <Grid item xs={12} sm={12} md={12} lg={12}>
                    <Paper >
                        <TableContainer className="ride-tableContainer">
                            <Table stickyHeader aria-label="sticky table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell align="center"><strong>Username</strong></TableCell>
                                        <TableCell align="center"><strong>Name</strong></TableCell>
                                        <TableCell align="center"><strong>Email</strong></TableCell>
                                        <TableCell align="center"><strong>Cellphone</strong></TableCell>
                                        <TableCell align="center"><strong>Role</strong></TableCell>
                                        <TableCell align="center"><strong>Actions</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredDrivers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((driver, index) => (
                                        <TableRow key={'driver' + index} className={driver.role === 1 ? 'on-demand-row' : driver.role === 3 ? 'fixed-route-row' : ''}>
                                            <TableCell align="center">{driver.username}</TableCell>
                                            <TableCell align="center">{driver.first_name} {driver.last_name}</TableCell>
                                            <TableCell align="center">{driver.email}</TableCell>
                                            <TableCell align="center">{driver.tel}</TableCell>
                                            <TableCell align="center">
                                                {driver.role === 1 ? 'On-Demand Driver' : driver.role === 3 ? 'Fixed-Route Driver' : ''}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Button color="inherit" variant="contained" onClick={() => handleOpen(driver)}>Change Role</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 20]}
                            component="div"
                            count={filteredDrivers.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    </Paper>
                </Grid>
            </Grid>

            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Change Driver Role</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        <div>
                            {selectedDriver ? (
                                `Current Role: ${selectedDriver.role === 1 ? 'On-Demand Driver' : 'Fixed-Route Driver'}`
                            ) : (
                                'No driver selected'
                            )}
                        </div>
                        <div>
                            <span style={{ color: 'red' }}>
                                Warning: Do not change the role if the driver is currently logged in!
                            </span>
                        </div>
                    </DialogContentText>
                    <Select value={newRole} onChange={handleRoleChange}>
                        <MenuItem value="1">On-Demand Driver</MenuItem>
                        <MenuItem value="3">Fixed-Route Driver</MenuItem>
                    </Select>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleConfirm}>Confirm</Button>
                </DialogActions>
            </Dialog>

        </Container>
    );
}


export default ViewDrivers;
