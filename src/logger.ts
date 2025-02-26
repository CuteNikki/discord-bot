import pino from 'pino';

export default pino(
  {
    level: process.argv.includes('--debug') ? 'debug' : 'info',
  },
  pino.transport({
    targets: [
      {
        target: 'pino-pretty',
        level: process.argv.includes('--debug') ? 'debug' : 'info',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'SYS:yyyy/mm/dd HH:MM:ss',
        },
      },
      {
        target: 'pino/file',
        options: { destination: `${process.cwd()}/logs/pino.log` },
      },
    ],
  })
);
