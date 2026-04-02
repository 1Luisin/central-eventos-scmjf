module.exports = {
  apps: [
    {
      name: "central-eventos-frontend",
      cwd: __dirname,
      script: "npm",
      args: "run start",
      env: {
        NODE_ENV: "production",
        BACKEND_API_BASE_URL: "http://127.0.0.1:8080",
        FRONTEND_SESSION_SECRET: process.env.FRONTEND_SESSION_SECRET
      }
    }
  ]
};
