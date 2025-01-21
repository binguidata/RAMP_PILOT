import React from 'react';
import { Container } from '@material-ui/core';
import { Box, Button, Grid, MenuItem, TextField, Typography } from '@mui/material';

import {Sidebar} from "../components/sidebar";
import "../styles/style.css";


export function VolunteerPage() {
    const [activeStep, setActiveStep] = React.useState(0);

    const handleNext = () => {
        setActiveStep(activeStep + 1);
    };

    const handleBack = () => {
        setActiveStep(activeStep - 1);
    };

    const capacities = [
        {
            value: '1',
            label: '1',
        },
        {
            value: '2',
            label: '2',
        },
        {
            value: '3',
            label: '3',
        },
        {
            value: '4',
            label: '4',
        },
        {
            value: '5',
            label: '5',
        },
        {
            value: '6',
            label: '6',
        },
    ];

    const areas = [
        {
            value: 'greene',
            label: 'greene',
        },
        {
            value: 'morgantown',
            label: 'morgantown',
        },
        {
            value: 'washington',
            label: 'washington',
        },
    ];

    return (
        <Container maxWidth="xl">
            <Sidebar username={localStorage.getItem("username")}/>
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
                        Add Volunteer Drivers
                    </Typography>
                </Grid>
                <Grid item xs={12} sm={12} md={12} lg={12}>
                    <Container component="main" maxWidth="sm" sx={{ mb: 4 }}>
                        {activeStep === 0 ? (
                            <React.Fragment>
                                <Box sx={{ my: { xs: 3, md: 0 }, p: { xs: 2, md: 3 } }}>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                required
                                                id="firstName"
                                                name="firstName"
                                                label="First name"
                                                fullWidth
                                                autoComplete="given-name"
                                                variant="standard"
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                required
                                                id="lastName"
                                                name="lastName"
                                                label="Last name"
                                                fullWidth
                                                autoComplete="family-name"
                                                variant="standard"
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                required
                                                select
                                                id="serviceArea"
                                                name="serviceArea"
                                                label="Service Area"
                                                fullWidth
                                                variant="standard"
                                            >
                                                {areas.map((option) => (
                                                    <MenuItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                margin="normal"
                                                fullWidth
                                                variant="outlined"
                                                id="checkin_time"
                                                name="checkin_time"
                                                label="Checkin Time"
                                                type="datetime-local"
                                                required
                                                min={ formatDate(new Date().toLocaleString()) + "T" + new Date().toTimeString().slice(0, 5) }
                                                InputLabelProps={{
                                                    shrink: true,
                                                }}
                                                sx={{mb:0}}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                margin="normal"
                                                fullWidth
                                                variant="outlined"
                                                id="checkout_time"
                                                name="checkout_time"
                                                label="Checkout Time"
                                                type="datetime-local"
                                                required
                                                min={ formatDate(new Date().toLocaleString()) + "T" + new Date().toTimeString().slice(0, 5) }
                                                InputLabelProps={{
                                                    shrink: true,
                                                }}
                                                sx={{mb:0}}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                required
                                                id="vehicle type"
                                                name="vehicle type"
                                                label="Vehicle Type"
                                                fullWidth
                                                variant="standard"
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                required
                                                id="plate number"
                                                name="plate number"
                                                label="Plate Number"
                                                fullWidth
                                                variant="standard"
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                required
                                                id="phone"
                                                name="phone"
                                                label="Phone Number"
                                                fullWidth
                                                variant="standard"
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                required
                                                select
                                                id="capacity"
                                                name="capacity"
                                                label="Capacity"
                                                fullWidth
                                                variant="standard"
                                            >
                                                {capacities.map((option) => (
                                                    <MenuItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        </Grid>
                                    </Grid>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        variant="contained"
                                        sx={{ mt: 3, ml: 1 }}
                                        onClick={handleNext}
                                    >
                                        Submit
                                    </Button>
                                </Box>
                            </React.Fragment>
                        ) : (
                            <React.Fragment>
                                <Box sx={{ my: { xs: 3, md: 0 }, p: { xs: 2, md: 3 } }}>
                                    <Typography variant="h5" gutterBottom>
                                    Thank you for your volunteering.
                                    </Typography>
                                    <Typography variant="subtitle1">
                                    Your information has been recorded to our database. We will assign orders to you soon.
                                    </Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button
                                            variant="contained"
                                            sx={{ mt: 3, ml: 1 }}
                                            onClick={handleBack}
                                        >
                                            Back
                                        </Button>
                                    </Box>
                                </Box>
                            </React.Fragment>
                        )}
                    </Container>
                </Grid>
            </Grid>
        </Container>
    );
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
