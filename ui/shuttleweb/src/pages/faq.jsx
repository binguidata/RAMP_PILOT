import React from 'react';
import { Container, Grid, Link, Typography } from '@material-ui/core';

import { Sidebar } from "../components/sidebar";
import '../styles/style.css';


export function FAQ() {
    const faqs = [
        {
            question: "What is RAMP?",
            answer: "RAMP is short for Rural Access Mobility Platform, a pilot program that tests the concept of on-demand shared mobility in rural areas."
        },
        {
            question: "Who is responsible for this project?",
            answer: "Carnegie Mellon University (CMU), in partnership with Blueprints, Waynesburg University, and Greene County Commission has conducted research and created this pilot transportation program to help improve transportation systems in rural areas.<br/>Blueprints, a Community Action Agency located in Washington and Greene Counties, is managing operations and logistics for the program."
        },
        {
            question: "Where are rides available?",
            answer: "Currently, we are only able to service a select territory in Greene County based upon access to reliable cell and internet coverage.<br/>There will be one van operating on a fixed route between designated stops in Waynesburg, PA, and Carmichaels, PA. In addition, eligible riders can request rides “on-demand” for pickup and drop-off at locations of their choosing utilizing our other two vans.<br/>There will also be routes to major shopping and transportation hubs in Washington, PA, and Morgantown, WV. Refer to the maps provided below for detailed information."
        },
        {
            question: "How do I request a ride?",
            answer: "Eligible Riders can visit <a href='https://ramp-pilot.com/'>RAMP-PILOT.com</a> and create an account (or login to their existing one!) to request a ride online. OR, you can call 724-780-RAMP (7267)"
        },
        {
            question: "How do I register to use RAMP?",
            answer: "To register for RAMP services, please visit this <a href='https://ramp-pilot.com/'>link</a> and complete the required information."
        },
        {
            question: "What are the hours of operation?",
            answer: "At present, we are offering this service Monday-Friday from 8:00 a.m. – 5:00 p.m."
        },
        {
            question: "Is this service handicap accessible?",
            answer: "Unfortunately, the vehicles provided do not have wheelchairs and other mobility access features. However, we welcome you to contact our dispatch center to discuss your needs and see if we can find a solution."
        },
        {
            question: "Are children permitted to use this service?",
            answer: "Children and youth under age 18 MUST be accompanied by a parent or legal guardian to use this service. Limited car seats will be available – should you require multiple please call our dispatch center so we can explore options for accommodations."
        },
        {
            question: "How do I know this service is safe?",
            answer: "Routes are restricted to areas with cell phone connectivity to ensure safety. In addition, all drivers must complete a background check and obtain proper clearances to ensure safety.<br/>In addition, all vans are marked clearly with RAMP logos so riders know they are entering the right vehicles."
        },
        {
            question: "Is there a fee for this service?",
            answer: "Technically, there is no fee for the rides as this is a pilot program. However, that does not mean the program is free. There is a cost associated with operating, and if this program is successful, the long-term solution will likely require some type of payment to be sustainable.<br/>Riders are encouraged to donate $1 to Blueprints to help support their efforts and programs in Greene County."
        },
    ];

    return (
        <Container maxWidth="xl">
            <Sidebar username={localStorage.getItem('username')} />
            <Grid container spacing={2} className="faq-grid">
                <Grid item xs={12} sm={12} md={12} lg={12}>
                    <br/>
                    <Typography
                        component="h1"
                        variant="h4"
                        align="center"
                        color="text.primary"
                        gutterBottom
                    >
                        Frequently Asked Questions
                    </Typography>
                </Grid>
                <Container maxWidth="lg">
                    {faqs.map((faq, index) => (
                        <Grid item xs={12} sm={12} md={12} lg={12} key={index}>
                            <Typography variant="h5" component="h4" gutterBottom>
                                {faq.question}
                            </Typography>
                            <Typography variant="body1" component="p" gutterBottom dangerouslySetInnerHTML={{ __html: faq.answer }} />
                        </Grid>
                    ))}
                    <Grid item xs={12} sm={12} md={12} lg={12}>
                        <Typography variant="h5" component="h4" gutterBottom>
                            You can access the consent form by downloading it through the following link: 
                            <br/>
                            <Link href="/cmu-irb-paper-consent 2.0.pdf" download>
                                <Typography variant="body1">
                                    Download Consent Form
                                </Typography>
                            </Link>
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={12} md={12} lg={12} style={{ textAlign: 'center', marginTop: '20px' }}>
                        <Typography variant="h5" component="h4" gutterBottom>
                            Service Area
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={12} md={12} lg={12} style={{ textAlign: 'center' }}>
                        <img src="/Service_Areas.png" alt="Service Area" style={{ maxWidth: '100%', height: 'auto' }} />
                    </Grid>
                </Container>
            </Grid>
        </Container>
    );
}


export default FAQ;
