var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const dotenv = require('dotenv');
const passport = require('passport');
const helmet = require("helmet");
const cors = require('cors');
const { sendEmail } = require('./utils/ses');

var app = express();

//set enviorment for app
dotenv.config({ path: './.env' });
//connect database
require('./services/config/db')();

// view engine setup
app.set('views', path.join(__dirname, '/views'));

app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH']
}));
app.use(helmet({
  contentSecurityPolicy: false, //disable the content policy to load images on admin
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../public/dist')));
app.use(passport.initialize());

//** Passport Authentication */
require('./services/middleware/passport.middleware');

// pass the instance of our app to the routes.
require("./routes/index.route")(app);

//to serve the build of tradesk admin
app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname, '../public/dist', 'index.html'));
});
app.get('/checkmate', function(req,res){
  
    res.send("Hello Users !!")
})



// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {

  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('index');
});

module.exports = app;
