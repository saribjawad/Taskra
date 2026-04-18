import { format, createLogger, transports } from 'winston';

const { combine, timestamp, printf, colorize } = format;

// Logger format
const myFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

const logger = createLogger({
  level: 'info',
  format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), myFormat),
  transports: [new transports.Console()],
});

export default logger;
