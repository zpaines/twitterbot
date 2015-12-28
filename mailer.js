// var nodemailer = require('nodemailer');
// var xoauth2 = require('xoauth2');
var sendgrid = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);

var exports = module.exports = {};


// sendgrid.send({
//   to:       'example@example.com',
//   from:     'other@example.com',
//   subject:  'Hello World',
//   text:     'My first email through SendGrid.'
// }, function(err, json) {
//   if (err) { return console.error(err); }
//   console.log(json);
// });


// Setup xoauth2
// var generator = xoauth2.createXOAuth2Generator({
// 	user: process.env.GMAILUSER,
// 	clientID: process.env.GMAILCLIENTID,
// 	clientSecret: process.env.GMAILCLIENTSECRET,
// 	refreshToken: process.env.GMAILREFRESH
// });

// // Listen for tokens
// generator.on('token', function(token) {
// 	console.log('New token for %s: %s', token.user, token.accessToken);
// });

// Login
// var transporter = nodemailer.createTransport({
// 	service: 'gmail',
// 	auth: {
// 		user: process.env.GMAILUSER,
// 		pass: process.env.GMAILPASS,
// 		xoauth2: generator
// 	}
// });

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

// exports.transporter = transporter;

exports.sendAppointmentConfirmation = function (userEmail, guideEmail, date, time, aptID, hostName) {
	var link = hostName + "/appointmentInfo/" + aptID;

	var mailOptions = {
		from: "College Connect JHU <collegeconnectjhu@gmail.com>",
		to: userEmail,
		cc: guideEmail,
		subject: "Appointment Scheduled",
		html: "<html>Hi! You have a new guide appointment on " + date + " at " + time + ". We're looking forward to seeing you! <br> Link: " + link + " </html>"
	}

	console.log(userEmail);
	console.log(guideEmail);

	sendgrid.send(mailOptions, function (error, info) {
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

	sendgrid.send(mailOptions, function (error, info) {
		if (error) {
			return console.log(error);
		}
	});
}

exports.sendGuideSignup = function (guideObject, secretID, hostName) {
	var link = hostName + "/api/admin/activate/" + guideObject.email + "/" + secretID;
	var adminOptions = {
		from: "College Connect JHU <collegeconnect.jhu@gmail.com>",
		to: process.env.ADMINEMAIL,
		subject: "Guide Registration",
		html: "<html>Hi. " + guideObject.name +" has requested to be registered as a guide. <br> Their email address is " + guideObject.email + " and their major is " + guideObject.major +". <br> Activation link for their profile: " + link + "</html>"
	}

	var guideOptions = {
		from: "College Connect JHU <collegeconnect.jhu@gmail.com>",
		to: guideObject.email,
		subject: "Registration Confirmation",
		html: "<html>Thanks for applying to be a guide! Please wait for an admin to activate your account. You'll receive an email when that happens. </html>"
	}

	sendgrid.send(adminOptions, function (error, info) {
		if (error) {
			return console.log(error);
		}
	});

	sendgrid.send(guideOptions, function (error, info) {
		if (error) {
			return console.log(error);
		}
	});
}

exports.sendGuideActivation = function (guideObject, hostName) {
	var mailOptions = {
		from: "College Connect JHU <collegeconnect.jhu@gmail.com>",
		to: guideObject.email,
		subject: "Account Activated",
		text: "Hi",
		html: "<html>Hi " + guideObject.name + "! Your account has been activated. Get started at " + hostName + "/profile </html>"
	}

	sendgrid.send(mailOptions, function (error, info) {
		if (error) {
			return console.log(error);
		}
	});
}
