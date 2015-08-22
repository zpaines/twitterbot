var express = require('express');
var router = express.Router();
var multer = require('multer');
var photoPath = "uploads/";
var photoURL = "/picture/";
var upload = multer({dest: photoPath});
var path = require('path');

var medic = require('../medic.js');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/logout', medic.requireAuth, function(req, res, next) {
  res.render('logout');
});

router.get(photoURL + ':filePath', function(req,res) {
    res.sendFile(path.resolve(photoPath + req.params.filePath));
});

router.post('/upload', upload.single('file'), function(req, res) {});

router.get('/guidelist', function(req,res) {
   var db = req.db;
   var collection = db.get('guides');
   collection.find({},{},function(e,docs) {
       res.json(docs)
;    });
});

router.get('/profile', medic.requireAuth, function(req, res) {
  res.render('profile', {name: req.user.name});
});

router.get('/newguide', function(req, res) {
  res.render('newguide', {title: 'Add New Guide'});
});

router.get('/guidelogin', function(req, res) {
  res.render('guideLogin', {title: 'Log in'});
});

router.post('/timeslot', medic.requireAuth, function(req, res) {
  medic.checkKeys(req.body, ['date', 'time', 'duration']);
  var newTimeslot = {
    date: medic.sanitize(req.body.date),
    time: medic.sanitize(req.body.time),
    duration: medic.sanitize(req.body.duration),
    guideID: req.user._id
  }

  var db = req.db;
  var timeslots = db.get('timeslots');

  timeslots.insert(newTimeslot, function (err, inserted) {
    if (err) {
      res.status(500);
    } else {
      res.status(200);
    }
  });
});

router.get('/times', function(req, res) {
  timeslots = req.db.get('timeslots');
  timeslots.find({},{},function(err, docs) {
    if (!err) {
      res.json(docs);
    } else {
      res.send(err);
    }
  });
});

router.get('/newtime', medic.requireAuth, function(req, res) {
  res.render('newtime');
});

module.exports = router;
