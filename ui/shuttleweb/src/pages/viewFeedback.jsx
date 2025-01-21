import React, { useState, useEffect } from 'react';
import { Grid, Container, Typography } from '@material-ui/core';

import { fetchGet } from './request';
import { Sidebar } from "../components/sidebar";
import '../styles/style.css';


function ViewFeedback() {
    const [feedbackList, setFeedbackList] = useState([]);

    useEffect(() => {
        fetchFeedback();
    }, []);

    const fetchFeedback = () => {
        const endpoint = '/api/feedback/view';
        const params = {};
        const handleData = (data) => {
            setFeedbackList(data);
        };
        fetchGet(endpoint, params, handleData);
    };

     const formatDateTime = (datetime) => {
        return new Date(datetime).toLocaleString();
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
                        Feedback List
                    </Typography>
                </Grid>
                <Container maxWidth="xl">
                    <Grid item xs={12} sm={12} md={12} lg={12}>
                        <div className="feedback-blocks">
                            {feedbackList.map(feedback => (
                                <div key={feedback.id} className="feedback-block">
                                    <div><strong>Name:</strong> {feedback.name}</div>
                                    <div><strong>Cellphone Number:</strong> {feedback.cellphone_number}</div>
                                    <div><strong>Email:</strong> {feedback.email}</div>
                                    <div><strong>Feedback:</strong> {feedback.feedback_text}</div>
                                    <div><strong>Created At:</strong> {formatDateTime(feedback.created_at)}</div>
                                </div>
                            ))}
                        </div>
                    </Grid>
                </Container>
            </Grid>
        </Container>
    );
}


export default ViewFeedback;
