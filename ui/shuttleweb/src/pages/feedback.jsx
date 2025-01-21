import React, { useState } from 'react';
import { 
    Button, Container, Dialog, DialogTitle, DialogActions, Grid, TextField, Typography 
} from '@material-ui/core';

import { fetchPost } from './request';
import { Sidebar } from "../components/sidebar";
import '../styles/style.css';


const FeedbackForm = () => {
    const [name, setName] = useState('');
    const [cellphoneNumber, setCellphoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [feedbackText, setFeedbackText] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [showThankYouCard, setShowThankYouCard] = useState(false);
    const [feedbackTextError, setFeedbackTextError] = useState('');
    const [cellphoneError, setCellphoneError] = useState('');

    const handleSubmit = (event) => {
        event.preventDefault();
        if (cellphoneNumber && !isValidCellphone(cellphoneNumber)) {
            setCellphoneError('Please enter a valid 10-digit cellphone number');
            return;
        }
        if (!feedbackText) {
            setFeedbackTextError("Please enter your feedback");
            return;
        }
        const feedbackData = {
            name: name,
            cellphone_number: cellphoneNumber,
            email: email,
            feedback_text: feedbackText,
        };
        fetchPost('/api/feedback/create/', feedbackData, (data) => {
            setSubmitted(true);
            setShowThankYouCard(true);
            setName('');
            setCellphoneNumber('');
            setEmail('');
            setFeedbackText('');
            setCellphoneError('');
            setFeedbackTextError('');
        });
    };

    const isValidCellphone = (cellphoneNumber) => {
        const regex = /^\d{10}$/;
        return regex.test(cellphoneNumber);
    };

    const handleExitThankYouCard = () => {
        setShowThankYouCard(false);
    };
    
    return (
        <Container maxWidth="xl">
            <Sidebar username={localStorage.getItem('username')} />
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
                        Feedback
                    </Typography>
                </Grid>
                <Container maxWidth="lg">
                    <Grid item xs={12} sm={12} md={12} lg={12}>
                        <form onSubmit={handleSubmit}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={12} md={12} lg={12}>
                                    <TextField
                                        label="Name"
                                        value={name}
                                        onChange={(event) => setName(event.target.value)}
                                        variant="outlined"
                                        fullWidth
                                    />
                                </Grid>
                                <Grid item xs={12} sm={12} md={12} lg={12}>
                                    <TextField
                                        label="Phone Number"
                                        value={cellphoneNumber}
                                        onChange={(event) => setCellphoneNumber(event.target.value)}
                                        variant="outlined"
                                        fullWidth
                                        error={cellphoneError}
                                        helperText={cellphoneError}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={12} md={12} lg={12}>
                                    <TextField
                                        label="Email"
                                        value={email}
                                        onChange={(event) => setEmail(event.target.value)}
                                        variant="outlined"
                                        fullWidth
                                    />
                                </Grid>
                                <Grid item xs={12} sm={12} md={12} lg={12}>
                                    <TextField
                                        label="Feedback"
                                        value={feedbackText}
                                        onChange={(event) => setFeedbackText(event.target.value)}
                                        variant="outlined"
                                        fullWidth
                                        multiline
                                        rows={4}
                                        error={feedbackTextError}
                                        helperText={feedbackTextError}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={12} md={12} lg={12}>
                                    <Button
                                        fullWidth
                                        color="primary"
                                        type="submit"
                                        variant="contained"
                                        sx={{ mt: 1, mb: 2 }}
                                    >
                                        Submit Feedback
                                    </Button>
                                </Grid>
                            </Grid>
                        </form>
                    </Grid>
                </Container>
                {showThankYouCard && (
                    <Dialog open={showThankYouCard} onClose={handleExitThankYouCard}>
                        <DialogTitle>Thank you for your feedback!</DialogTitle>
                        <DialogActions>
                            <Button onClick={handleExitThankYouCard}>OK</Button>
                        </DialogActions>
                    </Dialog>
                )}
            </Grid>
        </Container>
    );
};


export default FeedbackForm;
