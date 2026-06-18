module.exports = {
  apps: [
    {
      // Application Configuration
      name: 'dhruval-erp-server',
      script: './dist/start.js',
      cwd: '/www/wwwroot/Dhruval-Erp/server',

      // Process Management
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster',

      // Environment Configuration
      env: {
        NODE_ENV: 'development',
        PORT: 4000,
        HOST: 'localhost'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
        HOST: '0.0.0.0'
      },

      // Logging Configuration
      log_file: '/var/log/dhruval-erp/combined.log',
      out_file: '/var/log/dhruval-erp/out.log',
      error_file: '/var/log/dhruval-erp/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      log_type: 'json',
      merge_logs: true,

      // Memory Management
      max_memory_restart: '1G',

      // Restart Configuration
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      autorestart: true,

      // Watch Configuration (disabled for production)
      watch: false,
      ignore_watch: [
        'node_modules',
        'logs',
        'uploads',
        '.git',
        '*.log'
      ],

      // Graceful Shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,
      shutdown_with_message: true,

      // Environment File
      env_file: '.env.local',

      // Cron Restart (daily at 3 AM for maintenance)
      cron_restart: '0 3 * * *',

      // Advanced Options
      time: true,
      source_map_support: true,
      instance_var: 'INSTANCE_ID',

      // Node.js Options
      node_args: [
        '--max-old-space-size=1024',
        '--optimize-for-size'
      ],

      // Process Monitoring
      monitoring: true,
      pmx: true
    }
  ],

  // Deployment Configuration
  deploy: {
    production: {
      user: 'root',
      host: ['server.dhruvalexim.com'],
      ref: 'origin/main',
      repo: 'https://github.com/CoderMasters4/Dhruval-Erp.git',
      path: '/www/wwwroot/Dhruval-Erp',
      ssh_options: 'StrictHostKeyChecking=no',

      // Pre-deployment commands
      'pre-deploy-local': 'echo "Starting deployment to production..."',

      // Post-deployment commands
      'post-deploy': [
        'cd server',
        'cp .env.production .env.local',
        'pnpm install --prod',
        'pnpm build',
        'mkdir -p /var/log/dhruval-erp',
        'pm2 reload ecosystem.config.js --env production',
        'pm2 save'
      ].join(' && '),

      // Pre-setup commands
      'pre-setup': [
        'mkdir -p /www/wwwroot/Dhruval-Erp',
        'mkdir -p /var/log/dhruval-erp',
        'chown -R www-data:www-data /var/log/dhruval-erp'
      ].join(' && '),

      // Post-setup commands
      'post-setup': [
        'pm2 install pm2-logrotate',
        'pm2 set pm2-logrotate:max_size 10M',
        'pm2 set pm2-logrotate:retain 30',
        'pm2 startup',
        'pm2 save'
      ].join(' && ')
    },

    staging: {
      user: 'root',
      host: ['staging.dhruvalexim.com'],
      ref: 'origin/develop',
      repo: 'https://github.com/CoderMasters4/Dhruval-Erp.git',
      path: '/www/wwwroot/Dhruval-Erp-Staging',
      ssh_options: 'StrictHostKeyChecking=no',

      'pre-deploy-local': 'echo "Starting deployment to staging..."',

      'post-deploy': [
        'cd server',
        'cp .env.example .env',
        'pnpm install',
        'pnpm build',
        'pm2 reload ecosystem.config.js --env staging',
        'pm2 save'
      ].join(' && ')
    }
  }
};
