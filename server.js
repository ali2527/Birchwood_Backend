const express = require("express");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const helmet = require("helmet");
const http = require("http");
const https = require("https");
const fs = require("fs");
const morgan = require("morgan");

require("dotenv").config();

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is required");
}

const app = express();

require("./config/db");

const allowedOrigins = (process.env.CORS_ORIGIN || "*")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204,
  allowedHeaders:
    "Content-Type, Authorization, X-Requested-With, Accept, VERSION",
  exposedHeaders:
    "Content-Type, Authorization, X-Requested-With, Accept, VERSION",
};

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(cors(corsOptions));
app.use(morgan(process.env.NODE_ENV === "production" || process.env.NODE_ENV === "live" ? "combined" : "dev"));
app.use(express.json({ limit: "2mb" }));

const limiter = rateLimit({
  max: 2000,
  windowMs: 15 * 60 * 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again later",
});

app.use("/api", limiter);
app.use("/Uploads", express.static("./Uploads"));
app.use("/api", require("./Routes/index"));

app.get("/", (req, res) => {
  res.send("Birchwood Server Running");
});

const port = Number(process.env.PORT) || 3031;
const useHttps = process.env.USE_HTTPS === "true";

let server;

if (useHttps) {
  const credentials = {
    key: fs.readFileSync("./certs/ssl.key"),
    cert: fs.readFileSync("./certs/ssl.crt"),
    ca: fs.readFileSync("./certs/ca-bundle"),
  };
  server = https.createServer(credentials, app);
} else {
  server = http.createServer(app);
}

server.listen(port, () => {
  console.log(`Listening on port ${port} (${useHttps ? "https" : "http"})`);
});
