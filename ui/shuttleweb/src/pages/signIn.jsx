import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Box, Button, Container, Grid, Link, Snackbar, TextField, Typography } from "@material-ui/core";
import { Alert } from "@mui/material";
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';

import { Sidebar } from "../components/sidebar";
import '../styles/style.css';


export function SigninForm() {
    const [username, setUsername] = useState('');
    const [pwd, setPwd] = useState('');
    const [open, setOpen] = useState(false);
    const [sever, setSever] = useState('');
    const [message, setMessage] = useState('');
    const history = useHistory();

    const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
    };

    const handleSubmit = (event) => {
        event.preventDefault()

        const data = {
            'username': username,
            'password': pwd,
        }
        fetch(localStorage.getItem('host') + '/api/token', {
                method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })

        .then(response => response.json())
        .then(data => {
            if ('access' in data) { // set JWT tokens if successfully logged in
                localStorage.setItem('username', username)
                localStorage.setItem('refresh', data['refresh'])
                localStorage.setItem('access', data['access'])
                localStorage.setItem('auth', data['auth'])

                // redirect to homepage
                let auth = parseInt(localStorage.getItem("auth"))

                setSever("success")
                setMessage("Sign In success!")
                setOpen(true)

                if ( auth === 0 )
                    setTimeout(() => history.push('/ondemand'), 2000)
                else if ( auth === 1 )
                    setTimeout(() => history.push('/shuttlelogin'), 2000)
                else if ( auth === 2 )
                    setTimeout(() => history.push('/manage'), 2000)
                else if ( auth === 3 )
                    setTimeout(() => history.push('/bus'), 2000)
                else
                    setTimeout(() => history.push('/'), 2000)
            } else {
                setSever("error")
                setMessage(data['detail'])
                setOpen(true)
            }
        })
    };

    const handleSignUp = (event) => {
        event.preventDefault()
        // redirect to signin page
        history.push('signup')
    };

    const handleForget = (event) => {
        event.preventDefault()
        history.push('forget-password')
    };

    return (
        <Container maxWidth="xl">
            <Sidebar username={localStorage.getItem('username')}/>

            <Container component="main" maxWidth="xs">
                <Box
                    sx={{
                        marginTop: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <AccountCircleOutlinedIcon sx={{ fontSize: 50 }}/>
                    <Typography component="h1" variant="h5" fontWeight={600}>
                        Sign In
                    </Typography>
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
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
                        <br/>
                        <Button
                            color='primary'
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                        >
                            Sign In
                        </Button>
                        <Grid container>
                            <Grid item xs>
                                <Link href="#" variant="body2" onClick={handleForget}>
                                    Forgot password?
                                </Link>
                            </Grid>
                            <Grid item>
                                <Link href="#" variant="body2" onClick={handleSignUp}>
                                    Don't have an account? Sign Up
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
            </Container>
        </Container>
    )
}


export function ForgetPassword() {
    const [email, setEmail] = useState('')
    const [open, setOpen] = useState(false)
    const [sever, setSever] = useState('')
    const [message, setMessage] = useState('')
    const history = useHistory()
    const handleSubmit = (event) => {
        event.preventDefault()

        const data = {
            'email': email,
        }

        fetch(localStorage.getItem('host') + '/api/forget_password', {
                method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })

        .then(response => response.json())
        .then(data => {
            if ( data.msg === "Account does not exist" ) {
                setSever("warning")
                setMessage("Account does not exist!")
                setOpen(true)
            } else if ( data.msg ) {
                setSever("success")
                setMessage("Successfully changed password! Please return to sign in.")
                setOpen(true)
            } else if ( data.error ) {
                setSever("error")
                setMessage("Something went wrong.")
                setOpen(true)
            }
        })
    };

    const handleBack = (event) => {
        event.preventDefault()
        // Redirect to signin page
        history.push('signin')
    };

    const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
    };

    return (
        <Container maxWidth="xl">
            <Sidebar username={localStorage.getItem('username')}/>

            <Container component="main" maxWidth="xs">
                <Box
                    sx={{
                        marginTop: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <HelpOutlineOutlinedIcon sx={{ fontSize: 50 }}/>
                    <Typography component="h1" variant="h5" fontWeight={600}>
                        Forgot Password
                    </Typography>
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Email Address"
                            autoComplete="Email Address"
                            autoFocus
                            variant="outlined"
                            placeholder='Email Address'
                            onChange={event => setEmail(event.target.value)}
                        />
                        <Button
                            color='primary'
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                        >
                            Send New Password
                        </Button>
                        <Grid container>
                            <Grid item xs>
                            </Grid>
                            <Grid item>
                                <Link href="#" variant="body2" onClick={handleBack}>
                                    Back to Sign in
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
            </Container>
        </Container>
    )
}
