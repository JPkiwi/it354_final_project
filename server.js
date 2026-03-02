const express = require('express'); 
const dotenv = require("dotenv");

const connectMongo = require("./server/database/connect");

dotenv.config();

const app = express();
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000; 
const path = require('path');
const { connect } = require('http2');

// Static files (css, frontend js, images)
app.use(express.static("assets"));

// default directory, go to index/home page
app.get('/', (req, res) => { 
  res.sendFile(path.join(__dirname, 'index.html'));
});

// when select the login button on the index page, go to the login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// when select the signup button on the index page, go to the signup page
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'signup.html'));
});

// when enter credentials and submit on the login page, get the request body
app.post('/login', (req, res) => {
  console.log(req.body);
  res.sendStatus(202); // accepted
});

// when enter credentials and submit on the signup page, get the request body
app.post('/signup', (req, res) => {
  console.log(req.body);
  res.sendStatus(202); // accepted
});

// after hitting submit for either login or signup, go to the admin page (this will eventually change depending on the user)
app.post('/adminIndex', (req, res) => {
  console.log(req.body);
  // res.sendStatus(202); // accepted
  res.sendFile(path.join(__dirname, 'adminIndex.html'));
});

// connect to the database
connectMongo();

// listening on port
app.listen(PORT, () => { 
  console.log('Server running on port', PORT); 
}); 
