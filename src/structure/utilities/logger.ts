import pino from 'pino';

export const logger = pino(
  {
    level: process.argv.includes('--debug') ? 'debug' : 'info'
  },
  pino.transport({
    targets: [
      {
        target: 'pino-pretty',
        level: process.argv.includes('--debug') ? 'debug' : 'info',
        options: { ignore: 'pid,hostname', translateTime: 'SYS:yyyy-mm-dd HH:MM:ss' }
      },
      {
        target: 'pino/file',
        options: { destination: `${__dirname}/../../../pino.log` }
      }
    ]
  })
);
