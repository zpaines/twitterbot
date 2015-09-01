var express = require('express');
var router = express.Router();
var multer = require('multer');
var photoPath = "uploads/";
var photoURL = "/picture/";
var upload = multer({dest: photoPath});
var path = require('path');
var randomstring = require('randomstring');

var medic = require('../medic.js');
var mailer = require('../mailer.js');

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
        photoPath: doc.photoPath
      }
      toReturn.push(newGuide);
    }
    return res.status(200).send(toReturn);
  });
});

// NOTE(tfs): should probably sanitize most of this again
router.get('/profile', medic.requireAuth, function(req, res) {
  res.render('profile', {
    // id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    major: req.user.major,
    language: req.user.language,
    photoPath: req.user.photoPath
  });
});

router.get('/edit', medic.requireAuth, function (req, res) {
  res.render('edit', {
    // id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    major: req.user.major,
    language: req.user.language,
    photoPath: req.user.photoPath
  });
});

router.put('/profile', medic.requireAuth, upload.single('guidePicture'), function (req, res) {
  var updatedFields = [];

  var potentialFields = ['guideName', 'guideEmail', 'guideMajor', 'guideLanguage'];

  var toUpdate = req.user;

  if ((req.file) && (req.file.filename)) {
    var filePath = '/picture/' + medic.sanitize(req.file.filename);
    toUpdate.photoPath = filePath;
  }

  for (var i = 0; i < potentialFields.length; i++) {
    if (potentialFields[i] in req.body) {
      toUpdate[potentialFields[i]] = req.body[potentialFields[i]];
    }
  }

  var db = req.db;
  var guides = db.get('guides');

  guides.update({_id: req.user._id}, toUpdate, function (err, doc) {
    if (err) { return res.status(500).send({error:"Error accessing guide database"}); }
    return res.status(200).send('OK');
  });

});

// TODO(tfs): Cancel all appointments and timeslots
router.delete('/profile', medic.requireAuth, function (req, res) {
  var db = req.db;
  var guides = db.get('guides');

  guides.remove({_id: req.user._id}, function (e, removed) {
    if (e) { return res.status(500).send({error:"Error accessing guides database"}); }
    mailer.sendAccountDeletion(req.user);
    return res.status(200).send('OK');
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
  errorMessage = medic.checkKeys(req.body, ['date', 'time']);
  
  if (errorMessage != '') {
    return res.status(400).send({error:'Missing fields'});
  }

  var newTimeslot = {
    date: medic.sanitize(req.body.date),
    time: medic.sanitize(req.body.time),
    guideEmail: req.user.email,
    randomID: medic.sanitize(randomstring.generate(35))
  }

  // Hoping that randomstring doesn't collide I guess

  var db = req.db;
  var timeslots = db.get('timeslots');

  timeslots.find({date:newTimeslot.date, time:newTimeslot.time, guideEmail:newTimeslot.guideEmail}, {}, function (e, docs) {
    if (e) { return res.status(500).send({error:"Database error"}); }

    if (docs.length > 0) { return res.status(400).send({error: "Timeslot already exists"}); }

    timeslots.insert(newTimeslot, function (err, inserted) {
      if (err) {
        return res.status(500).send({error: 'Could not save timeslot'});
      } else {
        return res.status(200).send('OK');
      }
    });
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
        var toReturn = [];

        for (var i = 0; i < docs.length; i++) {
          var doc = docs[i];

          var newTime = {
            date: medic.sanitize(doc.date),
            time: medic.sanitize(doc.time),
            guideEmail: medic.sanitize(doc.guideEmail),
            randomID: medic.sanitize(doc.randomID)
          }

          toReturn.push(newTime);
        }
      
        return res.status(200).send(toReturn);
      }
    });
  } else {
    return res.status(400).send({error:'Bad Request'});
  }
});

router.delete('/timeslot', function (req, res) {
  var errorMessage = '';
  errorMessage = medic.checkKeys(req.body, ['randomID']);

  if (errorMessage != '') {
    return res.status(400).send({error:"Note enough fields specified"});
  }

  var db = req.db;
  var timeslots = db.get('timeslots');
  var appointments = db.get('appointments');

  appointments.find({timeslotID: medic.sanitize(req.body.randomID)}, function (e, docs) {
    if (docs.length > 0) {
      return res.status(400).send({error:"Appointment currently scheduled for this timeslot"});
    } else {
      timeslots.remove({randomID: medic.sanitize(req.body.randomID)}, {}, function (err, removed) {
        if (err) { return res.status(500).send({error: "Error with timeslot lookup"}); }
        return res.status(200).send('OK');
      });
    }
  });
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
      var cleanStartDate = medic.sanitize(String(slot.date));
      var cleanStartTime = medic.sanitize(String(slot.time));

      var newApt = {
        timeslotID: cleanSlotID,
        guideEmail: cleanGuideEmail,
        responseEmail: cleanEmail,
        randomID: cleanRandomID,
        date: cleanStartDate,
        time: cleanStartTime
      }

      apts.find({timeslotID: newApt.timeslotID}, {}, function (error, docs) {
        if (error) { return res.status(500).send({error:'Database error'}); }

        if (docs.length > 0) { return res.status(400).send({error:'Appointment already exists for specified time slot'}); }

        apts.insert(newApt, function (e, inserted) {
          if (e) { return res.status(500).send({error:'Failed to save appointment'}); }
          mailer.sendAppointmentConfirmation(newApt.responseEmail, newApt.guideEmail, newApt.date, newApt.time);
          return res.status(200).send('OK');
        });
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
        randomID: medic.sanitize(doc.randomID),
        date: medic.sanitize(doc.date),
        time: medic.sanitize(doc.time)
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
        randomID: medic.sanitize(doc.randomID),
        date: medic.sanitize(doc.date),
        time: medic.sanitize(doc.time)
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

  appointments.find({randomID: cleanID}, function (e, docs) {
    if ((e) || (docs.length == 0) || (docs.length > 1)) {
      return res.status(500).send({error:"Error looking up appointments"});
    }

    appointments.remove({randomID: cleanID}, function (err, records) {
      if (err) { return res.status(500).send({error: "Error with appointment lookup"}); }
      mailer.sendAppointmentCancelation(docs[0].responseEmail, docs[0].guideEmail, docs[0].date, docs[0].time);
      return res.status(200).send('OK');
    });
  });
});

module.exports = router;
