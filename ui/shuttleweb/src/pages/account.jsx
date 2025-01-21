import React, { useState, useEffect } from 'react';
import { useHistory } from "react-router-dom";
import { PayPalButton } from "react-paypal-button-v2";
import CurrencyInput from "react-currency-input-field";
import {
    Avatar, Box, Button, Card, CardActionArea, CardContent, CardMedia, Container, 
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid, 
    Link, makeStyles, Snackbar, TextField, Typography
} from "@material-ui/core";
import { Alert } from "@mui/material";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import LocalActivityOutlinedIcon from '@mui/icons-material/LocalActivityOutlined';
import LocalAtmOutlinedIcon from '@mui/icons-material/LocalAtmOutlined';

import { fetchGet, fetchPost } from "./request";
import { Sidebar } from "../components/sidebar";
import '../styles/style.css';


const useStyles = makeStyles((theme) => ({
    card: {
        backgroundColor: "#F7ECDE"
    },
    avatar: {
        border: '0.2em solid white',
        width: theme.spacing(12),
        height: theme.spacing(12),
        boxShadow: theme.shadows[3],
        right: "2.5em",
    },
    headerContainer: {
        position: "relative",
        height: "5.5em",
    },
    header: {
        display: "flex",
        position: "absolute",
        width: "calc(75%)",
        top: "-2.5em",
        left: "6em",
        right: "6em",
        alignItems: "flex-end",
    },
    summaryCards: {
        display: "flex",
        flexWrap: "wrap",
        marginLeft: "1.5em",
        marginRight: "1.5em",
    },
    summaryCard: {
        margin: theme.spacing(2),
        flexGrow: 1,
        padding: theme.spacing(3),
        backgroundColor: "#F7ECDE"
    },
    noBackCard: {
        border: "none",
        boxShadow: "none",
        backgroundColor: "#FBF8F1"
    }
}));


export function ProfilePage() {

    const [username, setUsername] = useState('');
    const [tel, setTel] = useState('');
    const [balance, setBalance] = useState('');
    const [didUpdate, setDidUpdate] = useState(false);

    const classes = useStyles();

    const updateCallback = (data) => {
        setUsername(data["username"])
        setTel(data["tel"])
        setBalance(Number(data['balance']).toFixed(2))
    };

    useEffect(() => {
        if (didUpdate) {
            return
        }
        setDidUpdate(true)
        fetchGet('/api/account/profile', {}, updateCallback)
    }, [didUpdate]);

    return (
        <Container maxWidth="xl">
            <Sidebar username={localStorage.getItem("username")}/>
            <br/>
            <Container maxWidth="xl">
                <Grid container rowSpacing={1}>
                    <Grid item xs={12} md={12}>
                        <Card className={classes.card} sx={{ display: 'flex' }}>
                            <CardContent sx={{ flex: 1 }}>
                                <Typography component="h2" variant="h4" color="black" gutterBottom>
                                    Account Information
                                </Typography>
                                <Typography variant="h6" color="black" paragraph>
                                    Username: {username}
                                </Typography>
                                <Typography variant="h6" color="black" paragraph>
                                    Phone: {tel}
                                </Typography>
                                <Typography variant="h6" color="black" paragraph>
                                    Account Balance: {balance}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid><br/>
                <Grid container spacing={4}>
                    <Grid item xs={12} md={4}>
                        <CardActionArea component="a" href='/account/balance'>
                            <Card sx={{ display: 'flex' }} className={classes.card}>
                                <CardMedia
                                    component="img"
                                    height="150"
                                    image='diy_payment.jpg'
                                />
                                <CardContent sx={{ flex: 1 }}>
                                    <Typography component="h2" variant="h5">
                                        Your payment
                                    </Typography>
                                    <Typography variant="body2" paragraph>
                                        Reload your balance
                                    </Typography>
                                </CardContent>
                            </Card>
                        </CardActionArea>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <CardActionArea component="a" href='/account/profile'>
                            <Card sx={{ display: 'flex' }} className={classes.card}>
                                <CardMedia
                                    component="img"
                                    height="150"
                                    image='diy_profile.jpg'
                                />
                                <CardContent sx={{ flex: 1 }}>
                                    <Typography component="h2" variant="h5">
                                        Your profile
                                    </Typography>
                                    <Typography variant="body2" paragraph>
                                        Manage your profile
                                    </Typography>
                                </CardContent>
                            </Card>
                        </CardActionArea>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <CardActionArea component="a" href='/account/password'>
                            <Card sx={{ display: 'flex' }} className={classes.card}>
                                <CardMedia
                                    component="img"
                                    height="150"
                                    image='diy_security.jpg'
                                />
                                <CardContent sx={{ flex: 1 }}>
                                    <Typography component="h2" variant="h5">
                                        Your password
                                    </Typography>
                                    <Typography variant="body2" paragraph>
                                        Change your password
                                    </Typography>
                                </CardContent>
                            </Card>
                        </CardActionArea>
                    </Grid>
                </Grid>
            </Container>
        </Container>
    );
}


export function UpdateProfile() {
    const [tel, setTel] = useState('')
    const [email, setEmail] = useState('');
    const [first_name, setFirst_name] = useState('');
    const [last_name, setLast_name] = useState('');
    const [telTmp, setTelTmp] = useState('')
    const [emailTmp, setEmailTmp] = useState('');
    const [first_nameTmp, setFirst_nameTmp] = useState('');
    const [last_nameTmp, setLast_nameTmp] = useState('');
    const [didUpdate, setDidUpdate] = useState(false);
    const [open, setOpen] = useState(false);

    const classes = useStyles();

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const updateCallback = (data) => {
        setTel(data["tel"])
        setFirst_name(data["first_name"])
        setLast_name(data["last_name"])
        setEmail(data["email"])
        setTelTmp(data["tel"])
        setFirst_nameTmp(data["first_name"])
        setLast_nameTmp(data["last_name"])
        setEmailTmp(data["email"])
    };

    const handleSubmit = (event) => {
        event.preventDefault()
        const params = {
            "tel": telTmp,
            "first_name": first_nameTmp,
            "last_name": last_nameTmp,
            "email": emailTmp
        }
        fetchPost('/api/account/modify', params, updateCallback)
        setOpen(false);
    };

    useEffect(() => {
        if (didUpdate) {
            return
        }
        setDidUpdate(true)
        fetchGet('/api/account/profile', {}, updateCallback)
    }, [didUpdate]);

    return (
        <Container maxWidth="xl">
            <Sidebar username={localStorage.getItem("username")}/>
            <div
                style={{
                    height: "15em",
                    backgroundPosition: "center",
                    backgroundSize: "cover",
                    filter: "contrast(75%)",
                    backgroundImage: "url(/profile_background.jpg)",
                }}
            />
            <div className={classes.headerContainer}>
                <div className={classes.header}>
                    <Avatar classes={{ root: classes.avatar }} />
                    <Button
                        variant="outlined"
                        sx={{ mt: 2, mb: 0.8, ml: 0, mr: 2}}
                        onClick={handleClickOpen}
                    >
                        Edit Profile
                    </Button>
                    <Dialog open={open} onClose={handleClose}>
                        <DialogTitle>
                            Modify your profile
                        </DialogTitle>
                            <DialogContent>
                                <DialogContentText>
                                    Update your name, phone number or email address
                                </DialogContentText>
                                <TextField
                                    required
                                    margin="dense"
                                    label="First Name"
                                    fullWidth
                                    variant="standard"
                                    defaultValue={first_name}
                                    onChange={event => setFirst_nameTmp(event.target.value)}
                                />
                                <TextField
                                    required
                                    margin="dense"
                                    label="Last Name"
                                    fullWidth
                                    variant="standard"
                                    defaultValue={last_name}
                                    onChange={event => setLast_nameTmp(event.target.value)}
                                />
                                <TextField
                                    required
                                    margin="dense"
                                    label="Phone Number"
                                    fullWidth
                                    variant="standard"
                                    defaultValue={tel}
                                    onChange={event => setTelTmp(event.target.value)}
                                />
                                <TextField
                                    required
                                    margin="dense"
                                    label="Email Address"
                                    type="email"
                                    fullWidth
                                    variant="standard"
                                    defaultValue={email}
                                    onChange={event => setEmailTmp(event.target.value)}
                                />
                            </DialogContent>
                        <DialogActions>
                        <Button onClick={handleClose}>Cancel</Button>
                        <Button onClick={handleSubmit}>Submit</Button>
                        </DialogActions>
                    </Dialog>
                </div>
            </div>
            <div className={classes.summaryCards}>
                <Card elevation={2} className={classes.summaryCard}>
                    <Typography color={"textSecondary"} variant="h6" gutterBottom>
                        Name
                    </Typography>
                    <Typography color={"primary"} variant="h5">
                        {first_name} {last_name}
                    </Typography>
                </Card>
                <Card elevation={2} className={classes.summaryCard}>
                    <Typography color={"textSecondary"} variant="h6" gutterBottom>
                        Telephone
                    </Typography>
                    <Typography color={"primary"} variant="h5">
                        {tel}
                    </Typography>
                </Card>
                <Card elevation={2} className={classes.summaryCard}>
                    <Typography color={"textSecondary"} variant="h6" gutterBottom>
                        Email
                    </Typography>
                    <Typography color={"primary"} variant="h5">
                        {email}
                    </Typography>
                </Card>
            </div>
        </Container>
    );
}


export function UpdatePassword() {
    const [password, setPassword] = useState('');
    const [didUpdate, setDidUpdate] = useState(false);
    const [open, setOpen] = useState(false)
    const [sever, setSever] = useState('')
    const [message, setMessage] = useState('')

    const updateCallback = (data) => {
        setSever("success")
        setMessage("Update password successfully!")
        setOpen(true)
    };

    const handleSubmit = (event) => {
        event.preventDefault()
        const params = {
            "password": password,
        }
        fetchPost('/api/account/modify', params, updateCallback)
    };

    const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
    };

    useEffect(() => {
        if (didUpdate) {
            return
        }
        setDidUpdate(true)
    }, [didUpdate]);

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
                        Change Your Password
                    </Typography>
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            fullWidth
                            label="New Password"
                            autoFocus
                            variant="outlined"
                            type="password"
                            placeholder='New Password'
                            onChange={event => setPassword(event.target.value)}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                        >
                            Modify Password
                        </Button>
                    </Box>
                </Box>
                <Snackbar open={open} autoHideDuration={8000} onClose={handleClose}>
                    <Alert onClose={handleClose} severity={sever} sx={{ width: '100%' }}>
                        {message}
                    </Alert>
                </Snackbar>
            </Container>
        </Container>
    )
}


export function BalancePage () {

    const [balance, setBalance] = useState("0.00");
    const [didUpdate, setDidUpdate] = useState(false);

    const classes = useStyles();

    const updateCallback = (data) => {
        if ('balance' in data) {
            setBalance(Number(data['balance']).toFixed(2))
        } else {
            setDidUpdate(false)
        }
    };

    useEffect(() => {
        if (didUpdate) {
            return
        }
        setDidUpdate(true)
        fetchGet('/api/account/profile', {}, updateCallback)
    }, [didUpdate]);

    return (
        <Container maxWidth="xl">
            <Sidebar username={localStorage.getItem("username")}/>
            <Container>
                <Box
                    sx={{
                        marginTop: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <Card className={classes.noBackCard} sx={{ display: 'flex' }}>
                        <CardContent sx={{ flex: 1 }}>
                            <Typography variant="h6" color="textSecondary" gutterBottom>
                                Account Balance
                            </Typography>
                            <Typography variant="h2" color="primary">
                                {balance}
                            </Typography>
                        </CardContent>
                    </Card>
                    <Box sx={{ mt: 1 }}>
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            href="/account/coupon"
                            sx={{ mt: 1, mb: 2 }}
                        >
                            Redeem Coupon
                        </Button>
                    </Box>
                </Box>
            </Container>
        </Container>
    );
}


export function CouponPage(props) {

    const [balance, setBalance] = useState("0.00");
    const [didUpdate, setDidUpdate] = useState(false);
    const [coupon, setCoupon] = useState('');

    const handleCouponInput = (event) => {
        setCoupon(event.target.value)
    };

    const redeemCallback = (data) => {
        if ('balance' in data) {
            setBalance(data['balance'])
            alert("Successfully redeem the coupon.")
            setTimeout(() => {
                props.history.push('../../account')
            }, 1500)
        } else {
            alert(data['error'])
        }
    };

    const handleRedeem = (event) => {
        event.preventDefault()
        const params = {
            "username": localStorage.getItem("username"),
            "promotionCode": coupon
        }
        fetchPost('/api/payment/redeem', params, redeemCallback)
    };

    const updateCallback = (data) => {
        if ('balance' in data) {
            setBalance(Number(data['balance']).toFixed(2))
        } else {
            setDidUpdate(false)
        }
    };

    useEffect(() => {
        if (didUpdate) {
            return
        }
        setDidUpdate(true)
        fetchGet('/api/account/profile', {}, updateCallback)
    }, [didUpdate]);

    return (
        <Container maxWidth="xl">
            <Sidebar username={localStorage.getItem("username")}/>
            <Container component="main" maxWidth="xs">
                <Box
                    sx={{
                        marginTop: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <LocalActivityOutlinedIcon sx={{ fontSize: 50 }}/>
                    <Typography component="h1" variant="h5" fontWeight={600}>
                        Redeem a Coupon Code
                    </Typography>
                    <Box component="form" sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            fullWidth
                            label="Your Balance"
                            variant="outlined"
                            value={balance}
                            disabled
                        />
                        <TextField
                            margin="normal"
                            fullWidth
                            label="Coupon Code"
                            variant="outlined"
                            placeholder='Coupon Code'
                            onChange={handleCouponInput}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                            onClick={handleRedeem}
                        >
                            Redeem
                        </Button>
                    </Box>
                </Box>
            </Container>
        </Container>
    );
}


export function PaymentPage() {

    const [username, setUsername] = useState('');
    const [didUpdate, setDidUpdate] = useState(false);
    const [amount, setAmount] = useState(10.00);
    const [open, setOpen] = useState(false)
    const [sever] = useState('success')
    const [message, setMessage] = useState('')
    const history = useHistory()

    const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
    };

    const updateCallback = (data) => {
        setUsername(data["username"])
    };

    const paypalCallback = (data) => {
        if (data[0] === 'successful') {
            setMessage("Payment Success! Jumping back to Balance.")
            setOpen(true)
            setTimeout(() => history.push('/account/balance'), 5000)
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        const { value = "" } = e.target;
        const parsedValue = value.replace(/[^\d.]/gi, "");
        setAmount(parsedValue);
    };

    const handleOnBlur = () => setAmount(Number(amount).toFixed(2));

    useEffect(() => {
        if (didUpdate) {
            return
        }
        setDidUpdate(true)
        fetchGet('/api/account/profile', {}, updateCallback)
    }, [didUpdate]);

    return (
        <Container maxWidth="xl">
            <Sidebar username={localStorage.getItem("username")}/>
            <Container component="main" maxWidth="xs">
                <Box
                    sx={{
                        marginTop: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <LocalAtmOutlinedIcon sx={{ fontSize: 50 }}/>
                    <Typography component="h1" variant="h5" fontWeight={600}>
                        Reload Your Balance
                    </Typography>
                    <Box component="form" sx={{ mt: 1 }}>
                        <CurrencyInput
                            // prefix={ '$ ' }
                            id="currencyInput"
                            name="currencyInput"
                            className="form-control"
                            placeholder="Please Enter the Amount"
                            data-number-to-fixed="2"
                            data-number-stepfactor="100"
                            value={ amount }
                            onChange={ handleChange }
                            onBlur={ handleOnBlur }
                            allowDecimals
                            decimalsLimit="2"
                            disableAbbreviations
                        />
                        <br/>
                        <PayPalButton
                            options={{
                                clientId: "AeKYIyBz-PZZIM3B2Yth02IwUw_H-w6AYVE17ISwar_L8Z_sEkj3vrmyJN14DC1LTx6GF9AXdC9bA2Dx",
                                currency: "USD",
                            }}
                            amount={amount}
                            onSuccess={(details, data) => {
                                const body = {
                                    username: username,
                                    paypal_amount: amount
                                }
                                fetchPost('/api/payment/paypal_amount_update', body, paypalCallback)
                            }}
                        />
                        <Grid container>
                            <Grid item xs>
                            </Grid>
                            <Grid item>
                                <Link href='https://www.paypal.com/us/webapps/mpp/merchant-fees' variant="body2">
                                    Paypal Transaction Rates
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
    );
}

