import React, { useEffect, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { Drawer, List, makeStyles } from "@material-ui/core";
import { 
    AppBar, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, 
    Divider, IconButton, ListItem, ListItemIcon, ListItemText, Menu, MenuItem, Toolbar, Tooltip,  Typography
} from "@mui/material";
import AccountCircle from '@mui/icons-material/AccountCircle';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import MenuIcon from '@mui/icons-material/Menu';
import EmojiTransportationOutlinedIcon from '@material-ui/icons/EmojiTransportationOutlined';

import { fetchPost } from "../pages/request";
import { SidebarData } from "./sidebarData";
import '../styles/style.css';


export function Sidebar(props) {
    const [hasChecked, setHasChecked] = useState(false);
    const [username, setUsername] = useState(props.username);
    const [auth, setAuth] = useState(localStorage.getItem('auth'))
    const [anchorEl, setAnchorEl] = useState(null);
    const history = useHistory()
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const [dialogOpen, setDialogOpen] = React.useState(false);

    const useStyles = makeStyles(() => ({
        toolBar: {
            margin: "auto",
            maxWidth: 'xl',
            width: "100%",
            background: "#495371"
        },
        smallBar: {
            background: "#495371"
        },
        sideBar: {
            background: "#FBF8F1"
        }
    }));

    const classes = useStyles();

    const handleDialogClickOpen = () => {
        setDialogOpen(true);
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
        history.push("/signin")
    };

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleBackHome = (event) => {
        event.preventDefault()
        history.push('/')
    };

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = (event) => {
        event.preventDefault()
        const shuttleId = localStorage.getItem('shuttleAllocatedId')
        if ( auth == 1 && shuttleId != null ) {
            setupShuttleAllocation(shuttleId)
        } else {
            localStorage.removeItem('username')
            localStorage.removeItem('access')
            localStorage.removeItem('refresh')
            localStorage.removeItem('auth')

            setUsername(null)
            history.push('/')
            window.location.reload()
        }
    };

    // Allocation bit set to free for shuttle in reservation _shuttle 
    const fetchPostShuttleAllocationStatusCallback = (data) => {
        localStorage.removeItem('username')
        localStorage.removeItem('access')
        localStorage.removeItem('refresh')
        localStorage.removeItem('auth')
        setUsername(null)
        localStorage.removeItem('shuttleAllocatedId')     
        history.push('/')
        window.location.reload()   
    };

    const setupShuttleAllocation = (sid) => {
        const uploadParams = {
            id: sid,
            allocated : false,
        }
        fetchPost("/api/reservation/setShuttleAvailability", uploadParams, fetchPostShuttleAllocationStatusCallback);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const checkSession = () => {
        // check whether access token has expired
        fetch(localStorage.getItem('host') + '/api/hello', {
                method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "JWT " + localStorage.getItem("access")
            }
        })
        .then(response => {
            if (response.status === 401 || response.status === 404) {
                refreshToken()
            }
        })
    };

    const refreshToken = () => {
        // attempt to refresh the access token
        const  info = {
            "username": localStorage.getItem("username"),
            "refresh": localStorage.getItem("refresh")
        }
        fetch(localStorage.getItem('host') + '/api/token/refresh', {
                method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(info)
        })
        .then(response => {
            if (response.status === 400) {
                forceLogout()
                return null
            } else {
                return response.json()
            }
        })
        .then(data => {
            if (data != null) {
                // true or false assume there is a boolean value in access\
                localStorage.setItem("auth", data["auth"])
                localStorage.setItem("access", data["access"])
                localStorage.setItem("refresh", data["refresh"])
                setAuth(localStorage.getItem('auth'))
            }
        })
    };

    const forceLogout = () => { // logout when the refresh token expired
        if (localStorage.getItem('username') !== null) {    // only pop for once
            const shuttleId = localStorage.getItem('shuttleAllocatedId')
            if ( auth === 1 && shuttleId != null ) {  
                setupShuttleAllocation(shuttleId)
            } else {
                localStorage.removeItem('username')
                localStorage.removeItem('access')
                localStorage.removeItem('refresh')
                localStorage.removeItem('auth')
                setUsername(null)
                history.push('/')
                handleDialogClickOpen()
            }            
        }
    };

    const drawer = (
        <div>
            <Toolbar className={classes.smallBar}>
                <MenuBookIcon className="svg_icons" style={{ color: '#fff' }} />
            </Toolbar>
            <Divider />
            <List>
                 {SidebarData.map((item, index) => {
                    if ( item.needAuth >= 0 && (auth === item.needAuth || auth === "4")) {

                        return (<ListItem button component={Link} to={item.path} key={index}>
                            <ListItemIcon> {item.icon} </ListItemIcon>
                            <ListItemText
                                disableTypography
                                primary={
                                    <Typography variant="h6">
                                        { item.title }
                                    </Typography>
                                } />
                        </ListItem>
                        )
                    } else {
                        return null
                    }
                })}
            </List>
        </div>
    );

    useEffect(() => {
        if (!hasChecked) {
            checkSession()
            setInterval(checkSession, 30000)
        }
        setHasChecked(true)
    }, [hasChecked, checkSession]);

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar position="sticky">
                <Toolbar className={classes.toolBar}>
                    {username == null ? (
                        <IconButton disableRipple={true}
                            className="svg_icons"
                            size="large"
                            edge="start"
                            color="inherit"
                            aria-label="menu"
                            onClick={handleBackHome}
                            sx={{ mr: 2 }}>
                            <EmojiTransportationOutlinedIcon fontSize='large'/>
                        </IconButton>
                    ) : (
                        <IconButton disableRipple={true}
                            className="svg_icons"
                            size="large"
                            edge="start"
                            color="inherit"
                            aria-label="menu"
                            onClick={handleDrawerToggle}
                            sx={{ mr: 2 }}>
                            <MenuIcon />
                        </IconButton>

                    )}
                    <Typography
                        to="/"
                        component={Link}
                        color="white"
                        variant="h5"
                        style={{ textDecoration: 'none', color: 'inherit' }}
                        sx={{ flexGrow: 1}}
                    >
                        Mobility Service
                    </Typography>
                    {username == null ? (
                        <Button color="inherit" href="/signin" size="large">
                            Sign In / Sign Up
                        </Button>
                    ) : (
                        <div>
                            <Tooltip title="open settings">
                                <Button size="large"
                                        aria-label="account of current user"
                                        aria-controls="menu-appbar"
                                        aria-haspopup="true"
                                        onClick={handleMenu}
                                        startIcon={<AccountCircle />}
                                        color="inherit">
                                    {username}
                                </Button>
                            </Tooltip>
                            <Menu
                                classes={{ paper: classes.sideBar }}
                                id="menu-appbar"
                                anchorEl={anchorEl}
                                anchorOrigin={{
                                  vertical: 'top',
                                  horizontal: 'right',
                                }}
                                keepMounted
                                transformOrigin={{
                                  vertical: 'top',
                                  horizontal: 'right',
                                }}
                                open={Boolean(anchorEl)}
                                onClose={handleClose}>
                                <MenuItem component={Link} to="/account">My account</MenuItem>
                                <MenuItem component={Link} to="/account/profile">My Profile</MenuItem>
                                <MenuItem onClick={handleLogout}>Sign Out</MenuItem>
                            </Menu>
                        </div>
                    )}
                </Toolbar>
            </AppBar>
            <Dialog
                open={dialogOpen}
                onClose={handleDialogClose}
            >
            <DialogTitle>
                {"Session Timeout!"}
            </DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Your login session expired. Please sign in again.
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleDialogClose} autoFocus>
                    OK
                </Button>
            </DialogActions>
            </Dialog>
            <Box component="nav"
                 sx={{ width: { sm: 0 }, flexShrink: { sm: 0 } }}>
                <Drawer
                    classes={{ paper: classes.sideBar }}
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}

                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 0 },
                    }}
                >
                    {drawer}
                </Drawer>
            </Box>
        </Box>
    );
}
