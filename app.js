var express = require('express');
var path = require('path');
var fs = require('fs');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var medic = require('./medic.js');

// Auth packages
var session = require('express-session');
var MongoStore = require('connect-mongostore')(session);
var passport = require('passport');
var LocalStrategy = require('passport-local');

var mongo = require('mongodb');
var monk = require('monk');
var dbURI = process.env.MONGO_URI || 'localhost:27017/tours'
var db = monk(dbURI);

// Setup app
var routes = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Setup Sessions and Passport
var dbSettings = {}
if (dbURI != 'localhost:27017/tours') {
  // TODO(tfs): Implement non-localhost database hosting
  dbSettings.db = 'sessions';
} else {
  dbSettings.db = 'sessions';
}

app.use(session({
    secret: process.env.SECRET || "we are weak",
    name: "spicy-cookie",
    store: new MongoStore(dbSettings),
    proxy: true,
    resave: true,
    saveUninitialized: true
  })
);

passport.use(new LocalStrategy({
    usernameField: 'email'
  },
  function (email, password, done) {
    var guides = db.get('guides');
    guides.find({ 'email': email }, function (err, data) {
      if (err) {
        return done(err);
      }

      if (data.length == 0) {
        return done(null, false, { message: 'Incorrect username' });
      } else if (data.length == 1) {
        if (medic.validateUser(data[0], password)) {
          console.log('success');
          return done(null, data[0]);
        } else {
          console.log('failure');
          return done(null, false, { message: 'Incorrect password' });
        }
      } else if (data.length > 1) {
        return done(null, false, { message: 'Error: Multiple users found' });
      } else {
        return done(null, false, { message: 'Error: Internal error' });
      }
    });
  }
));


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(function(req,res,next) {
    req.db = db;
    next();
});

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
