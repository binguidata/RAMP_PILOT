import React, { useState, useEffect } from 'react';
import { Box, Button, Container, Snackbar, TextField, Typography, MenuItem, Select, FormControl, InputLabel } from '@material-ui/core';
import { Alert } from "@mui/material";
import { fetchPost } from "./request";
import { Sidebar } from "../components/sidebar";
import "../styles/style.css";

export function AllocateCoupanPage() {
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [value, setValue] = useState('');
    const [open, setOpen] = useState(false);
    const [severity, setSeverity] = useState('success');
    const [message, setMessage] = useState('');

    const redeemCallback = (data) => {
        setCustomers(data);
    }

    useEffect(() => {
        // Fetch customers from the API
        fetchPost('/api/payment/customers/', {}, redeemCallback);
    }, []);

    const generateCouponCallback = (data) => {
        if ('error' in data) {
            setSeverity("warning");
            setMessage(data['error']);
            setOpen(true);
        } else if ('msg' in data) {
            setSeverity("success");
            setMessage(data['msg']);
            setOpen(true);
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();

        const couponParam = {
            'value': value,
            'customer_id': selectedCustomer
        }

        fetchPost("/api/payment/allocate_coupon", couponParam, generateCouponCallback)
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <Container maxWidth="xl">
            <Sidebar username={localStorage.getItem("username")}/>
            <br/>
            <Typography
                component="h1"
                variant="h4"
                align="center"
                color="primary"
                gutterBottom
            >
                Allocate Coupons
            </Typography>
            <Container component="main" maxWidth="xs">
                <Box
                    sx={{
                        marginTop: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <Box component="form" onSubmit={handleFormSubmit} sx={{ mt: 1 }}>
                        <FormControl fullWidth margin="normal">
                            <InputLabel id="customer-label">Select Customer</InputLabel>
                            <Select
                                labelId="customer-label"
                                id="customer"
                                value={selectedCustomer}
                                onChange={event => setSelectedCustomer(event.target.value)}
                            >
                                {customers.map(customer => (
                                    <MenuItem key={customer.id} value={customer.id}>
                                        {customer.first_name} - {customer.last_name} - ({customer.tel})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Coupon Value"
                            variant="outlined"
                            placeholder='Coupon Value'
                            onChange={event => setValue(event.target.value)}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            color='primary'
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                        >
                            Generate
                        </Button>
                    </Box>
                </Box>
                <Snackbar open={open} autoHideDuration={20000} onClose={handleClose}>
                    <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }}>
                        {message}
                    </Alert>
                </Snackbar>
            </Container>
        </Container>
    );
}
