const express = require("express");

const registerRouter = express.Router();

const randomstring = require("randomstring");

const MongoClient = require("mongodb").MongoClient;

const nodemailer = require("nodemailer");

const sendUrl = "http://localhost:5000/register/";

var _require2 = require("../services/hashingService"),
	generateHash = _require2.generateHash,
	validateHash = _require2.validateHash;

require("dotenv/config");

const createUser = (email, password, age) => {};

let transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.gmailUserName,
		pass: process.env.gmailPassword,
	},
});

registerRouter.post("/", async (req, response) => {
	const email = req.body.username;
	const password = req.body.password;
	const age = req.body.age;

	MongoClient.connect(process.env.DB_CONNECTION, async function (err, db) {
		if (err) throw err;
		var dbo = db.db("pinterest-users");

		let data = await dbo
			.collection("Users") // Get the user details
			.findOne({
				username: email,
			});

		if (data === null || data.username !== email) {
			generateHash(password)
				.then(function (passwordHash) {
					let myobj = {
						username: email,
						password: passwordHash,
						age: age,
						status: "inactive",
					};

					let randomString = randomstring.generate({
						length: 18,
						charset: "alphanumeric",
					});

					dbo.collection("VerifyUser").insertOne(
						{
							createdAt: new Date(),
							username: email,
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
						to: email,
						subject: "Verify User.",
						text:
							"The given link will expire in 1 min: " + sendUrl + randomString,
					};

					transporter.sendMail(mailOptions, (err, data) => {
						if (err) {
							console.log(err);
						} else {
							console.log("Mail Sent");
						}
					});

					dbo.collection("Users").insertOne(myobj, function (err, res) {
						if (err) throw err;
						console.log("User password Inserted");
						db.close();

						response.send({ message: "user created", created: true });
					});
				})
				.catch(console.error("Unable to create password!"));
		} else {
			console.log("user already exists");
			response.send({ message: "user already exists", created: false });
		}
	});
});

registerRouter.get("/:randomString", (req, res) => {
	let randomString = req.params.randomString;
	console.log(randomString);

	MongoClient.connect(process.env.DB_CONNECTION, function (err, db) {
		if (err) throw err;
		var dbo = db.db("pinterest-users");
		dbo
			.collection("VerifyUser")
			.findOne({ string: randomString }, function (err, result) {
				if (err) throw err;
				if (result !== null) {
					console.log(result.username);

					var myquery = { username: result.username };
					var newvalues = {
						$set: { status: "active" },
					};

					dbo
						.collection("Users")
						.updateOne(myquery, newvalues, function (err, res) {
							if (err) {
								res.send({
									message: "Status not changed",
									changed: false,
								});
							}
							console.log("Status updated");
							db.close();
							res.send({
								message: "Status changed",
								changed: true,
							});
						});

					res.redirect("http://localhost:3000/userVerified");
				} else {
					console.log({ message: "Link Expired", reset: false });
					res.redirect("http://localhost:3000/invalidLink");
				}
				db.close();
			});
	});
});

module.exports = registerRouter;
