var express = require('express');
var path = require('path');
var fs = require('fs');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var medic = require('./medic.js');
var mailer = require('./mailer.js');
var multer = require('multer');
var photoPath = "uploads/";
var upload = multer({dest: photoPath});
var randomstring = require('randomstring');

// Auth packages
var session = require('express-session');
var MongoStore = require('connect-mongostore')(session);
var passport = require('passport');
var LocalStrategy = require('passport-local');

var mongo = require('mongodb');
var monk = require('monk');
var dbURI = process.env.MONGO_URI || 'localhost:27017/tours'
var db = monk(dbURI);

// Uploading files (guide pictures)
var upload = multer({dest: photoPath});

// Setup app
var api = require('./routes/api');
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
          return done(null, data[0]);
        } else {
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

passport.serializeUser(function (guide, done) {
  done(null, guide._id);
});

passport.deserializeUser(function (id, done) {
  var guides = db.get('guides');

  guides.findById(id, function (err, guide) {
    done(err, guide);
  });
});

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(passport.initialize());
app.use(passport.session());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(function(req,res,next) {
    req.db = db;
    next();
});

app.post('/guideSignup', upload.single('guidePicture'), function (req, res) {
  var errorMessage = medic.checkKeys(req.body, ['guideName', 'guideEmail', 'guideMajor', 'guideLanguage', 'guidePassword', 'guidePasswordConfirm']);

  if (errorMessage != '') {
    return res.status(500).send({error: "Missing fields"});
  }

  var raw1 = medic.sanitize(req.body.guidePassword);
  var raw2 = medic.sanitize(req.body.guidePasswordConfirm);

  var p1 = medic.hashPass(raw1);
  var p2 = medic.hashPass(raw2);

  var randomID = randomstring.generate(30);

  if (p1 != p2) {
    res.status(500).send({error: 'Error Passwords Don\'t match'});
    return;
  }

  if ((req.file == undefined) || (req.file.filename == undefined)) {
    errorMessage += "No picture provided;";
  }

  if (errorMessage == '') {
    var db = req.db;
    var guides = db.get('guides');

    guides.find({ email: medic.sanitize(req.body.guideEmail) }, function (error, docs) {
      if (docs.length > 0) {
        return res.json({ error: "That username exists already." });
      } else {
        var newGuide = {
          name: medic.sanitize(req.body.guideName),
          email: medic.sanitize(req.body.guideEmail),
          major: medic.sanitize(req.body.guideMajor),
          language: medic.sanitize(req.body.guideLanguage),
          photoPath: '/picture/' + medic.sanitize(req.file.filename),
          hashedPassword: p1,
          hashedRandomID: medic.hashOther(randomID),
          isActivated: false
        };

        guides.insert(newGuide, function (err, inserted) {
          if (!err) {
            req.logIn(inserted, function (err) {
              if (err) {
                return res.status(500).send({error: 'Error logging in new user; User saved.'});
              } else {
                mailer.sendGuideSignup(newGuide, randomID);
                return res.redirect('/profile');
              }
            });
          } else {
            return res.status(500).send({error: 'Could not save account information'});
          }
        });
      }
    });
  } else {
    return res.status(400).send({error:errorMessage});
  }
});

// From passport's site
app.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { console.log('a'); return next(err); }
    if (!user) { console.log('b'); return res.status(215).send({error:'Not authorized'}); }
    req.logIn(user, function(err) {
      if (err) { console.log('c'); return next(err); }
      console.log('d'); return res.status(200).send('OK');
    });
  })(req, res, next);
});

app.get('/logout', function (req, res) {
  if (req.isAuthenticated()) {
    req.logout();
  }
  res.redirect('/guideLogin');
});

app.get('/admin/activate/:email/:secret', function (req, res) {
  secretID = medic.sanitize(req.params.secret);
  cleanEmail = medic.sanitize(req.params.email);

  var db = req.db;
  var guides = db.get('guides');

  guides.find({email: cleanEmail}, function (err, docs) {
    if (docs.length > 1) {
      return res.status(400).send({error: "Multiple entries with specified email found"});
    } else if (docs.length == 0) {
      return res.status(400).send({error: "No entries with specified email found"});
    } else {
      if (medic.hashOther(secretID) != docs[0].hashedRandomID) {
        return res.status(215).send({error: "Invalid secret ID"});
      } else {
        newGuide = docs[0];
        console.log(newGuide);
        newGuide.isActivated = true;
        guides.update({email: cleanEmail}, newGuide, function (e, doc) {
          if (err) { return res.status(500).send({error:"Error accessing guide database"}); }
          mailer.sendGuideActivation(docs[0]);
          return res.status(200).send('Account Activated');
        });
      }
    }
  });
});

app.use('/api', api);
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
