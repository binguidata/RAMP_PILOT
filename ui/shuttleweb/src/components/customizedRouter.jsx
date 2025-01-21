import React from 'react';
import { Redirect, Route } from 'react-router-dom';

/**
 * Set up a restricted React Routes for customer to prevent
 * unauthorized user from accessing the page from direct url
 * @param Component
 * @param rest - Rest of the parameters
 * @returns {JSX.Element} - Return customized router element
 * @constructor - Default
 */
const CustomerRoutes = ({ component: Component, ...rest }) => {
    let auth_token = localStorage.getItem('auth')
    return (
        <Route {...rest} render={props => (auth_token === "0" ?
            (<Component  {...props}/>) : (<Redirect to='/'/>))}/>
    )
};

/**
 * Set up a restricted React Routes for driver to prevent
 * unauthorized user from accessing the page from direct url
 * @param Component
 * @param rest - Rest of the parameters
 * @returns {JSX.Element} - Return customized router element
 * @constructor - Default
 */
const ShuttleRoutes = ({ component: Component, ...rest }) => {
    let auth_token = localStorage.getItem('auth')
    return (
        <Route {...rest} render={props => (auth_token === "1" ?
            (<Component  {...props}/>) : (<Redirect to='/'/>))}/>
    )
};

/**
 * Set up a restricted React Routes for driver to prevent
 * unauthorized user from accessing the page from direct url
 * @param Component
 * @param rest - Rest of the parameters
 * @returns {JSX.Element} - Return customized router element
 * @constructor - Default
 */
const BusRoutes = ({ component: Component, ...rest }) => {
    let auth_token = localStorage.getItem('auth')
    return (
        <Route {...rest} render={props => (auth_token === "3" ?
            (<Component  {...props}/>) : (<Redirect to='/'/>))}/>
    )
};

/**
 * Set up a restricted React Routes for manager to prevent
 * unauthorized user from accessing the page from direct url
 * @param Component
 * @param rest - Rest of the parameters
 * @returns {JSX.Element} - Return customized router element
 * @constructor - Default
 */
const ManageRoutes = ({ component: Component, ...rest }) => {
    let auth_token = localStorage.getItem('auth')
    return (
        <Route {...rest} render={props => (auth_token === "2" ?
            (<Component  {...props}/>) : (<Redirect to='/'/>))}/>
    )
};

/**
 * Set up a restricted React Routes for account pages based on the auth_token
 * @param Component
 * @param rest - Rest of the parameters
 * @returns {JSX.Element} - Return customized router element
 * @constructor
 */
const AccountRoutes = ({ component: Component, ...rest }) => {
    let auth_token = localStorage.getItem('auth');
    // Define the allowed auth_token values for account routes
    const allowedTokens = ["0", "1", "2", "3"];
    
    return (
        <Route {...rest} render={props => (
            allowedTokens.includes(auth_token) ? (
                <Component {...props} />
            ) : (
                <Redirect to="/" />
            )
        )}/>
    );
};


/**
 * Export const variables
 */
export {
    CustomerRoutes,
    ShuttleRoutes,
    ManageRoutes,
    BusRoutes,
    AccountRoutes,
}


