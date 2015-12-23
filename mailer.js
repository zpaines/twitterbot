var nodemailer = require('nodemailer');
var xoauth2 = require('xoauth2');

var exports = module.exports = {};

// Setup xoauth2
var generator = xoauth2.createXOAuth2Generator({
	user: process.env.GMAILUSER,
	clientID: process.env.GMAILCLIENTID,
	clientSecret: process.env.GMAILCLIENTSECRET,
	refreshToken: process.env.GMAILREFRESH
});

// Listen for tokens
generator.on('token', function(token) {
	console.log('New token for %s: %s', token.user, token.accessToken);
});

// Login
var transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: process.env.GMAILUSER,
		pass: process.env.GMAILPASS,
		xoauth2: generator
	}
});

// Setup nodemailer
// var transporter = nodemailer.createTransport({
//   service: 'Gmail',
//   auth: {
//     user: process.env.GMAILUSER,
//     pass: process.env.GMAILPASS
//   }
// });

// Setup nodemailer with XOAuth2
// var transporter = nodemailer.createTransport({
// 	service: "Gmail",
// 	auth: {
// 		XOAuth2: {
// 			user: process.env.GMAILUSER,
// 			clientId: process.env.GMAILCLIENTID,
// 			clientSecret: process.env.GMAILCLIENTSECRET,
// 			refreshToken: process.env.GMAILREFRESH
// 		}
// 	}
// })

exports.transporter = transporter;

exports.sendAppointmentConfirmation = function (userEmail, guideEmail, date, time, aptID) {
	var recipientString = userEmail + ", " + guideEmail;

	var mailOptions = {
		from: "College Connect JHU <collegeconnectjhu@gmail.com>",
		to: recipientString,
		subject: "Appointment Scheduled",
		text: "Hi! You have an new guide appointment on " + date + " at " + time + ". We're looking forward to seeing you!",
		html: "<html>Hi! You have an new guide appointment on " + date + " at " + time + ". We're looking forward to seeing you! <br> </html>"
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

exports.sendGuideSignup = function (guideObject, secretID, hostName) {
	console.log('-------');
	console.log(secretID);
	console.log('-------');
	var adminOptions = {
		from: "College Connect JHU <collegeconnect.jhu@gmail.com>",
		to: process.env.ADMINEMAIL,
		subject: "Guide Registration",
		text: "Hi. " + guideObject.name +" has requested to be registered as a guide. \n Their email address is " + guideObject.email + " and their major is " + guideObject.major +". \n http://localhost:3000/admin/activate/" + guideObject.email + "/" + secretID + " Click Here to Activate Their Profile",
		html: "<html>Hi. " + guideObject.name +" has requested to be registered as a guide. <br> Their email address is " + guideObject.email + " and their major is " + guideObject.major +". <br> <a href=" + hostName + "/" + guideObject.email + "/" + secretID + "> Click Here to Activate Their Profile </a></html>"
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
