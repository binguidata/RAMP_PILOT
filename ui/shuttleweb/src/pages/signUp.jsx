import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Box, Button, Container, Grid, Link, Snackbar, TextField, Typography } from "@material-ui/core";
import { Alert, Stack } from "@mui/material";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";

import { Sidebar } from "../components/sidebar";
import '../styles/style.css';
import ConsentContent from './consentContent';


export function SignupForm() {
    const [username, setUsername] = useState('');
    const [pwd, setPwd] = useState('');
    const [repwd, setRePwd] = useState('');
    const [email, setEmail] = useState('');
    const [tel, setTel] = useState('');
    const [first_name, setFirst_name] = useState('');
    const [last_name, setLast_name] = useState('');

    const [open, setOpen] = useState(false);
    const [sever, setSever] = useState('');
    const [message, setMessage] = useState('');

    const [name, setName] = useState("");
    const [date, setDate] = useState(getCurrentDate());
    const [consentGiven, setConsentGiven] = useState(false);

    const history = useHistory();

    const [agreeToTerms, setAgreeToTerms] = useState({
        age18: false,
        residentSinceAug1: false,
        tripPurpose: false,
        readAndUnderstand: false,
        participate: false,
    });

    const isValidPhoneNumber = (phoneNumber) => {
        const regex = /^\d{10}$/;
        return regex.test(phoneNumber);
    };

    const handleSubmit = (event) => {
        event.preventDefault()
        const data = {
            'username': username,
            'password': pwd,
            'repassword': repwd,
            'email': email,
            'tel': tel,
            'first_name': first_name,
            'last_name': last_name,
        }
        if (!isValidPhoneNumber(tel)) {
            setSever("warning");
            setMessage("Invalid phone number");
            setOpen(true);
            return;
        }
        fetch(localStorage.getItem('host') + '/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        }).then(response => {
            return response.json()
        }).then(data => {
            if (data['msg'] === "Current email has been registered") {
                setSever("warning")
                setMessage("Current email has been registered")
                setOpen(true)
            } else if (data['msg'] === "Current username has been used") {
                setSever("warning")
                setMessage("Current username has been used")
                setOpen(true)
            } else if (data['msg'] === "Password should be the same") {
                setSever("warning")
                setMessage("Password should be the same")
                setOpen(true)
            } else if (data['msg'] === "Password should be at least 8 characters") {
                setSever("warning")
                setMessage("Password should be at least 8 characters")
                setOpen(true)
            } else if (data['msg'] === "Current phone number has been used") {
                setSever("warning")
                setMessage("The provided phone number is already registered. Please use a different phone number.")
                setOpen(true)
            }else if (data['msg'] === "Current email has been used") {
                setSever("warning")
                setMessage("The email address provided is already associated with an existing account. Please register using a different email address")
                setOpen(true)
            } else {
                setSever("success")
                setMessage("Sign up success!")
                setOpen(true)
                setTimeout(() => history.push('/signin'), 3000)
            }
        })
    };

    const handleSignIn = (event) => {
        event.preventDefault()
        history.push('signin')
    };

    const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
    };

    const handleAccept = () => {
        if (name && date) {
            if (isValidDate(date)) {
                let allYes = true;
                Object.values(agreeToTerms).forEach((value) => {
                if (value !== "yes") {
                    allYes = false;
                }
                });
                if (allYes) {
                    // All questions answered "Yes", proceed to next sign-up page
                    setConsentGiven(true);
                } else {
                    // Not all questions answered "Yes", show a warning message
                    alert("Please answer all questions with 'Yes' to proceed.");
                }
            } else {
                alert("Please enter a valid date in the format mm/dd/yyyy.");
            }
        } else {
            alert("Please fill in all required fields.");
        }
    };
        
    const isValidDate = (dateString) => {
        const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
        return dateRegex.test(dateString);
    };

    function getCurrentDate() {
        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const year = today.getFullYear();
        return `${month}/${day}/${year}`;
    };

    const isFormValid = Object.values(agreeToTerms).every((value) => value);

    const handleCheckboxChange = (event) => {
        const { name, value } = event.target;
        setAgreeToTerms((prevTerms) => {
            return { ...prevTerms, [name]: value };
        });
    };
    
    return (
        <>
            <Container maxWidth="xl">
                <Sidebar username={localStorage.getItem('username')}/>
                {consentGiven ? (
                    <Container component="main" maxWidth="xs">
                        <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <AccountCircleOutlinedIcon sx={{ fontSize: 50 }}/>
                            <Typography component="h1" variant="h5" fontWeight={600}>
                                Create An Account
                            </Typography>
                            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <TextField
                                            margin="normal"
                                            required
                                            fullWidth
                                            label="First Name"
                                            autoComplete="First Name"
                                            variant="outlined"
                                            onChange={event => setFirst_name(event.target.value)}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            margin="normal"
                                            required
                                            fullWidth
                                            label="Last Name"
                                            autoComplete="Last Name"
                                            variant="outlined"
                                            onChange={event => setLast_name(event.target.value)}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            margin="normal"
                                            required
                                            fullWidth
                                            label="Username"
                                            autoComplete="Username"
                                            autoFocus
                                            variant="outlined"
                                            onChange={event => setUsername(event.target.value)}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            margin="normal"
                                            required
                                            fullWidth
                                            label="Password"
                                            autoComplete="Password"
                                            type="password"
                                            variant="outlined"
                                            onChange={event => setPwd(event.target.value)}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            margin="normal"
                                            required
                                            fullWidth
                                            label="Confirm Password"
                                            autoComplete="Confirm Password"
                                            type="password"
                                            variant="outlined"
                                            onChange={event => setRePwd(event.target.value)}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            margin="normal"
                                            required
                                            fullWidth
                                            label="Email"
                                            autoComplete="Email"
                                            variant="outlined"
                                            onChange={event => setEmail(event.target.value)}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            margin="normal"
                                            required
                                            fullWidth
                                            label="Phone Number"
                                            autoComplete="Phone Number"
                                            variant="outlined"
                                            onChange={event => setTel(event.target.value)}
                                        />
                                    </Grid>
                                </Grid>
                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    sx={{ mt: 3, mb: 2 }}
                                >
                                    Create My Account
                                </Button>
                                <Grid container>
                                    <Grid item xs>
                                    </Grid>
                                    <Grid item>
                                        <Link href="#" variant="body2" onClick={handleSignIn}>
                                            Registered? Sign In
                                        </Link>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Box>
                        <Snackbar open={open} autoHideDuration={5000} onClose={handleClose}>
                            <Alert onClose={handleClose} severity={sever} sx={{ width: '100%' }}>
                                {message}
                            </Alert>
                        </Snackbar>
                        <br/><br/><br/><br/>
                    </Container>
                ) : (
                    <Container maxWidth="lg">
                        <Box mt={8}>
                            <Typography component="h1" variant="h5" fontWeight={600}>
                                <font color="#C41230">Carnegie Mellon University</font>
                            </Typography>
                            <br/>
                            <Typography component="h1" variant="h5" fontWeight={600}>
                                <center>Online Consent for rual mobility service platform (RAMP)</center>
                            </Typography>
                            <Typography component="h1" variant="h5" fontWeight={600}>
                                <center>STUDY2023_108</center>
                            </Typography>
                            <hr />
                            <Typography mt={1} variant="body1">
                                <ConsentContent />
                            </Typography>

                            <Box mt={2}>
                                <Typography variant="body1" fontWeight={600}>
                                    <p>
                                        I am age 18 or older.
                                        <input type="radio" name="age18" value="yes" onChange={handleCheckboxChange} /> Yes
                                        <input type="radio" name="age18" value="no" onChange={handleCheckboxChange} /> No
                                    </p>
                                    <p>
                                        I am a resident of Greene County since Aug 1, 2023, or I am an enrolled student, faculty or staff affiliated with Waynesburg University since Aug 1, 2023. 
                                        <input type="radio" name="residentSinceAug1" value="yes" onChange={handleCheckboxChange} /> Yes
                                        <input type="radio" name="residentSinceAug1" value="no" onChange={handleCheckboxChange} /> No
                                    </p>
                                    <p>
                                        I ride the RAMP service exclusively for trips related to food, healthcare, jobs and community services.
                                        <input type="radio" name="tripPurpose" value="yes" onChange={handleCheckboxChange} /> Yes
                                        <input type="radio" name="tripPurpose" value="no" onChange={handleCheckboxChange} /> No
                                    </p>
                                    <p>
                                        I have read and understand the information above.
                                        <input type="radio" name="readAndUnderstand" value="yes" onChange={handleCheckboxChange} /> Yes
                                        <input type="radio" name="readAndUnderstand" value="no" onChange={handleCheckboxChange} /> No
                                    </p>
                                    <p>
                                        I want to participate in this research and continue with requesting rides with RAMP.
                                        <input type="radio" name="participate" value="yes" onChange={handleCheckboxChange} /> Yes
                                        <input type="radio" name="participate" value="no" onChange={handleCheckboxChange} /> No
                                    </p>
                                </Typography>
                            </Box>
                            <Box mt={2}>
                                <Typography variant="body1" fontWeight={600}>PRINT PARTICIPANT’S NAME:</Typography>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </Box>
                            <Box mt={2}>
                                <Typography variant="body1" fontWeight={600}>DATE (mm/dd/yyyy):</Typography>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                    error={!isValidDate(date)}
                                    helperText={!isValidDate(date) && "Please enter a valid date in the format mm/dd/yyyy."}
                                />
                            </Box>
                            <Stack mt={4} direction="row" spacing={2} justifyContent="center" mb={4}>
                                <Button 
                                    color='primary'
                                    onClick={handleAccept} 
                                    variant="contained" 
                                    disabled={!isFormValid}
                                >
                                    Accept
                                </Button>
                                <Button 
                                    color='info'
                                    variant="contained" 
                                    href="/"
                                    sx={{ ml: 2 }} 
                                >
                                    Decline
                                </Button>
                            </Stack>
                        </Box>
                    </Container>
                )}
            </Container>
        </>
    )
}
