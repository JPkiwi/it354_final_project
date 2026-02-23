const express = require('express'); 

const app = express();
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000; 
const path = require('path');
app.use('/css', express.static(path.join(__dirname, 'css'))); // gets and uses css onto page by accessing css folder
app.use('/js', express.static(path.join(__dirname, 'js'))); // gets and uses js files by accessing js folder

// listening on port
app.listen(PORT, () => { 
  console.log('Server running on port', PORT); 
});  

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
