import { createLogger, transports, format } from 'winston';
import path from 'path';

// Define log file paths
const errorLogPath = path.resolve(__dirname, '../../logs/error.log');
const combinedLogPath = path.resolve(__dirname, '../../logs/combined.log');

// Create a Winston logger instance
const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        format.errors({ stack: true }),
        format.splat(),
        format.json()
    ),
    defaultMeta: { service: 'user-service' },
    transports: [
        new transports.File({ filename: errorLogPath, level: 'error' }),
        new transports.File({ filename: combinedLogPath }),
    ],
});

// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== 'production') {
    logger.add(
        new transports.Console({
            format: format.combine(
                format.colorize(),
                format.simple()
            ),
        })
    );
}

export default logger;
