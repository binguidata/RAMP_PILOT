import React from 'react';
import { Container, Grid, Typography } from '@material-ui/core';

import { Sidebar } from "../components/sidebar";
import '../styles/style.css';


export function BusSchedule() {
    return (
        <Container maxWidth="xl">
            <Sidebar username={localStorage.getItem('username')} />
            <br/>
            <Grid container spacing={2} className="bus-schedule-grid">
                <Grid item xs={12} sm={12} md={12} lg={12}>
                    <Typography
                        component="h1"
                        variant="h4"
                        align="center"
                        color="text.primary"
                        gutterBottom
                    >
                        Waynesburg-Carmichaels Fixed Route
                    </Typography>
                </Grid>
                <Grid item xs={12} sm={12} md={12} lg={12}>
                    <div className='home-text'>
                        <Typography variant="body1" component="p" gutterBottom>
                            Waynesburg-Carmichaels Fixed Route serves as a connector between Waynesburg and Carmichaels within Greene County.
                        </Typography>
                        <Typography variant="body1" component="p" gutterBottom>
                            Afternoon times are shown in <b>BOLD</b>.
                        </Typography>
                    </div>
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
            </Grid>
        </Container>
    );
}


export default BusSchedule;
