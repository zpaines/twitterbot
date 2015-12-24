var express = require('express');
var router = express.Router();
var multer = require('multer');
var photoPath = "uploads/";
var photoURL = "/picture/";
var upload = multer({dest: photoPath});
var path = require('path');
var randomstring = require('randomstring');
var stripe = require('stripe')(process.env.STRIPEKEY);

var medic = require('../medic.js');
var mailer = require('../mailer.js');

router.post('/guideSignup', upload.single('guidePicture'), function (req, res) {
  var passport = req.passport;
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
router.post('/login', function(req, res, next) {
  var passport = req.passport;
  passport.authenticate('local', function(err, user, info) {
    if (err) { console.log('a'); return next(err); }
    if (!user) { console.log('b'); return res.status(215).send({error:'Not authorized'}); }
    req.logIn(user, function(err) {
      if (err) { console.log('c'); return next(err); }
      console.log('d'); return res.status(200).send('OK');
    });
  })(req, res, next);
});

router.get('/logout', function (req, res) {
  if (req.isAuthenticated()) {
    req.logout();
  }
  res.redirect('/guideLogin');
});

router.get('/admin/activate/:email/:secret', function (req, res) {
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

router.get('/appointmentInfo/:id', function (req, res) {
  var db = req.db;
  var appointments = db.get('appointments');

  var cleanID = medic.sanitize(req.params.id);

  appointments.find({randomID: cleanID}, function (err, docs) {
    if (err) { return res.status(500).send({error: "Error with appointment lookup"}); }

    var toReturn = [];

    if (docs.length > 1) {
      return res.status(500).send({error:"Conflicting IDs"});
    } else if (docs.length < 1) {
      return res.status(500).send({error:"Appointment Not Found"});
    }

    var doc = docs[0];

    return res.status(200).send({
      guideID: medic.sanitize(doc.guideID),
      guideEmail: medic.sanitize(doc.guideEmail),
      guideName: medic.sanitize(doc.guideName),
      date: doc.date,
      time: doc.time,
      appointmentID: cleanID
    });
  });
});

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
  return res.status(200).send({
    name: req.user.name,
    email: req.user.email,
    major: req.user.major,
    language: req.user.language,
    photoPath: req.user.photoPath,
    isActivated: req.user.isActivated
  });
});

// Should just use (/api)/profile
// router.get('/edit', medic.requireAuth, function (req, res) {
//   res.render('edit', {
//     name: req.user.name,
//     email: req.user.email,
//     major: req.user.major,
//     language: req.user.language,
//     photoPath: req.user.photoPath,
//     isActivated: req.user.isActivated
//   });
// });

router.put('/profile', medic.requireAuth, upload.single('guidePicture'), function (req, res) {
  var updatedFields = [];

  var potentialFields = ['guideName', 'guideMajor', 'guideLanguage'];
  var potentialFieldNames = ['name', 'major', 'language'];

  var toUpdate = req.user;

  if ((req.file) && (req.file.filename)) {
    var filePath = '/picture/' + medic.sanitize(req.file.filename);
    toUpdate.photoPath = filePath;
  }

  for (var i = 0; i < potentialFields.length; i++) {
    if (potentialFields[i] in req.body) {
      toUpdate[potentialFieldNames[i]] = req.body[potentialFields[i]];
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

router.post('/timeslot', medic.requireAuth, medic.requireActivation, function(req, res) {
  var errorMessage = '';
  errorMessage = medic.checkKeys(req.body, ['date', 'time']);
  
  if (errorMessage != '') {
    return res.status(400).send({error:'Missing fields'});
  }

  var newTimeslot = {
    date: medic.sanitize(Date.parse(String(req.body.date))),
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

router.delete('/timeslot', medic.requireAuth, medic.requireActivation, function (req, res) {
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
      timeslots.find({randomID: medic.sanitize(req.body.randomID)}, function (er, docs) {
        if (docs.length != 1) { return res.status(400).send({error:"Could not find timeslot to delete"}); }
        if (docs[0].guideEmail != req.user.email) { return res.status(403).send({error:"Not authorized to delete this timeslot"}); }
        timeslots.remove({randomID: medic.sanitize(req.body.randomID)}, {}, function (err, removed) {
          if (err) { return res.status(500).send({error: "Error with timeslot lookup"}); }
          return res.status(200).send('OK');
        });
      });
    }
  });
});

router.post('/appointment', function (req, res) {
  var errorMessage = '';
  errorMessage = medic.checkKeys(req.body, ['slotID', 'responseEmail', 'payToken']);

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
      var cleanGuideName = medic.sanitize(String(guide.name));
      var cleanEmail = medic.sanitize(String(req.body.responseEmail));
      var cleanRandomID = medic.sanitize(medic.hashOther(randomstring.generate(40)));
      var cleanStartDate = medic.sanitize(String(slot.date));
      var cleanStartTime = medic.sanitize(String(slot.time));
      var cleanToken = medic.sanitize(String(req.body.payToken));

      // Verify stripe token
      stripe.tokens.retrieve(cleanToken, function (tokerr, tokenObj) {
        if (tokerr) { return res.status(400).send("Error with card payment"); }

        console.log(tokenObj);

        var newApt = {
          timeslotID: cleanSlotID,
          guideEmail: cleanGuideEmail,
          guideName: cleanGuideName,
          responseEmail: cleanEmail,
          randomID: cleanRandomID,
          date: cleanStartDate,
          time: cleanStartTime,
          payToken: cleanToken
        }

        apts.find({timeslotID: newApt.timeslotID}, {}, function (error, docs) {
          if (error) { return res.status(500).send({error:'Database error'}); }

          if (docs.length > 0) { return res.status(400).send({error:'Appointment already exists for specified time slot'}); }

          apts.insert(newApt, function (e, inserted) {
            if (e) { return res.status(500).send({error:'Failed to save appointment'}); }
            mailer.sendAppointmentConfirmation(newApt.responseEmail, newApt.guideEmail, newApt.date, newApt.time, cleanRandomID);
            return res.status(200).send('OK');
          });
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
