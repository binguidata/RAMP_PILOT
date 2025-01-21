import React from 'react';
import { Box, Card, CardActionArea, CardContent, Container, Grid, Link, Typography } from "@material-ui/core";

import { Sidebar } from "../components/sidebar";
import "../styles/style.css";


export function SupportPage() {

    return (
        <Container maxWidth="xl">
            <Sidebar username={localStorage.getItem('username')} />
            <Grid container spacing={2} className="support-grid">
                <Grid item xs={12} sm={12} md={12} lg={12}>
                    <br/>
                    <Typography
                        component="h1"
                        variant="h4"
                        align="center"
                        color="text.primary"
                        gutterBottom
                    >
                        Support
                    </Typography>
                </Grid>
                <Grid item xs={12} sm={12} md={12} lg={12} style={{ textAlign: 'center' }}>
                    <Link href="https://mac.heinz.cmu.edu/" target="_blank" align="right" rel="noreferrer">
                        <img src="/mac_logo_nobackground.png" alt="Service Area" style={{ maxWidth: '100%', height: 'auto' }} />
                    </Link>
                </Grid>
                <Grid item xs={12} sm={12} md={12} lg={12} style={{ textAlign: 'center' }}>
                    <CardActionArea component="a" href='mailto:seanqian@cmu.edu' target="_blank" rel="noreferrer">
                        <Box sx={{ maxWidth: 400, mx: 'auto' }} >
                            <Card sx={{ display: 'flex', textAlign: 'left' }} >
                                <CardContent sx={{ flex: 1 }}>
                                    <Typography component="h2" variant="h5">
                                        Sean Qian
                                    </Typography>
                                    <br/>
                                    <Typography variant="body2" paragraph>
                                        Hamburg Hall 3044, Carnegie Mellon University<br/>
                                        4800 Forbes Ave, Pittsburgh, PA 15213
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>
                    </CardActionArea>
                </Grid>
                <Grid item xs={12} sm={12} md={12} lg={12} style={{ textAlign: 'center' }}>
                    <CardActionArea component="a" href='mailto:bingui@andrew.cmu.edu' target="_blank" rel="noreferrer">
                        <Box sx={{ maxWidth: 400, mx: 'auto' }} >
                            <Card sx={{ display: 'flex' }} >
                                <CardContent sx={{ flex: 1 }}>
                                    <Typography component="h2" variant="h5">
                                        Bin Gui
                                    </Typography>
                                    <br/>
                                    <Typography variant="body2" paragraph>
                                        Carnegie Mellon University<br/>
                                        5000 Forbes Ave, Pittsburgh, PA 15213
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>
                    </CardActionArea>
                </Grid>
            </Grid>
        </Container>
    );
}


export default SupportPage;
