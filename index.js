const express = require("express");

const bodyParser = require("body-parser");

const loginRouter = require("./routes/login");

const registerRouter = require("./routes/register");

const cookieParser = require("cookie-parser");

const forgotPasswordRouter = require("./routes/forgotPassword");

const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 5000;

const imageRoute = require("./routes/getImages");

app.use(bodyParser.urlencoded({ extended: false }));

app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header(
		"Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content-Type, Accept"
	);
	next();
});

// parse application/json
app.use(bodyParser.json());

app.use(cookieParser()).use(express.static("public")).use(bodyParser.json());

app.use("/getImages", imageRoute);

app.use("/", loginRouter);

app.use("/register", registerRouter);

app.use("/forgotPassword", forgotPasswordRouter);

app.listen(PORT, () => console.log(`Server started on ${PORT}`));
