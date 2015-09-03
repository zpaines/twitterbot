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
		text: "Hi! You have an new guide appointment on " + date + " at " + time + ". We're looking forward to seeing you!",
		html: "<html>Hi! You have an new guide appointment on " + date + " at " + time + ". We're looking forward to seeing you!</html>"
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
		subject: "Appointment Canceled",
		text: "Hello. Unfortunately your appointment for " + date + " at " + time + " has been canceled.",
		html: "<html>Hello. Unfortunately your appointment for " + date + " at " + time + " has been canceled. </html>"
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
		text: "Hi. " + guideObject.name +" has requested to be registered as a guide. \n Their email address is " + guideObject.email + " and their major is " + guideObject.major +". \n http://localhost:3000/admin/activate/" + guideObject.email + "/" + secretID + " Click Here to Activate Their Profile",
		html: "<html>Hi. " + guideObject.name +" has requested to be registered as a guide. <br> Their email address is " + guideObject.email + " and their major is " + guideObject.major +". <br> <a href=http://localhost:3000/admin/activate/" + guideObject.email + "/" + secretID + "> Click Here to Activate Their Profile </a></html>"
	}

	var guideOptions = {
		from: "College Connect JHU <collegeconnect.jhu@gmail.com>",
		to: guideObject.email,
		subject: "Registration Confirmation",
		text: "Thank you for applying, please wait for an admin to activate your account",
		html: "<html>Thanks for applying to be a guide! Please wait for an admin to activate your account. You'll receive an email when that happens. </html>"
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
		html: "<html>Hi " + guideObject.name + "! Your account has been activated. Get started at http://localhost:3000/profile </html>"
	}

	transporter.sendMail(mailOptions, function (error, info) {
		if (error) {
			return console.log(error);
		}
	});
}
