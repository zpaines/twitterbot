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

router.get(photoURL + ':filePath', function(req,res) {
    res.sendFile(path.resolve(photoPath + req.params.filePath));
});

router.post('/upload', upload.single('file'), function(req, res) {
    console.log(req.file);
});

router.get('/guidelist', function(req,res) {
   var db = req.db;
   var collection = db.get('guides');
   collection.find({},{},function(e,docs) {
       console.log(docs);
       res.json(docs)
;    });
});

/*router.get('/guides/:category/:', function(req, res) {
  var splitCriteria = filterCriteria

}*/

router.post('/addguide', upload.single('guidePicture'), function(req, res) {
  console.log(req.file);
    var db = req.db;
    var guideName = medic.sanitize(req.body.guideName);
    var guideEmail = medic.sanitize(req.body.guideEmail);
    var guideMajor = medic.sanitize(req.body.guideMajor);
    var guideLanguage = medic.sanitize(req.body.guideLanguage);
    var guidePhotoName = medic.sanitize(req.file.filename);
    var collection = db.get('guides');
    console.log(guidePhotoName);
    collection.insert({
        "guide": guideName,
        "email":guideEmail,
        "major":guideMajor,
        "language":guideLanguage,
        "photoPath":photoURL + guidePhotoName,
    }, function(err, doc) {
        if (err) {
            res.send("Error");
        } else {
            console.log(doc);
            res.redirect("guidelist");
        }
    });
});

router.get('/newguide', function(req, res) {
    res.render('newguide', {title: 'Add New Guide'});
});

module.exports = router;
