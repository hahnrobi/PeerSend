module.exports = {
  apps: [
    {
      name: 'peersend',
      script: './dist/apps/api/main.js',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      mode: 'fork',
      max_memory_restart: '100M',
    },
  ],
};
