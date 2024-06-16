global.reqlib = require('app-root-path').require
require('dotenv').config()
var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser')
var cors = require('cors')
const multer = require('multer');

var app = express();
const port = process.env.PORT || 3000;

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(multer().any())

app.use(cookieParser());
app.use('/api', require('./controllers')())

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
})
module.exports = app;
