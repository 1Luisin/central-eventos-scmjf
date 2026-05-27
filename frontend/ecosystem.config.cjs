module.exports = {
  apps: [
    {
      name: "central-eventos-frontend",
      cwd: __dirname,
      script: "npm",
      args: "run start",
      env: {
        NODE_ENV: "production",
        HOSTNAME: process.env.HOSTNAME || "0.0.0.0",
        PORT: process.env.PORT || "4006",
        BACKEND_API_BASE_URL: process.env.BACKEND_API_BASE_URL || "http://127.0.0.1:8006",
        FRONTEND_SESSION_SECURE: process.env.FRONTEND_SESSION_SECURE || "false",
        FRONTEND_SESSION_SECRET: process.env.FRONTEND_SESSION_SECRET
      }
    }
  ]
};
