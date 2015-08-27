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
       res.json(docs);
   });
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
    guideID: req.user._id
  }

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
      res.json(docs);
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

  // TODO(tfs): Query by guideID currently not functioning properly.

  // } else if ('guideID' in req.query) {
  //   var cleanID = medic.sanitize(req.query.guideID);

  //   timeslots.find({guideID: cleanID}, {}, function (err, docs) {
  //     if (err) {
  //       return res.status(500).send({error:'Lookup failed'});
  //     } else {
  //       return res.status(200).send(docs);
  //     }
  //   });

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
  console.log('hi');
  errorMessage = medic.checkKeys(req.body, ['slotID', 'responseEmail']);

  if (errorMessage != '') {
    return res.status(400).send({error:"Not enough fields specified"});
  }

  console.log('b');
  var apts = req.db.get('appointments');
  console.log('c');
  var timeslots = req.db.get('timeslots');
  console.log('d');
  var guides = req.db.get('guides');
  console.log('e');

  timeslots.find({_id: medic.sanitize(req.body.slotID)}, {}, function (err, slotResults) {
    console.log('f');
    if ((err) || (slotResults.length != 1)) { return res.status(500).send({error:'Lookup of timeslot failed'}); }
    slot = slotResults[0];
    console.log(slot);
    console.log(slot.guideID);
    console.log('halp?');
    console.log(medic.sanitize(String(slot.guideID)));
    console.log('welp');

    guides.find({_id: medic.sanitize(String(slot.guideID))}, {}, function (er, guideResults) {
      console.log('g');
      if ((err) || (guideResults.length != 1)) { return res.status(500).send({error:'Lookup of guide failed'}); }
      guide = guideResults[0];

      console.log(slot._id);
      var cleanSlotID = medic.sanitize(String(slot._id));
      console.log(cleanSlotID);
      console.log(guide._id);
      var cleanGuideID = medic.sanitize(String(guide._id));
      console.log(cleanGuideID);
      console.log(guide.email);
      var cleanGuideEmail = medic.sanitize(String(guide.email));
      console.log(cleanGuideEmail);
      console.log(req.body.responseEmail);
      var cleanEmail = medic.sanitize(String(req.body.responseEmail));
      console.log(cleanEmail);

      var newApt = {
        timeslotID: cleanSlotID,
        guideID: cleanGuideID,
        guideEmail: cleanGuideEmail,
        responseEmail: cleanEmail
      }

      apts.insert(newApt, function (e, inserted) {
        if (e) { return res.status(500).send({error:'Failed to save appointment'}); }
        return res.status(200).send('OK');
      });
    });
  });
});

module.exports = router;
