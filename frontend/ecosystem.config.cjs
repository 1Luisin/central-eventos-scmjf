module.exports = {
  apps: [
    {
      name: "central-eventos-frontend",
      cwd: __dirname,
      script: "npm",
      args: "run start",
      env: {
        NODE_ENV: "production",
        HOSTNAME: "172.18.2.246",
        PORT: "3000",
        BACKEND_API_BASE_URL: "http://172.18.2.246:8080",
        FRONTEND_SESSION_SECURE: "false",
        FRONTEND_SESSION_SECRET: process.env.FRONTEND_SESSION_SECRET
      }
    }
  ]
};
