//imports
const express = require("express");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const https = require("https");
const User = require("./Models/User");
const Coach = require("./Models/Teacher");
const http = require("http");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const helmet = require("helmet");
const { v4: uuidv4 } = require("uuid");
const { initializeWebSocket } = require("./config/socket");
const getRedisClient = require('./config/redisClient.js'); 

require("./config/cronjob.js");
require("dotenv").config();

// app initilize
const app = express();

// db initilize
require("./config/db");

//register middleware
const coreOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204,
  allowedHeaders:
    "Content-Type, Authorization, X-Requested-With, Accept, VERSION",
  exposedHeaders:
    "Content-Type, Authorization, X-Requested-With, Accept, VERSION",
};
app.use(cors(coreOptions));
app.use(morgan("dev"));
app.use(express.json());
// app.use(helmet()); // Adding helmet for security headers


// process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

// const local = false;
// let credentials = {};

// if (local) {
//   credentials = {
//     key: fs.readFileSync("/etc/apache2/ssl/onlinetestingserver.key", "utf8"),
//     cert: fs.readFileSync("/etc/apache2/ssl/onlinetestingserver.crt", "utf8"),
//     ca: fs.readFileSync("/etc/apache2/ssl/onlinetestingserver.ca")
//   };
// } else {
//   credentials = {
//     key: fs.readFileSync("./certs/ssl.key"),
//     cert: fs.readFileSync("./certs/ssl.crt"),
//     ca: fs.readFileSync("./certs/ca-bundle")
//   };
// }


// HTTP only for now — do not read certs on boot (missing certs crash the process → nginx 503).
// To enable HTTPS later, load credentials then use https.createServer(credentials, app).
var httpsServer = http.createServer(app);

initializeWebSocket(httpsServer);
//limiting the api calls
const limiter = rateLimit({
  max: 1000000,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});

app.use("/api", limiter);

//static routes
app.use("/Uploads", express.static("./Uploads"));


// health check route
app.get("/api/health", (_, res) => {
  res.status(200).json({ status: "ok" });
});


// routes register
app.use("/api", require("./Routes/index"));

//test route
app.get("/", (req, res) => {
  res.send("Birchwood Server Running");
});

httpsServer.listen(8201, () => {
  console.log(`Listening on port ${8201}`); 
});

