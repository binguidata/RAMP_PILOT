import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Route, Switch } from "react-router-dom";

import './index.css';
import { ForgetPassword, SigninForm } from "./pages/signIn.jsx";
import { SignupForm } from "./pages/signUp.jsx";
import ETAPage from "./pages/eta.jsx";
import { RecordPage } from "./pages/records.jsx";
import { ProfilePage, BalancePage, CouponPage, PaymentPage, UpdateProfile, UpdatePassword } from "./pages/account.jsx";
import SupportPage from "./pages/support.jsx";
import ShuttlePage from "./pages/shuttle.jsx";
import ManagePage from "./pages/manage.jsx";
import ManageAllRecords from "./pages/managerallrecords.jsx";
import { Home } from "./pages/home.jsx";
import { CustomerRoutes, ShuttleRoutes, ManageRoutes, BusRoutes, AccountRoutes } from "./components/customizedRouter";
import OnDemandPage from "./pages/ondemand.jsx";
import { GenerateCouponPage } from "./pages/generate";
import { AllocateCoupanPage } from "./pages/allocateCoupan";
import { VolunteerPage } from "./pages/volunteer";
import BusPage from './pages/bus.jsx';
import BusSchedule from './pages/busSchedule.jsx';
import FAQ from './pages/faq.jsx';
import ShuttleSigninForm from './pages/driverLoginInfo';
import { ShuttleManagementPage } from './pages/shuttleManagement.jsx';
import { BusManagementPage } from './pages/busManagement.jsx';
import DialinUsersPage from './pages/dialinUsers.jsx';
import FeedbackForm from './pages/feedback.jsx';
import ViewFeedback from './pages/viewFeedback.jsx';
import ViewCustomers from './pages/viewCustomers.jsx';
import ViewDrivers from './pages/viewDrivers.jsx';


localStorage.setItem(
    'host',
    process.env.NODE_ENV === 'production'
        ? 'https://ramp-pilot.com:4321'
        : 'http://localhost:8000'
)


ReactDOM.render(
    <BrowserRouter>
        <Switch>
            <Route exact path={ "/signin" } component={ SigninForm } />
            <Route exact path={ "/signup" } component={ SignupForm } />
            <Route exact path={ "/forget-password" } component={ ForgetPassword } />
            <CustomerRoutes exact path={ "/eta" } component={ ETAPage } />
            <CustomerRoutes exact path={ "/reservations" } component={ RecordPage } />
            <CustomerRoutes exact path={ "/ondemand" } component={ OnDemandPage } />
            <AccountRoutes exact path={ "/account" } component={ ProfilePage } />
            <AccountRoutes exact path={ "/account/balance" } component={ BalancePage } />
            <AccountRoutes exact path={ "/account/coupon" } component={ CouponPage } />
            <AccountRoutes exact path={ "/account/profile" } component={ UpdateProfile } />
            <AccountRoutes exact path={ "/account/password" } component={ UpdatePassword } />
            <Route exact path={ "/support" } component={ SupportPage } />
            <ShuttleRoutes exact path={ "/shuttle" } component={ ShuttlePage } />
            <ShuttleRoutes exact path={ "/shuttlelogin" } component={ ShuttleSigninForm } />
            <BusRoutes exact path={ "/bus" } component={ BusPage } />
            <Route exact path={ "/busschedule" } component={ BusSchedule } />
            <Route exact path={ "/faq" } component={ FAQ } />
            <CustomerRoutes exact path={ "/feedback" } component={ FeedbackForm } />
            <ManageRoutes exact path={ "/manage" } component={ ManagePage } />
            <ManageRoutes exact path={ "/manage_reservations" } component={ ManageAllRecords } />
            <ManageRoutes exact path={ "/coupon" } component={ GenerateCouponPage } />
            <ManageRoutes exact path={ "/allocate_coupon"} component={AllocateCoupanPage} />
            <ManageRoutes exact path={ "/volunteer" } component={ VolunteerPage } />
            <ManageRoutes exact path={ "/shuttlemanagement" } component={ ShuttleManagementPage } />
            <ManageRoutes exact path={ "/busmanagement" } component={ BusManagementPage } />
            <ManageRoutes exact path={ "/dialinusers" } component={ DialinUsersPage } />
            <ManageRoutes exact path={ "/viewfeedback" } component={ ViewFeedback } />
            <ManageRoutes exact path={ "/viewCustomers" } component={ ViewCustomers } />
            <ManageRoutes exact path={ "/viewDrivers" } component={ ViewDrivers } />
            <Route path={ "/" } component={ Home } />
        </Switch>
    </BrowserRouter>,
    document.getElementById( 'root' )
);
