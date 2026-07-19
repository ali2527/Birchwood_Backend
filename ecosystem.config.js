module.exports = {
  apps: [
    {
      name: "birchwood-backend",
      script: "server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "live",
      },
    },
  ],
};
