import React, { useState, useEffect } from 'react';
import { 
    Container, Grid, Paper, 
    Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography
} from "@material-ui/core";

import { fetchGet } from './request';
import { Sidebar } from "../components/sidebar";
import "../styles/style.css";


function ViewCustomers() {
    const [customers, setCustomers] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchGet('/api/view_customers', {}, (data) => {
            setCustomers(data);
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

    const filteredCustomers = customers.filter((customer) => {
        const { username, first_name, last_name, email, tel } = customer;
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
                        Registered Customers
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
                                        <TableCell align="center"><strong>Balance</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredCustomers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((customer, index) => (
                                        <TableRow key={'customer' + index}>
                                            <TableCell align="center">{customer.username}</TableCell>
                                            <TableCell align="center">{customer.first_name} {customer.last_name}</TableCell>
                                            <TableCell align="center">{customer.email}</TableCell>
                                            <TableCell align="center">{customer.tel}</TableCell>
                                            <TableCell align="center">{customer.balance}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 20]}
                            component="div"
                            count={filteredCustomers.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
}


export default ViewCustomers;
