module.exports = {
  apps: [
    {
      name: "jadara-api",
      script: "dist/src/index.js",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "500M",
      error_file: "logs/err.log",
      out_file: "logs/out.log",
      merge_logs: true,
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
