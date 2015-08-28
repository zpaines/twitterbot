var express = require('express');
var router = express.Router();
var multer = require('multer');
var photoPath = "uploads/";
var photoURL = "/picture/";
var upload = multer({dest: photoPath});
var path = require('path');
var randomstring = require('randomstring');

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
    if (e) { return res.status(500).send({error: "Error with lookup"}); }

    var toReturn = [];

    for (var i = 0; i < docs.length; i++) {
      var doc = docs[i];
      var newGuide = {
        name: medic.sanitize(doc.name),
        email: medic.sanitize(doc.email),
        major: medic.sanitize(doc.major),
        language: medic.sanitize(doc.language),
        photoPath: medic.sanitize(doc.photoPath)
      }
      toReturn.push(newGuide);
    }
    return res.status(200).send(toReturn);
  });
});

router.get('/profile', medic.requireAuth, function(req, res) {
  res.render('profile', {
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    major: req.user.major,
    language: req.user.language,
    photoPath: req.user.photoPath
  });
});

router.get('/newguide', function(req, res) {
  res.render('newguide', {title: 'Add New Guide'});
});

router.get('/guidelogin', function(req, res) {
  res.render('guideLogin', {title: 'Log in'});
});

router.post('/timeslot', medic.requireAuth, function(req, res) {
  var errorMessage = '';
  errorMessage = medic.checkKeys(req.body, ['date', 'time', 'duration']);
  
  if (errorMessage != '') {
    return res.status(400).send({error:'Missing fields'});
  }

  var newTimeslot = {
    date: medic.sanitize(req.body.date),
    time: medic.sanitize(req.body.time),
    duration: medic.sanitize(req.body.duration),
    guideEmail: req.user.email,
    randomID: medic.sanitize(randomstring.generate(35))
  }

  // Hoping that randomstring doesn't collide I guess

  var db = req.db;
  var timeslots = db.get('timeslots');

  timeslots.insert(newTimeslot, function (err, inserted) {
    if (err) {
      return res.status(500).send({error: 'Could not save timeslot'});
    } else {
      return res.status(200).send('OK');
    }
  });
});

router.get('/times', function(req, res) {
  timeslots = req.db.get('timeslots');
  timeslots.find({},{},function(err, docs) {
    if (!err) {
      var toReturn = [];

      for (var i = 0; i < docs.length; i++) {
        var doc = docs[i];

        var newTime = {
          date: medic.sanitize(doc.date),
          time: medic.sanitize(doc.time),
          duration: medic.sanitize(doc.duration),
          guideEmail: medic.sanitize(doc.guideEmail),
          randomID: medic.sanitize(doc.randomID)
        }

        toReturn.push(newTime);
      }

      return res.status(200).send(toReturn);
    } else {
      res.send(err);
    }
  });
});

router.get('/newtime', medic.requireAuth, function(req, res) {
  res.render('newtime');
});

// GET route that requires parameters (passed through url formatting - req.query, not req.body)
router.get('/guidetimes', function(req, res) {
  var timeslots = req.db.get('timeslots');

  if ('guideEmail' in req.query) {
    var cleanEmail = medic.sanitize(req.query.guideEmail);

    timeslots.find({guideEmail: cleanEmail}, {}, function (err, docs) {
      if (err) {
        return res.status(500).send({error:'Lookup failed'});
      } else {
        return res.status(200).send(docs);
      }
    });
  } else {
    timeslots.find({}, {}, function (err, docs) {
      if (err) {
        return res.status(500).send({error:'Lookup failed'});
      } else {
        return res.status(200).send(docs);
      }
    });
  }
});


router.get('/newapt', function (req, res) {
  res.render('makeapt');
});

router.post('/appointment', function (req, res) {
  var errorMessage = '';
  errorMessage = medic.checkKeys(req.body, ['slotID', 'responseEmail']);

  if (errorMessage != '') {
    return res.status(400).send({error:"Not enough fields specified"});
  }

  var apts = req.db.get('appointments');
  var timeslots = req.db.get('timeslots');
  var guides = req.db.get('guides');

  timeslots.find({randomID: medic.sanitize(req.body.slotID)}, {}, function (err, slotResults) {
    if ((err) || (slotResults.length != 1)) { return res.status(500).send({error:'Lookup of timeslot failed'}); }
    slot = slotResults[0];

    guides.find({email: medic.sanitize(String(slot.guideEmail))}, {}, function (er, guideResults) {
      if ((err) || (guideResults.length != 1)) { return res.status(500).send({error:'Lookup of guide failed'}); }
      guide = guideResults[0];

      var cleanSlotID = medic.sanitize(String(slot.randomID));
      var cleanGuideEmail = medic.sanitize(String(guide.email));
      var cleanEmail = medic.sanitize(String(req.body.responseEmail));
      var cleanRandomID = medic.sanitize(medic.hashOther(randomstring.generate(40)));

      var newApt = {
        timeslotID: cleanSlotID,
        guideEmail: cleanGuideEmail,
        responseEmail: cleanEmail,
        randomID: cleanRandomID
      }

      // Send email yay

      apts.insert(newApt, function (e, inserted) {
        if (e) { return res.status(500).send({error:'Failed to save appointment'}); }
        return res.status(200).send('OK');
      });
    });
  });
});

router.get('/appointment/:id', function (req, res) {
  var db = req.db;
  var appointments = db.get('appointments');

  var cleanID = medic.sanitize(req.params.id);

  appointments.find({randomID: cleanID}, function (err, docs) {
    if (err) { return res.status(500).send({error: "Error with appointment lookup"}); }

    var toReturn = [];

    for (var i = 0; i < docs.length; i++) {
      var doc = docs[i];

      var newApt = {
        guideID: medic.sanitize(doc.guideID),
        guideEmail: medic.sanitize(doc.guideEmail),
        responseEmail: medic.sanitize(doc.responseEmail),
        randomID: medic.sanitize(doc.randomID)
      }

      toReturn.push(newApt);
    }

    return res.status(200).send(toReturn);
  });
});

router.get('/appointments', medic.requireAuth, function (req, res) {
  var db = req.db;
  var appointments = db.get('appointments');

  var cleanEmail = medic.sanitize(req.user.email);

  var toReturn = []

  appointments.find({guideEmail: cleanEmail}, function (err, docs) {
    if (err) { return res.status(500).send({error: "Error looking up appointments"}); }

    for (var i = 0; i < docs.length; i++) {
      var doc = docs[i];

      var newApt = {
        timeslotID: medic.sanitize(doc.timeslotID),
        guideEmail: medic.sanitize(doc.guideEmail),
        responseEmail: medic.sanitize(doc.responseEmail),
        randomID: medic.sanitize(doc.randomID)
      }

      toReturn.push(newApt);
    }

    return res.status(200).send(toReturn);
  });
});

router.delete('/appointment/:id', function (req, res) {
  var db = req.db;
  var appointments = db.get('appointments');

  var cleanID = medic.sanitize(req.params.id);

  appointments.remove({randomID: cleanID}, function (err, records) {
    if (err) { return res.status(500).send({error: "Error with appointment lookup"}); }
    return res.status(200).send('OK');
  });
});

module.exports = router;
