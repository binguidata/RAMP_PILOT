import React from 'react';
import HomeOutlinedIcon from '@material-ui/icons/HomeOutlined';
import UpdateOutlinedIcon from '@material-ui/icons/UpdateOutlined';
import AirportShuttleOutlinedIcon from '@material-ui/icons/AirportShuttleOutlined';
import ReceiptOutlinedIcon from '@material-ui/icons/ReceiptOutlined';
import BusinessOutlinedIcon from '@material-ui/icons/BusinessOutlined';
import ConfirmationNumberOutlinedIcon from '@material-ui/icons/ConfirmationNumberOutlined';
import DirectionsOutlinedIcon from '@material-ui/icons/DirectionsOutlined';
import DirectionsBusFilledIcon from '@mui/icons-material/DirectionsBusFilled';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import HelpCenterOutlinedIcon from '@mui/icons-material/HelpCenterOutlined';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';
import ThumbsUpDownOutlinedIcon from '@mui/icons-material/ThumbsUpDownOutlined';
import FeedbackOutlinedIcon from '@mui/icons-material/FeedbackOutlined';
import AccountBoxOutlinedIcon from '@mui/icons-material/AccountBoxOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import DvrIcon from '@mui/icons-material/Dvr';


export const SidebarData = [
    {
        title: 'Home',
        path: '/',
        needAuth: "0",
        icon: <HomeOutlinedIcon fontSize="large"/>,
        cName: 'nav-text'
    },

    {
        title: 'Book a Trip',
        path: '/ondemand',
        needAuth: "0",
        icon: <DirectionsOutlinedIcon fontSize="large"/>,
        cName: 'nav-text'
    },

    {
        title: 'Estimated Time of Arrival',
        path: '/eta',
        needAuth: "0",
        icon: <UpdateOutlinedIcon fontSize="large"/>,
        cName: 'nav-text'
    },

    {
        title: 'My Reservations',
        path: '/reservations',
        needAuth: "0",
        icon: <ReceiptOutlinedIcon fontSize="large"/>,
        cName: 'nav-text'
    },

    {
        title: 'Q & A',
        path: '/faq',
        needAuth: "0",
        icon: <HelpCenterOutlinedIcon fontSize="large"/>,
        cName: 'nav-text'
    },

    {
        title: 'Feedback',
        path: '/feedback',
        needAuth: "0",
        icon: <FeedbackOutlinedIcon fontSize="large"/>,
        cName: 'nav-text'
    },

    {
        title: 'Support',
        path: '/support',
        needAuth: "0",
        icon: <SupportAgentOutlinedIcon fontSize="large"/>,
        cName: 'nav-text'
    },

    {
        title: 'Shuttle',
        path: '/shuttle',
        needAuth: "1",
        icon: <AirportShuttleOutlinedIcon fontSize="large"/>,
        cName: 'nav-text'
    },

    {
        title: 'Management Center',
        path: '/manage',
        needAuth: "2",
        icon: <BusinessOutlinedIcon fontSize="large"/>,
        cName: 'nav-text'
    },
    {
        title: 'Reservations',
        path: '/manage_reservations',
        needAuth: "2",
        icon: <DvrIcon fontSize="large"/>,
        cName: 'nav-text'
    },
    {
        title: 'Generate Coupon',
        path: '/coupon',
        needAuth: "2",
        icon: <ConfirmationNumberOutlinedIcon fontSize="large"/>,
        cName: 'nav-text'
    },
    {
        title: 'Allocate Coupon',
        path: '/allocate_coupon',
        needAuth: "2",
        icon: <ConfirmationNumberOutlinedIcon fontSize="large"/>,
        cName: 'nav-text'
    },

    {
        title: 'On-demand Vans Management',
        path: '/shuttlemanagement',
        needAuth: "2",
        icon: <AirportShuttleOutlinedIcon fontSize="large"/>,
        cName: 'nav-text'
    },

    {
        title: 'Dial In Users',
        path: '/dialinusers',
        needAuth: "2",
        icon: <PersonAddAltOutlinedIcon fontSize="large"/>,
        cName: 'nav-text'
    },

    {
        title: 'View Feedback',
        path: '/viewfeedback',
        needAuth: "2",
        icon: <FeedbackOutlinedIcon fontSize="large"/>,
        cName: 'nav-text'
    },

    {
        title: 'Volunteer Drivers',
        path: '/volunteer',
        needAuth: "2",
        icon: <VolunteerActivismOutlinedIcon fontSize="large"/>,
        cName: 'nav-text'
    },

    {
        title: 'Customers',
        path: '/viewcustomers',
        needAuth: "2",
        icon: <AccountBoxOutlinedIcon fontSize="large"/>,
        cName: 'nav-text'
    },

    {
        title: 'Drivers',
        path: '/viewdrivers',
        needAuth: "2",
        icon: <BadgeOutlinedIcon fontSize="large"/>,
        cName: 'nav-text'
    },

    {
        title: 'Counts',
        path: '/bus',
        needAuth: "3",
        icon: <ThumbsUpDownOutlinedIcon fontSize="large"/>,
        cName: 'nav-text'
    },


];
