const express = require("express");
const http = require("http");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

require("dotenv").config();

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is required");
}

const app = express();
const PORT = process.env.PORT || 3031;

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
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

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

http.createServer(app).listen(PORT, () => {
  const env = process.env.NODE_ENV || "development";
  const version = process.env.VERSION || "1.0.0";
  const baseUrl = `http://localhost:${PORT}`;

  console.log("Birchwood API started");
  console.log(`  environment : ${env}`);
  console.log(`  version     : ${version}`);
  console.log(`  listening   : ${baseUrl}`);
  console.log(`  health      : ${baseUrl}/api/health`);
});
