function parseAllowedOrigins() {
  return (process.env.CORS_ORIGIN || "*")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

function hostnameOf(value) {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function isOriginAllowed(origin, allowedOrigins = parseAllowedOrigins()) {
  if (!origin) return true;
  if (allowedOrigins.includes("*")) return true;

  const normalized = origin.replace(/\/$/, "");
  if (allowedOrigins.includes(normalized)) return true;

  const host = hostnameOf(origin);
  if (!host) return false;

  return allowedOrigins.some((allowed) => {
    if (allowed === "*") return true;
    const allowedHost = hostnameOf(allowed);
    if (!allowedHost) return allowed === normalized;
    const root = allowedHost.replace(/^www\./, "");
    return host === allowedHost || host === root || host.endsWith(`.${root}`);
  });
}

function originDelegate(allowedOrigins) {
  return (origin, callback) => {
    if (isOriginAllowed(origin, allowedOrigins)) {
      return callback(null, true);
    }
    return callback(null, false);
  };
}

function getCorsOptions() {
  const allowedOrigins = parseAllowedOrigins();
  return {
    origin: originDelegate(allowedOrigins),
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
    allowedHeaders:
      "Content-Type, Authorization, X-Requested-With, Accept, VERSION",
    exposedHeaders:
      "Content-Type, Authorization, X-Requested-With, Accept, VERSION",
  };
}

function getSocketCors() {
  const allowedOrigins = parseAllowedOrigins();
  if (allowedOrigins.includes("*")) {
    return {
      origin: true,
      methods: ["GET", "POST"],
      credentials: true,
    };
  }

  return {
    origin: originDelegate(allowedOrigins),
    methods: ["GET", "POST"],
    credentials: true,
  };
}

module.exports = {
  parseAllowedOrigins,
  isOriginAllowed,
  getCorsOptions,
  getSocketCors,
};
