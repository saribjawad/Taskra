import express, { Request } from 'express';
import routes from './routes';
import { ErrorHandlerMiddleware } from './middlewares/errorHandler.middleware';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { env } from './config/env';
import { createServer } from 'node:http';
import { initWebSocket } from './websockets/init';

const app = express();
app.use(
  cors({
    origin: env.APP_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/v1', routes);

const server = createServer(app);

// Initialize websocket
initWebSocket(server);

// Global error handler
app.use(ErrorHandlerMiddleware);

export default server;
