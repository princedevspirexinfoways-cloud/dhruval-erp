module.exports = {
  apps: [
    {
      // Application Configuration
      name: 'dhruval-erp-client',
      script: 'npm',
      args: 'start',
      cwd: '/www/wwwroot/Dhruval-Erp/client',
      
      // Process Management
      instances: 1, // Next.js doesn't support clustering
      exec_mode: 'fork',
      
      // Environment Configuration
      env: {
        NODE_ENV: 'development',
        PORT: 4001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4001
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 4002
      },
      
      // Logging Configuration
      log_file: '/var/log/dhruval-erp/client-combined.log',
      out_file: '/var/log/dhruval-erp/client-out.log',
      error_file: '/var/log/dhruval-erp/client-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      log_type: 'json',
      merge_logs: true,
      
      // Memory Management
      max_memory_restart: '512M',
      
      // Restart Configuration
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      autorestart: true,
      
      // Watch Configuration (disabled for production)
      watch: false,
      ignore_watch: [
        'node_modules',
        '.next',
        '.git',
        '*.log',
        'public'
      ],
      
      // Graceful Shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,
      shutdown_with_message: true,
      
      // Environment File
      env_file: '.env.local',
      
      // Cron Restart (daily at 4 AM for maintenance)
      cron_restart: '0 4 * * *',
      
      // Advanced Options
      time: true,
      instance_var: 'INSTANCE_ID',
      
      // Node.js Options
      node_args: [
        '--max-old-space-size=512'
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
      host: ['erp.dhruvalexim.com'],
      ref: 'origin/main',
      repo: 'https://github.com/CoderMasters4/Dhruval-Erp.git',
      path: '/www/wwwroot/Dhruval-Erp',
      ssh_options: 'StrictHostKeyChecking=no',
      
      // Pre-deployment commands
      'pre-deploy-local': 'echo "Starting client deployment to production..."',
      
      // Post-deployment commands
      'post-deploy': [
        'cd client',
        'cp .env.production .env.local',
        'pnpm install --prod',
        'pnpm run build',
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
      
      'pre-deploy-local': 'echo "Starting client deployment to staging..."',
      
      'post-deploy': [
        'cd client',
        'cp .env.example .env.local',
        'pnpm install',
        'pnpm run build',
        'pm2 reload ecosystem.config.js --env staging',
        'pm2 save'
      ].join(' && ')
    }
  }
};
