const express = require("express");

const axios = require("axios");

const imageRoute = express.Router();

imageRoute.post("/", async (req, res) => {
	let client_id = "laNoZ3UHuGuxH6szGpcyKBSAhicWCmKYcmjxxOL6Hrs";

	let url = `https://api.unsplash.com/search/photos?per_page=50?&query=${req.body.search}&client_id=${client_id}`;

	try {
		const response = await axios.get(url);
		console.log(response.data);
		res.send(response.data);
	} catch (error) {
		console.error(error);
		res.send(error);
	}
});

module.exports = imageRoute;
