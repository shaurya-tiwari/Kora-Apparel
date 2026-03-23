module.exports = {
  apps: [
    {
      name: 'kora-backend',
      script: './server.js',
      instances: 'max', // Leverages all available CPU cores for clustering
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    }
  ]
};
