module.exports = {
  apps: [{
    name: 'floodrisk-impact-api',
    script: './impact-summary.mjs',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      DB_HOST: '10.0.0.205',
      DB_PORT: 5432,
      DB_NAME: 'postgres',
      DB_USER: 'postgres',
      DB_PASSWORD: 'maltanadirSRV0'
    }
  }]
};
