const express = require('express'); 

const app = express();
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000; 
const path = require('path');
app.use('/css', express.static(path.join(__dirname, 'css'))); // gets css onto page by accessing css folder
app.use('/js', express.static(path.join(__dirname, 'js'))); // gets js files by accessing js folder

app.listen(PORT, () => { 
  console.log('Server running on port', PORT); 
});  

app.get('/', (req, res) => { 
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/login', (req, res) => {
  console.log(req.body);
  res.sendStatus(202); // accepted
});
