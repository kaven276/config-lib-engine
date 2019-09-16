module.exports = {
  apps: [{
    name: 'config',
    script: '.',
    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    args: '',
    instances: '2',
    autorestart: true,
    kill_timeout: 10 * 1000, // 从发出停止 SIGINT 信号到强制停止等待的时间，给一分钟在途请求处理时间
    wait_ready: true,
    watch: false,
    max_memory_restart: '100M',
    merge_logs: true,
    env: {
      NODE_ENV: 'development',
      PORT: 3019,
    },
    env_test: {
      NODE_ENV: 'development',
      ENV: 'test',
    },
    env_prod: {
      NODE_ENV: 'production',
      ENV: 'prod',
    },
    env_stage: {
      NODE_ENV: 'development',
      ENV: 'stage',
    },
  },
  ],
};
