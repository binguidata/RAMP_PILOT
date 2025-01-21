import React, { Component } from 'react';
import { 
    Button, Checkbox, Container, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Grid, 
    Paper, Table, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography
} from '@material-ui/core';

import { fetchGet, fetchPost, fetchPut, fetchDelete } from "./request";
import { Sidebar } from "../components/sidebar";
import '../styles/style.css';


class DialinUsersPage extends Component {

    constructor(props) {
        super(props);
        this.state = {
            users: [],
            searchQuery: '',
            page: 0,
            rowsPerPage: 10,
            editingUser: null,
            editDialogOpen: false,
            saveSuccess: false,
            addDialogOpen: false,
            newUserData: {
                first_name: '',
                last_name: '',
                username: '',
                cellphone_number: '',
                email_address: '',
                signed_consent: false,
            },
            latestNewUser: null,
            showLatestNewUserCard: false,
            deleteDialogOpen: false,
            userIdToDelete: null,
        };
        this.handleConfirmDelete = this.handleConfirmDelete.bind(this);
    };
    
    componentDidMount() {
        this.fetchData();
    };

    fetchData = () => {
        fetchGet('/api/dialin-users/view', {}, data => {
            this.setState({ users: data });
        });
    };

    handleSearchChange = event => {
        this.setState({ searchQuery: event.target.value });
    };

    handleChangePage = (event, newPage) => {
        this.setState({ page: newPage });
    };

    handleChangeRowsPerPage = event => {
        this.setState({ rowsPerPage: +event.target.value, page: 0 });
    };

    handleEdit = (id) => {
        const user = this.state.users.find(user => user.id === id);
        this.setState({ editingUser: user, editDialogOpen: true });
    };

    handleEditDialogClose = () => {
        this.setState({ editDialogOpen: false });
    };

    handleCloseEditDialog = () => {
        this.setState({ editDialogOpen: false });
    };

    handleSaveChanges = () => {
        const { editingUser, users } = this.state;
        const existingCellphone = users.some((user) => user.id !== editingUser.id && user.cellphone_number === editingUser.cellphone_number);
        const existingEmailAddress = users.some((user) => user.id !== editingUser.id && user.email_address === editingUser.email_address);
        if (!editingUser.first_name || !editingUser.last_name || !editingUser.cellphone_number || !editingUser.email_address || !editingUser.username) {
            alert("Please fill in all required fields.");
            return;
        }
        if (editingUser.cellphone_number.length !== 10 || isNaN(editingUser.cellphone_number)) {
            alert("Please enter a valid 10-digit cellphone number.");
            return;
        }
        if (existingCellphone) {
            alert("This cellphone number has been used in another accout.");
            return;
        }
        if (existingEmailAddress) {
            alert("This email address has been used in another accout.");
            return;
        }
        fetchPut(`/api/dialin-users/update/${editingUser.id}/`, editingUser, () => {
            this.setState({ editDialogOpen: false, saveSuccess: true });
            this.fetchData();
            setTimeout(() => {
                this.setState({ saveSuccess: false });
            }, 2000);
        });
    };    

    handleAddDialogOpen = () => {
        this.setState({ addDialogOpen: true });
    };

    handleAddDialogClose = () => {
        this.setState({ addDialogOpen: false });
    };

    handleAddNewUser = () => {
        const { newUserData, users } = this.state;
    
        // Check if the cellphone number or username already exist
        const existingCellphone = users.some(user => user.cellphone_number === newUserData.cellphone_number);
        const existingUsername = users.some(user => user.username === newUserData.username);
        const existingEamilAddress = users.some(user => user.email_address === newUserData.email_address);
    
        if (existingCellphone) {
            alert("Cellphone number already exists. Please choose a different one.");
            return;
        }
        if (existingUsername) {
            alert("Username already exists. Please choose a different one.");
            return;
        }
        if (existingEamilAddress) {
            alert("Email address already exists. Please choose a different one.");
            return;
        }
        if (!newUserData.first_name || !newUserData.last_name || !newUserData.cellphone_number || !newUserData.username || !newUserData.email_address) {
            alert("Please fill in all required fields.");
            return;
        }
        if (newUserData.cellphone_number.length !== 10 || isNaN(newUserData.cellphone_number)) {
            alert("Please enter a valid 10-digit cellphone number.");
            return;
        }
        
        fetchPost(`/api/dialin-users/create/`, newUserData, () => {
            this.setState({ addDialogOpen: false, latestNewUser: newUserData, showLatestNewUserCard: true });
            this.fetchData();
        });
    };
    
    handleExitLatestNewUserCard = () => {
        this.setState({ showLatestNewUserCard: false });
    };
    
    handleInputChange = (event) => {
        const { name, value } = event.target;
        this.setState(prevState => ({
            newUserData: {
                ...prevState.newUserData,
                [name]: value
            }
        }));
    };

    handleDelete = (id) => {
        this.setState({ deleteDialogOpen: true, userIdToDelete: id });
    };

    handleDeleteDialogClose = () => {
        this.setState({ deleteDialogOpen: false });
    };

    handleConfirmDelete = () => {
        const { userIdToDelete } = this.state;
        fetchDelete(`/api/dialin-users/delete/${userIdToDelete}/`, () => {
            this.setState({ deleteDialogOpen: false, userIdToDelete: null });
            this.fetchData();
        });
    };

    render() {
        const { 
            users, searchQuery, page, rowsPerPage, editingUser, editDialogOpen, 
            saveSuccess, addDialogOpen, newUserData, latestNewUser, showLatestNewUserCard, 
            deleteDialogOpen, userIdToDelete, 
        } = this.state;

        const filteredUsers = users.filter(user =>
            user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.cellphone_number.includes(searchQuery) ||
            user.email_address.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return (
            <Container maxWidth="xl">
                <Sidebar username={localStorage.getItem('username')} />
                <Grid container spacing={2} className="dialin-grid">
                    <Grid item xs={12} sm={12} md={12} lg={12}>
                        <br/>
                        <Typography
                            component="h1"
                            variant="h4"
                            align="center"
                            color="text.primary"
                            gutterBottom
                        >
                            Dial-in Users
                        </Typography>
                    </Grid>
                    <Container maxWidth="xl">
                    <Grid item xs={12} sm={12} md={12} lg={12}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={this.handleAddDialogOpen}
                        >
                            Add New User
                        </Button>
                        <br></br><br></br>
                        <TextField
                            label="Search"
                            variant="outlined"
                            value={searchQuery}
                            onChange={this.handleSearchChange}
                            style={{ marginBottom: '16px' }}
                        />
                        <Paper>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell align="center"><strong>First Name</strong></TableCell>
                                            <TableCell align="center"><strong>Last Name</strong></TableCell>
                                            <TableCell align="center"><strong>Cellphone Number</strong></TableCell>
                                            <TableCell align="center"><strong>Email Address</strong></TableCell>
                                            <TableCell align="center"><strong>Username</strong></TableCell>
                                            <TableCell align="center"><strong>Consent</strong></TableCell>
                                            <TableCell align="center"><strong>Edit</strong></TableCell>
                                            <TableCell align="center"><strong>Delete</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <tbody>
                                        {filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(user => (
                                            <TableRow key={user.id}>
                                                <TableCell align="center" className={user.signed_consent ? 'signed-row' : ''}>{user.first_name}</TableCell>
                                                <TableCell align="center" className={user.signed_consent ? 'signed-row' : ''}>{user.last_name}</TableCell>
                                                <TableCell align="center" className={user.signed_consent ? 'signed-row' : ''}>{user.cellphone_number}</TableCell>
                                                <TableCell align="center" className={user.signed_consent ? 'signed-row' : ''}>{user.email_address}</TableCell>
                                                <TableCell align="center" className={user.signed_consent ? 'signed-row' : ''}>{user.username}</TableCell>
                                                <TableCell align="center" className={user.signed_consent ? 'signed-row' : ''}>{user.signed_consent ? 'Signed' : 'Not yet'}</TableCell>
                                                <TableCell align="center">
                                                    <Button variant="contained" color="primary" onClick={() => this.handleEdit(user.id)}>Edit</Button>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Button variant="contained" color="primary" onClick={() => this.handleDelete(user.id)}>Delete</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </tbody>
                                </Table>
                            </TableContainer>
                            <TablePagination
                                rowsPerPageOptions={[5, 10, 20]}
                                component="div"
                                count={filteredUsers.length}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                onPageChange={this.handleChangePage}
                                onRowsPerPageChange={this.handleChangeRowsPerPage}
                            />
                        </Paper>
                    </Grid>
                    <br/>
                    <Grid item xs={12} sm={12} md={12} lg={12}>
                        <div className='home-text'>
                            <Typography variant="body1" component="p" gutterBottom>
                                Newly registered dial-in users can book their first trip using the dial-in service. 
                                However, they must submit their signed consent form to the driver when boarding. 
                                Existing users who have not yet provided a consent form will not be able to book a trip until they submit the required signed form.
                            </Typography>
                        </div>
                    </Grid>
                    </Container>
                    <Dialog open={editDialogOpen} onClose={this.handleCloseEditDialog}>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogContent>
                            <TextField
                                label="First Name"
                                value={editingUser ? editingUser.first_name : ''}
                                onChange={(e) => this.setState({ editingUser: { ...editingUser, first_name: e.target.value } })}
                                fullWidth
                            />
                            <TextField
                                label="Last Name"
                                value={editingUser ? editingUser.last_name : ''}
                                onChange={(e) => this.setState({ editingUser: { ...editingUser, last_name: e.target.value } })}
                                fullWidth
                            />
                            <TextField
                                label="Cellphone Number"
                                value={editingUser ? editingUser.cellphone_number : ''}
                                onChange={(e) => this.setState({ editingUser: { ...editingUser, cellphone_number: e.target.value } })}
                                fullWidth
                            />
                            <TextField
                                label="Email Address"
                                value={editingUser ? editingUser.email_address : ''}
                                onChange={(e) => this.setState({ editingUser: { ...editingUser, email_address: e.target.value } })}
                                fullWidth
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={editingUser ? editingUser.signed_consent : false}
                                        onChange={(e) => this.setState({ editingUser: { ...editingUser, signed_consent: e.target.checked } })}
                                    />
                                }
                                label="Signed Consent"
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={this.handleEditDialogClose} color="primary">Cancel</Button>
                            <Button onClick={this.handleSaveChanges} color="primary">Save</Button>
                        </DialogActions>
                        {saveSuccess && (
                            <DialogContent>
                                <Typography variant="body2">Information modified successfully.</Typography>
                            </DialogContent>
                        )}
                    </Dialog>

                    <Dialog open={addDialogOpen} onClose={this.handleAddDialogClose}>
                        <DialogTitle>Add New User</DialogTitle>
                        <DialogContent>
                            <TextField
                                label="First Name"
                                name="first_name"
                                value={newUserData.first_name}
                                onChange={this.handleInputChange}
                                fullWidth
                                required
                            />
                            <TextField
                                label="Last Name"
                                name="last_name"
                                value={newUserData.last_name}
                                onChange={this.handleInputChange}
                                fullWidth
                                required
                            />
                            <TextField
                                label="Cellphone Number"
                                name="cellphone_number"
                                value={newUserData.cellphone_number}
                                onChange={this.handleInputChange}
                                fullWidth
                                required
                            />
                            <TextField
                                label="Email Address"
                                name="email_address"
                                value={newUserData.email_address}
                                onChange={this.handleInputChange}
                                fullWidth
                                required
                            />
                            <TextField
                                label="Username"
                                name="username"
                                value={newUserData.username}
                                onChange={this.handleInputChange}
                                fullWidth
                                required
                            />
                        </DialogContent>
                        <br/>
                        <Grid className='new_user_car'>
                            <Typography variant="body2" gutterBottom fontWeight="bold">
                                <strong>Important Reminder</strong>
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                                <strong>
                                    Don't forget to bring the signed consent form with you! If you haven't signed it yet, 
                                    you can also ask the driver for a copy and sign it before boarding.
                                </strong>
                            </Typography>
                        </Grid>
                        <br/>
                        <DialogActions>
                            <Button onClick={this.handleAddDialogClose} color="primary">Cancel</Button>
                            <Button onClick={this.handleAddNewUser} color="primary">Save</Button>
                        </DialogActions>
                    </Dialog>

                    {showLatestNewUserCard && (
                        <Dialog open={showLatestNewUserCard} onClose={this.handleExitLatestNewUserCard}>
                            <DialogTitle>New Dial-in User</DialogTitle>
                            <DialogContent>
                                <Typography>First Name: {latestNewUser.first_name}</Typography>
                                <Typography>Last Name: {latestNewUser.last_name}</Typography>
                                <Typography>Username: {latestNewUser.username}</Typography>
                                <Typography>Cellphone Number: {latestNewUser.cellphone_number}</Typography>
                                <Typography>Email Address: {latestNewUser.email_address}</Typography>
                            </DialogContent>
                            <br/>
                            <Grid className='new_user_car'>
                                <Typography variant="body2" gutterBottom fontWeight="bold">
                                    <strong>Important Reminder</strong>
                                </Typography>
                                <Typography variant="body2" gutterBottom>
                                    <strong>
                                        Don't forget to bring the signed consent form with you! If you haven't signed it yet, 
                                        you can also ask the driver for a copy and sign it before boarding.
                                    </strong>
                                </Typography>
                            </Grid>
                            <DialogActions>
                                <Button onClick={this.handleExitLatestNewUserCard}>OK</Button>
                            </DialogActions>
                        </Dialog>
                    )}

                    <Dialog open={deleteDialogOpen} onClose={this.handleDeleteDialogClose}>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogContent>
                            <Typography>Are you sure you want to delete this user?</Typography>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={this.handleDeleteDialogClose} color="primary">Cancel</Button>
                            <Button onClick={this.handleConfirmDelete} color="secondary">Confirm</Button>
                        </DialogActions>
                    </Dialog>

                </Grid>
            </Container>
        );
    }
}


export default DialinUsersPage;
