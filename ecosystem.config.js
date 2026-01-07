module.exports = {
  apps: [
    {
      name: 'auraa-agent-worker',
      script: 'npx',
      args: 'tsx scripts/agentWorker.ts',
      cwd: '/home/ghost/VS_code_Projects/Auraa-AI',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
      env_file: '.env',
      error_file: 'logs/worker-error.log',
      out_file: 'logs/worker-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      restart_delay: 5000,
      exp_backoff_restart_delay: 100,
    },
  ],
};
