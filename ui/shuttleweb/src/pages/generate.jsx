import React, {useState} from 'react';
import { Box, Button, Container, Snackbar, TextField, Typography } from '@material-ui/core';
import { Alert } from "@mui/material";

import { fetchPost } from "./request";
import { Sidebar } from "../components/sidebar";
import "../styles/style.css";


export function GenerateCouponPage() {
    const [phone, setPhone] = useState('')
    const [value, setValue] = useState('')
    const [open, setOpen] = useState(false)
    const [sever, setSever] = useState('')
    const [message, setMessage] = useState('')

    const generateCouponCallback = (data) => {
        if ('error' in data) {
            setSever("warning")
            setMessage(data['error'])
            setOpen(true)
        } else if ('msg' in data) {
            setSever("success")
            setMessage(data['msg'])
            setOpen(true)
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();

        const couponParam = {
            'value': value,
            'phone': phone
        }

        fetchPost("/api/payment/generate_coupon", couponParam, generateCouponCallback)
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
                color="text.primary"
                gutterBottom
            >
                Generate Coupons
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
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Phone Number"
                            autoFocus
                            variant="outlined"
                            placeholder='Phone Number'
                            onChange={event => setPhone(event.target.value)}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Coupon Value"
                            autoFocus
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
                    <Alert onClose={handleClose} severity={sever} sx={{ width: '100%' }}>
                        {message}
                    </Alert>
                </Snackbar>
            </Container>
        </Container>
    );
}
