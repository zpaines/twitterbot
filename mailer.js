var nodemailer = require('nodemailer');

var exports = module.exports = {};

// Setup nodemailer
var transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.GMAILUSER,
    pass: process.env.GMAILPASS
  }
});

exports.transporter = transporter;

exports.sendAppointmentConfirmation = function (userEmail, guideEmail, date, time) {
	var recipientString = userEmail + ", " + guideEmail;

	var mailOptions = {
		from: "College Connect JHU <collegeconnectjhu@gmail.com>",
		to: recipientString,
		subject: "Appointment Scheduled",
		text: "HI",
		html: "<html>HI</html>"
	}

	transporter.sendMail(mailOptions, function (error, info) {
		if (error) {

			return console.log(error);
		}
	});
}

exports.sendAppointmentCancelation = function (userEmail, guideEmail, date, time) {
	var recipientString = userEmail + ", " + guideEmail;

	var mailOptions = {
		from: "College Connect JHU <collegeconnect.jhu@gmail.com>",
		to: recipientString,
		subject: "Appointment Scheduled",
		text: "HI",
		html: "<html>HI</html>"
	}

	transporter.sendMail(mailOptions, function (error, info) {
		if (error) {
			return console.log(error);
		}
	});
}

exports.sendGuideSignup = function (guideObject, secretID) {
	console.log('-------');
	console.log(secretID);
	console.log('-------');
	var adminOptions = {
		from: "College Connect JHU <collegeconnect.jhu@gmail.com>",
		to: process.env.ADMINEMAIL,
		subject: "Guide Registration",
		text: "Hi",
		html: "<html>Hi</html>"
	}

	var guideOptions = {
		from: "College Connect JHU <collegeconnect.jhu@gmail.com>",
		to: guideObject.email,
		subject: "Registration Confirmation",
		text: "Thank you for applying, please wait for an admin to activate your account",
		html: "<html>Hi</html>"
	}

	transporter.sendMail(adminOptions, function (error, info) {
		if (error) {
			return console.log(error);
		}
	});

	transporter.sendMail(guideOptions, function (error, info) {
		if (error) {
			return console.log(error);
		}
	});
}

exports.sendGuideActivation = function (guideObject) {
	var mailOptions = {
		from: "College Connect JHU <collegeconnect.jhu@gmail.com>",
		to: guideObject.email,
		subject: "Account Activated",
		text: "Hi",
		html: "<html>Hi</html>"
	}

	transporter.sendMail(mailOptions, function (error, info) {
		if (error) {
			return console.log(error);
		}
	});
}
