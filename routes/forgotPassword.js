const express = require("express");

const randomstring = require("randomstring");

const nodemailer = require("nodemailer");

const url = process.env.DB_CONNECTION;

const MongoClient = require("mongodb").MongoClient;

const sendUrl = "http://localhost:5000/forgotPassword/";

var _require2 = require("../services/hashingService"),
	generateHash = _require2.generateHash;

require("dotenv/config");

const forgotPasswordRouter = express.Router();

let transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.gmailUserName,
		pass: process.env.gmailPassword,
	},
});

forgotPasswordRouter.post("/", (req, res) => {
	console.log("Inside forgot password");

	let username = req.body.username;

	MongoClient.connect(url, function (err, db) {
		if (err) throw err;
		const dbo = db.db("pinterest-users");

		dbo
			.collection("Users")
			// Get the user details
			.findOne({ username }, function (err, result) {
				if (err) throw err;

				if (result !== null) {
					let randomString = randomstring.generate({
						length: 18,
						charset: "alphanumeric",
					});

					const myquery = { username: username };

					dbo
						.collection("ResetPassword")
						.findOne(myquery, function (err, result) {
							if (err) throw err;
							if (result !== null)
								dbo
									.collection("ResetPassword")
									.deleteOne(myquery, function (err, obj) {
										if (err) throw err;
										console.log("1 document deleted");
										db.close();
									});

							db.close();
						});

					dbo
						.collection("ResetPassword")
						.createIndex({ createdAt: 1 }, { expireAfterSeconds: 1200000 });

					dbo.collection("ResetPassword").insertOne(
						{
							createdAt: new Date(),
							username: username,
							string: randomString,
						},
						function (err, res) {
							if (err) throw err;
							console.log("Random string Inserted");
							db.close();
						}
					);

					let mailOptions = {
						from: process.env.gmailUserName,
						to: username,
						subject: "Reset Pinterest Password.",
						text:
							"The given link will be expires in 2 min: " +
							sendUrl +
							randomString,
					};

					transporter.sendMail(mailOptions, (err, data) => {
						if (err) {
							res.send({ message: "Error Occurs", linkSent: false });
						} else {
							res.send({ message: "Link Sent", linkSent: true });
						}
					});
					res.send({ message: "user found!!", linkSent: true });
				} else {
					res.send({ message: "No user found!!", linkSent: false });
				}
			});
	});
});

forgotPasswordRouter.get("/:randomString", (req, res) => {
	let randomString = req.params.randomString;
	console.log(randomString);

	MongoClient.connect(url, function (err, db) {
		if (err) throw err;
		var dbo = db.db("pinterest-users");
		dbo
			.collection("ResetPassword")
			.findOne({ string: randomString }, function (err, result) {
				if (err) throw err;
				if (result !== null) {
					console.log(result.username);

					res.redirect("http://localhost:3000/resetPassword");
				} else {
					console.log({ message: "Link Expired", reset: false });
					res.redirect("http://localhost:3000/invalid");
				}
				db.close();
			});
	});
c});

forgotPasswordRouter.post("/changePassword", async (req, response) => {
	const email = req.body.username;
	const password = req.body.password;

	MongoClient.connect(process.env.DB_CONNECTION, async function (err, db) {
		if (err) throw err;
		var dbo = db.db("pinterest-users");

		let resetToken = await dbo
			.collection("ResetPassword")
			.findOne({ username: email });

		if (resetToken !== null) {
			let data = await dbo
				.collection("Users") // Get the user details
				.findOne({
					username: email,
				});
			console.log(data.password);

			if (data !== null) {
				if (data.username === email) {
					generateHash(password)
						.then(function (passwordHash) {
							var myobj = {
								password: passwordHash,
							};
							console.log(passwordHash);

							var myquery = { username: email };
							var newvalues = {
								$set: { password: passwordHash },
							};

							dbo
								.collection("Users")
								.updateOne(myquery, newvalues, function (err, res) {
									if (err) {
										response.send({
											message: "Password  not changed",
											changed: false,
										});
									}
									console.log("New password updated");
									db.close();
									response.send({
										message: "Password changed",
										changed: true,
									});
								});
						})
						.catch(console.error("Unable to create password!"));
				}
			} else {
				console.log("user doesn't exists exists");
				response.send({ message: "user doesn't exists", changed: false });
			}
		} else {
			response.send({
				message: "Session Expired! Try Again!!",
				changed: false,
			});
		}
	});
});

module.exports = forgotPasswordRouter;
